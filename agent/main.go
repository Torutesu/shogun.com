package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/shogun/agent/config"
	"github.com/shogun/agent/handlers"
	"github.com/shogun/agent/middleware"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}

	activity := handlers.NewActivity(context.Background(), cfg)

	mux := http.NewServeMux()

	// Health check (unauthenticated — used by Fly.io).
	mux.HandleFunc("GET /health", handlers.HealthHandler(activity))

	// Shell execution.
	mux.HandleFunc("POST /exec", handlers.ExecHandler(cfg, activity))

	// File operations.
	mux.HandleFunc("GET /files/list", handlers.ListHandler(activity))
	mux.HandleFunc("GET /files/read", handlers.ReadHandler(activity))
	mux.HandleFunc("POST /files/write", handlers.WriteHandler(activity))
	mux.HandleFunc("POST /files/mkdir", handlers.MkdirHandler(activity))
	mux.HandleFunc("DELETE /files", handlers.DeleteHandler(activity))
	mux.HandleFunc("POST /files/upload", handlers.UploadHandler(activity))
	mux.HandleFunc("GET /files/download", handlers.DownloadHandler(activity))

	// PTY terminal (WebSocket).
	mux.HandleFunc("GET /pty/ws", handlers.PTYHandler(activity))

	// Middleware stack: Recovery -> Logging -> Auth -> Mux.
	var handler http.Handler = mux
	handler = middleware.Auth(cfg)(handler)
	handler = middleware.Logging(handler)
	handler = middleware.Recovery(handler)

	addr := fmt.Sprintf(":%d", cfg.Port)
	log.Printf("shogun-agent starting on %s (machine=%s)", addr, cfg.MachineID)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
