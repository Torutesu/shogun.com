package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"os/exec"
	"syscall"
	"time"
)

// ExecRequest is the JSON body for command execution.
type ExecRequest struct {
	Command string `json:"command"`
	Timeout int    `json:"timeout,omitempty"` // seconds, 0 = use default
}

// ExecResponse is the JSON response from command execution.
type ExecResponse struct {
	Stdout   string `json:"stdout"`
	Stderr   string `json:"stderr"`
	ExitCode int    `json:"exit_code"`
}

// ExecHandler handles POST /exec for shell command execution.
func ExecHandler(tracker *ActivityTracker, defaultTimeout int) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tracker.Touch()

		var req ExecRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON body")
			return
		}

		if req.Command == "" {
			writeError(w, http.StatusBadRequest, "command is required")
			return
		}

		timeout := defaultTimeout
		if req.Timeout > 0 {
			timeout = req.Timeout
		}
		// Cap at 5 minutes
		if timeout > 300 {
			timeout = 300
		}

		ctx, cancel := context.WithTimeout(r.Context(), time.Duration(timeout)*time.Second)
		defer cancel()

		cmd := exec.CommandContext(ctx, "/bin/sh", "-c", req.Command)
		cmd.Dir = "/home/user"

		// Run as the container user (UID 1000), not root
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
				writeJSON(w, http.StatusRequestTimeout, ExecResponse{
					Stdout:   stdout.String(),
					Stderr:   stderr.String() + "\n[timeout: command exceeded " + time.Duration(timeout).String() + "s limit]",
					ExitCode: 124, // Convention: 124 = timeout
				})
				return
			} else {
				exitCode = 1
			}
		}

		writeJSON(w, http.StatusOK, ExecResponse{
			Stdout:   stdout.String(),
			Stderr:   stderr.String(),
			ExitCode: exitCode,
		})
	}
}
