package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/exec"
	"sync"
	"syscall"
	"time"

	"github.com/creack/pty"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Agent is on internal network only; all origins accepted.
		return true
	},
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
}

// ptyMessage represents a message from the WebSocket client.
type ptyMessage struct {
	Type string `json:"type"`           // "stdin" or "resize"
	Data string `json:"data,omitempty"` // stdin data
	Cols uint16 `json:"cols,omitempty"` // terminal columns
	Rows uint16 `json:"rows,omitempty"` // terminal rows
}

// ptySession holds state for an active PTY session.
type ptySession struct {
	id           string
	ptmx         *os.File
	cmd          *exec.Cmd
	lastActivity time.Time
	mu           sync.Mutex
}

// SessionManager manages PTY sessions with resume support.
type SessionManager struct {
	mu       sync.RWMutex
	sessions map[string]*ptySession
}

// NewSessionManager creates a new session manager and starts the cleanup routine.
func NewSessionManager() *SessionManager {
	sm := &SessionManager{
		sessions: make(map[string]*ptySession),
	}
	go sm.cleanup()
	return sm
}

// cleanup removes sessions that have been idle for more than 5 minutes.
func (sm *SessionManager) cleanup() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		sm.mu.Lock()
		for id, sess := range sm.sessions {
			sess.mu.Lock()
			if time.Since(sess.lastActivity) > 5*time.Minute {
				log.Printf("[pty] cleaning up idle session %s", id)
				sess.ptmx.Close()
				sess.cmd.Process.Signal(syscall.SIGTERM)
				delete(sm.sessions, id)
			}
			sess.mu.Unlock()
		}
		sm.mu.Unlock()
	}
}

// getOrCreate retrieves an existing session or spawns a new one.
func (sm *SessionManager) getOrCreate(sessionID string) (*ptySession, bool, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if sess, ok := sm.sessions[sessionID]; ok {
		sess.mu.Lock()
		sess.lastActivity = time.Now()
		sess.mu.Unlock()
		return sess, true, nil
	}

	// Spawn new bash shell
	cmd := exec.Command("/bin/bash")
	cmd.Dir = "/home/user"
	cmd.Env = append(os.Environ(),
		"TERM=xterm-256color",
		"HOME=/home/user",
		"USER=user",
		"SHELL=/bin/bash",
	)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Credential: &syscall.Credential{
			Uid: 1000,
			Gid: 1000,
		},
		Setsid: true,
	}

	ptmx, err := pty.Start(cmd)
	if err != nil {
		return nil, false, err
	}

	sess := &ptySession{
		id:           sessionID,
		ptmx:         ptmx,
		cmd:          cmd,
		lastActivity: time.Now(),
	}
	sm.sessions[sessionID] = sess

	return sess, false, nil
}

// remove cleans up a session entirely.
func (sm *SessionManager) remove(sessionID string) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if sess, ok := sm.sessions[sessionID]; ok {
		sess.ptmx.Close()
		sess.cmd.Process.Signal(syscall.SIGTERM)
		delete(sm.sessions, sessionID)
	}
}

// PTYHandler handles GET /pty/ws for WebSocket-based PTY sessions.
func PTYHandler(tracker *ActivityTracker, sessionMgr *SessionManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tracker.Touch()

		sessionID := r.URL.Query().Get("session_id")
		if sessionID == "" {
			sessionID = "default"
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("[pty] websocket upgrade failed: %v", err)
			return
		}
		defer conn.Close()

		sess, resumed, err := sessionMgr.getOrCreate(sessionID)
		if err != nil {
			log.Printf("[pty] failed to create session: %v", err)
			conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"error","message":"failed to create PTY session"}`))
			return
		}

		if resumed {
			log.Printf("[pty] resumed session %s", sessionID)
		} else {
			log.Printf("[pty] created new session %s", sessionID)
		}

		// Send session info
		info, _ := json.Marshal(map[string]interface{}{
			"type":     "session",
			"id":       sessionID,
			"resumed":  resumed,
		})
		conn.WriteMessage(websocket.TextMessage, info)

		done := make(chan struct{})

		// PTY stdout -> WebSocket
		go func() {
			defer close(done)
			buf := make([]byte, 4096)
			for {
				n, err := sess.ptmx.Read(buf)
				if err != nil {
					log.Printf("[pty] read error: %v", err)
					exitMsg, _ := json.Marshal(map[string]interface{}{
						"type": "exit",
						"code": 0,
					})
					conn.WriteMessage(websocket.TextMessage, exitMsg)
					return
				}
				tracker.Touch()
				sess.mu.Lock()
				sess.lastActivity = time.Now()
				sess.mu.Unlock()

				msg, _ := json.Marshal(map[string]string{
					"type": "stdout",
					"data": string(buf[:n]),
				})
				if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
					log.Printf("[pty] write to websocket failed: %v", err)
					return
				}
			}
		}()

		// WebSocket -> PTY stdin
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				log.Printf("[pty] websocket read error: %v", err)
				break
			}

			tracker.Touch()

			var msg ptyMessage
			if err := json.Unmarshal(message, &msg); err != nil {
				// If not JSON, treat as raw stdin
				sess.ptmx.Write(message)
				continue
			}

			switch msg.Type {
			case "stdin":
				sess.ptmx.Write([]byte(msg.Data))
			case "resize":
				if msg.Cols > 0 && msg.Rows > 0 {
					pty.Setsize(sess.ptmx, &pty.Winsize{
						Cols: msg.Cols,
						Rows: msg.Rows,
					})
				}
			}

			sess.mu.Lock()
			sess.lastActivity = time.Now()
			sess.mu.Unlock()
		}

		// Client disconnected; session stays alive for resume
		log.Printf("[pty] client disconnected from session %s (kept alive for resume)", sessionID)
		<-done
	}
}
