package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config holds all environment-based configuration for the agent.
type Config struct {
	MachineID          string
	AgentMasterSecret  string
	Port               int
	APIInternalURL     string
	IdleTimeoutSeconds int
	ExecTimeoutSeconds int
}

// Load reads configuration from environment variables.
func Load() (*Config, error) {
	machineID := os.Getenv("MACHINE_ID")
	if machineID == "" {
		return nil, fmt.Errorf("MACHINE_ID is required")
	}

	masterSecret := os.Getenv("AGENT_MASTER_SECRET")
	if masterSecret == "" {
		return nil, fmt.Errorf("AGENT_MASTER_SECRET is required")
	}

	port := 9000
	if p := os.Getenv("AGENT_PORT"); p != "" {
		v, err := strconv.Atoi(p)
		if err != nil {
			return nil, fmt.Errorf("invalid AGENT_PORT: %w", err)
		}
		port = v
	}

	idleTimeout := 1800
	if t := os.Getenv("IDLE_TIMEOUT_SECONDS"); t != "" {
		v, err := strconv.Atoi(t)
		if err != nil {
			return nil, fmt.Errorf("invalid IDLE_TIMEOUT_SECONDS: %w", err)
		}
		idleTimeout = v
	}

	execTimeout := 30
	if t := os.Getenv("EXEC_TIMEOUT_SECONDS"); t != "" {
		v, err := strconv.Atoi(t)
		if err != nil {
			return nil, fmt.Errorf("invalid EXEC_TIMEOUT_SECONDS: %w", err)
		}
		execTimeout = v
	}

	return &Config{
		MachineID:          machineID,
		AgentMasterSecret:  masterSecret,
		Port:               port,
		APIInternalURL:     os.Getenv("API_INTERNAL_URL"),
		IdleTimeoutSeconds: idleTimeout,
		ExecTimeoutSeconds: execTimeout,
	}, nil
}
