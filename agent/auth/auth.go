package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"fmt"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/shogun/agent/config"
)

// Claims represents the JWT claims for agent authentication.
type Claims struct {
	MachineID string `json:"machine_id"`
	jwt.RegisteredClaims
}

// DeriveSecret computes HMAC-SHA256(masterSecret, machineID) to produce the
// per-machine signing key.
func DeriveSecret(masterSecret, machineID string) []byte {
	h := hmac.New(sha256.New, []byte(masterSecret))
	h.Write([]byte(machineID))
	return h.Sum(nil)
}

// Validate parses and validates a JWT token from the Authorization header value.
// It checks the HMAC-SHA256 signature, expiry, and machine_id claim.
func Validate(authHeader string, cfg *config.Config) (*Claims, error) {
	if authHeader == "" {
		return nil, fmt.Errorf("missing authorization header")
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return nil, fmt.Errorf("invalid authorization header format")
	}

	tokenStr := parts[1]
	secret := DeriveSecret(cfg.AgentMasterSecret, cfg.MachineID)

	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return secret, nil
	})
	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	if claims.MachineID != cfg.MachineID {
		return nil, fmt.Errorf("machine_id mismatch: token=%s expected=%s", claims.MachineID, cfg.MachineID)
	}

	return claims, nil
}
