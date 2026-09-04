package config

import (
	"os"
	"strconv"
	"time"
)

// Config holds runtime configuration for the Go Gateway
type Config struct {
	Port                string
	SGLangURL           string
	SGLangModel         string
	JWTSecret           string
	MaxBGConcurrency    int
	IdleThreshold       time.Duration
	RateLimitPerMin     int
	RequestTimeout      time.Duration
	ReadHeaderTimeout   time.Duration
	EnableStrictSocratic bool
}

// LoadConfig reads configuration from environment variables with sensible defaults
func LoadConfig() *Config {
	port := getEnv("GATEWAY_PORT", "5001")
	sglangURL := getEnv("SGLANG_URL", "http://127.0.0.1:8000")
	sglangModel := getEnv("SGLANG_MODEL", "Qwen/Qwen2.5-7B-Instruct-AWQ")
	jwtSecret := getEnv("JWT_SECRET", "imentor_default_secret_key_change_in_production")
	
	maxBG, _ := strconv.Atoi(getEnv("MAX_BG_CONCURRENCY", "2"))
	if maxBG <= 0 {
		maxBG = 2
	}

	rateLimit, _ := strconv.Atoi(getEnv("RATE_LIMIT_PER_MIN", "120"))
	if rateLimit <= 0 {
		rateLimit = 120
	}

	return &Config{
		Port:                 port,
		SGLangURL:            sglangURL,
		SGLangModel:          sglangModel,
		JWTSecret:            jwtSecret,
		MaxBGConcurrency:     maxBG,
		IdleThreshold:        2 * time.Second,
		RateLimitPerMin:      rateLimit,
		RequestTimeout:       120 * time.Second,
		ReadHeaderTimeout:    5 * time.Second,
		EnableStrictSocratic: true,
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
