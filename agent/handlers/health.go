package handlers

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/shogun/agent/config"
)

// Activity tracks the last user activity time for idle detection.
type Activity struct {
	mu           sync.RWMutex
	lastActivity time.Time
	startTime    time.Time
	cfg          *config.Config
	idleReported bool
}

// NewActivity creates a new activity tracker and starts the idle check loop.
func NewActivity(cfg *config.Config) *Activity {
	a := &Activity{
		lastActivity: time.Now(),
		startTime:    time.Now(),
		cfg:          cfg,
	}
	go a.idleCheckLoop()
	return a
}

// Touch records user activity.
func (a *Activity) Touch() {
	a.mu.Lock()
	a.lastActivity = time.Now()
	a.idleReported = false
	a.mu.Unlock()
}

// IdleSeconds returns seconds since last activity.
func (a *Activity) IdleSeconds() float64 {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return time.Since(a.lastActivity).Seconds()
}

// LastActivity returns the last activity time.
func (a *Activity) LastActivity() time.Time {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.lastActivity
}

func (a *Activity) idleCheckLoop() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	for range ticker.C {
		a.mu.RLock()
		idle := time.Since(a.lastActivity).Seconds()
		threshold := float64(a.cfg.IdleTimeoutSeconds)
		reported := a.idleReported
		a.mu.RUnlock()

		if idle >= threshold && !reported {
			a.mu.Lock()
			a.idleReported = true
			a.mu.Unlock()
			a.reportIdle()
		}
	}
}

func (a *Activity) reportIdle() {
	if a.cfg.APIInternalURL == "" {
		log.Println("idle threshold exceeded but API_INTERNAL_URL not configured")
		return
	}

	payload, _ := json.Marshal(map[string]interface{}{
		"machine_id":   a.cfg.MachineID,
		"idle_seconds": a.IdleSeconds(),
	})

	url := a.cfg.APIInternalURL + "/internal/machines/" + a.cfg.MachineID + "/idle"
	resp, err := http.Post(url, "application/json", bytes.NewReader(payload))
	if err != nil {
		log.Printf("failed to report idle: %v", err)
		return
	}
	resp.Body.Close()
	log.Printf("reported idle to API (status=%d)", resp.StatusCode)
}

// HealthHandler returns the health check HTTP handler.
func HealthHandler(activity *Activity) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":        "ok",
			"uptime":        time.Since(activity.startTime).Seconds(),
			"last_activity": activity.LastActivity().UTC().Format(time.RFC3339),
			"idle_seconds":  activity.IdleSeconds(),
		})
	}
}
