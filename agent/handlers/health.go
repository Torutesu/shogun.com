package handlers

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/shogun/agent/config"
)

// Activity tracks the last user activity time for idle detection.
type Activity struct {
	mu           sync.RWMutex
	lastActivity time.Time
	startTime    time.Time
	cfg          *config.Config
	idleReported bool
	cancel       context.CancelFunc
}

// NewActivity creates a new activity tracker and starts the idle check loop.
// The provided context controls the lifetime of the background goroutine.
func NewActivity(ctx context.Context, cfg *config.Config) *Activity {
	ctx, cancel := context.WithCancel(ctx)
	a := &Activity{
		lastActivity: time.Now(),
		startTime:    time.Now(),
		cfg:          cfg,
		cancel:       cancel,
	}
	go a.idleCheckLoop(ctx)
	return a
}

// Stop cancels the idle check loop goroutine.
func (a *Activity) Stop() {
	a.cancel()
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

func (a *Activity) idleCheckLoop(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
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
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		log.Printf("failed to create idle report request: %v", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	// Generate a JWT signed with the machine's derived secret.
	token, err := a.generateMachineJWT()
	if err != nil {
		log.Printf("failed to generate JWT for idle report: %v", err)
		return
	}
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("failed to report idle: %v", err)
		return
	}
	resp.Body.Close()
	log.Printf("reported idle to API (status=%d)", resp.StatusCode)
}

// generateMachineJWT creates a short-lived JWT signed with the machine's derived secret.
func (a *Activity) generateMachineJWT() (string, error) {
	secret := deriveSecret(a.cfg.AgentMasterSecret, a.cfg.MachineID)
	claims := jwt.MapClaims{
		"machine_id": a.cfg.MachineID,
		"iat":        time.Now().Unix(),
		"exp":        time.Now().Add(60 * time.Second).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secret)
}

// deriveSecret computes HMAC-SHA256(masterSecret, machineID).
func deriveSecret(masterSecret, machineID string) []byte {
	h := hmac.New(sha256.New, []byte(masterSecret))
	h.Write([]byte(machineID))
	return h.Sum(nil)
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
