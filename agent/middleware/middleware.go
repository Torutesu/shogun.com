package middleware

import (
	"encoding/json"
	"log"
	"net/http"
	"runtime/debug"
	"time"

	"github.com/shogun/agent/auth"
	"github.com/shogun/agent/config"
)

type errorResponse struct {
	Error string `json:"error"`
}

// responseWriter wraps http.ResponseWriter to capture the status code.
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// Auth returns middleware that validates the JWT on every request except
// GET /health (which is unauthenticated for Fly.io health checks).
func Auth(cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Health check is unauthenticated (used by Fly.io).
			if r.URL.Path == "/health" && r.Method == http.MethodGet {
				next.ServeHTTP(w, r)
				return
			}

			_, err := auth.Validate(r.Header.Get("Authorization"), cfg)
			if err != nil {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				resp, _ := json.Marshal(errorResponse{Error: "unauthorized: " + err.Error()})
				w.Write(resp)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// Logging returns middleware that logs every request with method, path,
// status code, and duration.
func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		next.ServeHTTP(rw, r)
		log.Printf("%s %s %d %s", r.Method, r.URL.Path, rw.statusCode, time.Since(start).Round(time.Microsecond))
	})
}

// Recovery returns middleware that recovers from panics and returns a 500.
func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("PANIC: %v\n%s", rec, debug.Stack())
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				w.Write([]byte(`{"error":"internal server error"}`))
			}
		}()
		next.ServeHTTP(w, r)
	})
}
