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
		return true // Agent runs on Fly private network; auth is via JWT.
	},
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
}

// ptySession holds a running PTY session that can survive disconnects.
type ptySession struct {
	mu           sync.Mutex
	ptmx         *os.File
	cmd          *exec.Cmd
	lastActivity time.Time
	createdAt    time.Time
	done         chan struct{}
}

// ptyManager manages named PTY sessions with resume support.
type ptyManager struct {
	mu       sync.RWMutex
	sessions map[string]*ptySession
	activity *Activity
}

func newPTYManager(activity *Activity) *ptyManager {
	m := &ptyManager{
		sessions: make(map[string]*ptySession),
		activity: activity,
	}
	go m.reapLoop()
	return m
}

// reapLoop cleans up sessions idle for over 5 minutes with no connected client.
func (m *ptyManager) reapLoop() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	for range ticker.C {
		m.mu.Lock()
		for id, sess := range m.sessions {
			sess.mu.Lock()
			idle := time.Since(sess.lastActivity)
			sess.mu.Unlock()

			if idle > 5*time.Minute {
				select {
				case <-sess.done:
					// Already exited.
				default:
					_ = sess.cmd.Process.Signal(syscall.SIGTERM)
				}
				sess.ptmx.Close()
				delete(m.sessions, id)
				log.Printf("reaped idle PTY session %s", id)
			}
		}
		m.mu.Unlock()
	}
}

func (m *ptyManager) getOrCreate(sessionID string) (*ptySession, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if sess, ok := m.sessions[sessionID]; ok {
		select {
		case <-sess.done:
			// Process exited — remove stale session and create a new one.
			delete(m.sessions, sessionID)
		default:
			return sess, nil
		}
	}

	cmd := exec.Command("/bin/bash")
	cmd.Env = append(os.Environ(),
		"TERM=xterm-256color",
		"HOME=/home/user",
		"USER=user",
		"SHELL=/bin/bash",
	)
	cmd.Dir = "/home/user"
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Credential: &syscall.Credential{
			Uid: 1000,
			Gid: 1000,
		},
		Setsid: true,
	}

	ptmx, err := pty.Start(cmd)
	if err != nil {
		return nil, err
	}

	sess := &ptySession{
		ptmx:         ptmx,
		cmd:          cmd,
		lastActivity: time.Now(),
		createdAt:    time.Now(),
		done:         make(chan struct{}),
	}

	go func() {
		_ = cmd.Wait()
		close(sess.done)
	}()

	m.sessions[sessionID] = sess
	log.Printf("created PTY session %s (pid=%d)", sessionID, cmd.Process.Pid)
	return sess, nil
}

// Global PTY manager, lazily initialized.
var (
	globalPTYManager     *ptyManager
	globalPTYManagerOnce sync.Once
)

// PTYHandler handles GET /pty/ws — upgrades to WebSocket and relays PTY I/O.
//
// WebSocket message protocol (matches terminal.ts):
//
//	Client -> Agent:
//	  { "type": "stdin",  "data": "<string>" }
//	  { "type": "resize", "cols": N, "rows": N }
//
//	Agent -> Client:
//	  { "type": "stdout", "data": "<string>" }
//	  { "type": "exit",   "code": N }
//	  { "type": "error",  "message": "<string>" }
func PTYHandler(activity *Activity) http.HandlerFunc {
	globalPTYManagerOnce.Do(func() {
		globalPTYManager = newPTYManager(activity)
	})

	return func(w http.ResponseWriter, r *http.Request) {
		activity.Touch()

		sessionID := r.URL.Query().Get("session_id")
		if sessionID == "" {
			sessionID = "default"
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("websocket upgrade failed: %v", err)
			return
		}
		defer conn.Close()

		sess, err := globalPTYManager.getOrCreate(sessionID)
		if err != nil {
			log.Printf("failed to create PTY session: %v", err)
			msg, _ := json.Marshal(map[string]string{"type": "error", "message": "failed to create PTY session"})
			conn.WriteMessage(websocket.TextMessage, msg)
			return
		}

		// Goroutine: read from PTY, send to WebSocket client.
		stopReader := make(chan struct{})
		go func() {
			buf := make([]byte, 4096)
			for {
				select {
				case <-stopReader:
					return
				default:
				}

				n, err := sess.ptmx.Read(buf)
				if err != nil {
					msg, _ := json.Marshal(map[string]interface{}{"type": "exit", "code": 0})
					conn.WriteMessage(websocket.TextMessage, msg)
					return
				}
				if n > 0 {
					sess.mu.Lock()
					sess.lastActivity = time.Now()
					sess.mu.Unlock()
					activity.Touch()

					msg, _ := json.Marshal(map[string]string{"type": "stdout", "data": string(buf[:n])})
					if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
						return
					}
				}
			}
		}()

		// Main loop: read from WebSocket client, write to PTY.
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				log.Printf("websocket read error (session=%s): %v", sessionID, err)
				close(stopReader)
				return
			}

			sess.mu.Lock()
			sess.lastActivity = time.Now()
			sess.mu.Unlock()
			activity.Touch()

			var msg struct {
				Type string `json:"type"`
				Data string `json:"data"`
				Cols uint16 `json:"cols"`
				Rows uint16 `json:"rows"`
			}

			if err := json.Unmarshal(message, &msg); err == nil {
				switch msg.Type {
				case "stdin":
					_, _ = sess.ptmx.Write([]byte(msg.Data))
				case "resize":
					if msg.Cols > 0 && msg.Rows > 0 {
						_ = pty.Setsize(sess.ptmx, &pty.Winsize{
							Cols: msg.Cols,
							Rows: msg.Rows,
						})
					}
				}
			} else {
				// Raw bytes — treat as stdin.
				_, _ = sess.ptmx.Write(message)
			}
		}
	}
}
