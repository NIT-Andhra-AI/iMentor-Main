package middleware

import (
	"net/http"
	"sync"
	"time"
)

type clientLimiter struct {
	tokens     int
	lastRefill time.Time
}

// RateLimiter manages thread-safe token bucket rate limiting per IP
type RateLimiter struct {
	mu            sync.Mutex
	clients       map[string]*clientLimiter
	maxTokens     int
	refillRate    time.Duration
	cleanInterval time.Duration
	stopChan      chan struct{}
}

// NewRateLimiter creates a new RateLimiter instance
func NewRateLimiter(limitPerMin int) *RateLimiter {
	rl := &RateLimiter{
		clients:       make(map[string]*clientLimiter),
		maxTokens:     limitPerMin,
		refillRate:    time.Minute,
		cleanInterval: 5 * time.Minute,
		stopChan:      make(chan struct{}),
	}

	go rl.cleanupRoutine()
	return rl
}

func (rl *RateLimiter) allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	client, exists := rl.clients[ip]
	if !exists {
		rl.clients[ip] = &clientLimiter{
			tokens:     rl.maxTokens - 1,
			lastRefill: now,
		}
		return true
	}

	// Refill tokens based on elapsed time
	elapsed := now.Sub(client.lastRefill)
	if elapsed > rl.refillRate {
		client.tokens = rl.maxTokens
		client.lastRefill = now
	}

	if client.tokens > 0 {
		client.tokens--
		return true
	}

	return false
}

func (rl *RateLimiter) cleanupRoutine() {
	ticker := time.NewTicker(rl.cleanInterval)
	defer ticker.Stop()
	for {
		select {
		case <-rl.stopChan:
			return
		case <-ticker.C:
			rl.mu.Lock()
			now := time.Now()
			for ip, client := range rl.clients {
				if now.Sub(client.lastRefill) > 10*time.Minute {
					delete(rl.clients, ip)
				}
			}
			rl.mu.Unlock()
		}
	}
}

// Stop terminates the background cleanup routine
func (rl *RateLimiter) Stop() {
	close(rl.stopChan)
}

// Middleware returns the HTTP middleware handler
func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
			ip = forwarded
		}

		if !rl.allow(ip) {
			http.Error(w, `{"error":"Rate limit exceeded. Please wait a moment."}`, http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}
