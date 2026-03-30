package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"os/exec"
	"syscall"
	"time"

	"github.com/shogun/agent/config"
)

// ExecRequest is the JSON body for POST /exec.
type ExecRequest struct {
	Command string `json:"command"`
	Timeout int    `json:"timeout,omitempty"` // seconds; 0 means use default
}

// ExecResponse is the JSON response from POST /exec.
type ExecResponse struct {
	Stdout   string `json:"stdout"`
	Stderr   string `json:"stderr"`
	ExitCode int    `json:"exit_code"`
}

// ExecHandler handles POST /exec — runs a shell command with timeout.
func ExecHandler(cfg *config.Config, activity *Activity) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		activity.Touch()

		var req ExecRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON body")
			return
		}

		if req.Command == "" {
			writeError(w, http.StatusBadRequest, "command is required")
			return
		}

		timeout := cfg.ExecTimeoutSeconds
		if req.Timeout > 0 {
			timeout = req.Timeout
		}
		// Cap at 5 minutes.
		if timeout > 300 {
			timeout = 300
		}

		ctx, cancel := context.WithTimeout(r.Context(), time.Duration(timeout)*time.Second)
		defer cancel()

		cmd := exec.CommandContext(ctx, "/bin/sh", "-c", req.Command)
		cmd.Dir = basePath

		// Run as the container user (UID/GID 1000), not root.
		cmd.SysProcAttr = &syscall.SysProcAttr{
			Credential: &syscall.Credential{
				Uid: 1000,
				Gid: 1000,
			},
		}

		var stdout, stderr bytes.Buffer
		cmd.Stdout = &stdout
		cmd.Stderr = &stderr

		err := cmd.Run()

		exitCode := 0
		if err != nil {
			if exitErr, ok := err.(*exec.ExitError); ok {
				exitCode = exitErr.ExitCode()
			} else if ctx.Err() == context.DeadlineExceeded {
				writeError(w, http.StatusRequestTimeout, "command timed out")
				return
			} else {
				exitCode = -1
			}
		}

		writeJSON(w, http.StatusOK, ExecResponse{
			Stdout:   stdout.String(),
			Stderr:   stderr.String(),
			ExitCode: exitCode,
		})
	}
}
