package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/shogun/agent/auth"
	"github.com/shogun/agent/config"
	"github.com/shogun/agent/handlers"
	"github.com/shogun/agent/middleware"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	validator := auth.NewValidator(cfg.AgentMasterSecret, cfg.MachineID)
	tracker := handlers.NewActivityTracker()
	sessionMgr := handlers.NewSessionManager()

	// Start idle monitor
	handlers.StartIdleMonitor(tracker, cfg.APIInternalURL, cfg.MachineID, cfg.IdleTimeoutSeconds)

	// Build route mux
	mux := http.NewServeMux()

	// Health (no auth)
	mux.HandleFunc("GET /health", handlers.HealthHandler(tracker))

	// Exec
	mux.HandleFunc("POST /exec", handlers.ExecHandler(tracker, cfg.ExecTimeoutSeconds))

	// Files
	mux.HandleFunc("GET /files/list", handlers.ListHandler(tracker))
	mux.HandleFunc("GET /files/read", handlers.ReadHandler(tracker))
	mux.HandleFunc("POST /files/write", handlers.WriteHandler(tracker))
	mux.HandleFunc("POST /files/mkdir", handlers.MkdirHandler(tracker))
	mux.HandleFunc("DELETE /files", handlers.DeleteHandler(tracker))
	mux.HandleFunc("POST /files/upload", handlers.UploadHandler(tracker))
	mux.HandleFunc("GET /files/download", handlers.DownloadHandler(tracker))

	// PTY WebSocket
	mux.HandleFunc("GET /pty/ws", handlers.PTYHandler(tracker, sessionMgr))

	// Apply middleware stack: Recovery -> Logging -> Auth -> Handler
	handler := middleware.Recovery(
		middleware.Logging(
			middleware.Auth(validator)(mux),
		),
	)

	addr := fmt.Sprintf(":%d", cfg.Port)
	log.Printf("SHOGUN agent starting on %s (machine=%s)", addr, cfg.MachineID)

	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
