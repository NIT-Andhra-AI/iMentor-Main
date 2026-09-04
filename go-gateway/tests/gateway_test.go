package tests

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"imentor/gateway/handlers"
	"imentor/gateway/middleware"
	"imentor/gateway/models"
	"imentor/gateway/services"
)

func TestSocraticFormatting(t *testing.T) {
	raw := `### CONCEPT
Gradient descent optimizes neural network parameters.

### QUESTION
What happens when the learning rate is set too high?`

	formatted := services.FormatSocraticStrict(raw)

	if strings.Contains(formatted, "### CONCEPT") {
		t.Errorf("Expected '### CONCEPT' to be removed, got: %s", formatted)
	}
	if strings.Contains(formatted, "### QUESTION") {
		t.Errorf("Expected '### QUESTION' to be removed, got: %s", formatted)
	}
	if !strings.Contains(formatted, "Gradient descent optimizes") {
		t.Errorf("Expected concept content to be preserved, got: %s", formatted)
	}
	if !strings.Contains(formatted, "learning rate is set too high") {
		t.Errorf("Expected question to be preserved, got: %s", formatted)
	}
}

func TestResourceQueuePrioritiesAndYield(t *testing.T) {
	rq := services.NewResourceQueueServiceWithInterval(2, 20*time.Millisecond, 10*time.Millisecond)
	defer rq.Stop()

	// 1. Enqueue tasks with different priorities using registered task types
	idBatch, _ := rq.Enqueue("TOT_BRANCH_OFFLINE", map[string]interface{}{"data": "1"}, models.PriorityBatch, "")
	idHigh, _ := rq.Enqueue("SESSION_INSIGHTS", map[string]interface{}{"data": "2"}, models.PriorityHigh, "")

	if idBatch == "" || idHigh == "" {
		t.Errorf("Expected valid task IDs, got empty")
	}

	// 2. Verify interactive stream tracking causes queue to yield immediately
	rq.TrackInteractiveStart()
	if rq.HasAvailableResources() {
		t.Errorf("Expected HasAvailableResources to be false when interactive requests are active")
	}

	rq.TrackInteractiveEnd()
	time.Sleep(30 * time.Millisecond) // wait for idle threshold
	if !rq.HasAvailableResources() {
		t.Errorf("Expected HasAvailableResources to be true after idle threshold elapsed")
	}
}

func TestHealthAndStatsEndpoints(t *testing.T) {
	rq := services.NewResourceQueueServiceWithInterval(2, 50*time.Millisecond, 500*time.Millisecond)
	defer rq.Stop()

	statsHandler := handlers.NewStatsHandler(rq)

	req := httptest.NewRequest("GET", "/health", nil)
	rr := httptest.NewRecorder()

	statsHandler.HandleHealth(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "healthy") {
		t.Errorf("Expected healthy response, got: %s", rr.Body.String())
	}
}

func TestRateLimiter(t *testing.T) {
	limiter := middleware.NewRateLimiter(2) // limit to 2 requests
	defer limiter.Stop()

	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	wrapped := limiter.Middleware(testHandler)

	for i := 0; i < 3; i++ {
		req := httptest.NewRequest("GET", "/api/chat/message", nil)
		req.RemoteAddr = "192.168.1.100:12345"
		rr := httptest.NewRecorder()

		wrapped.ServeHTTP(rr, req)

		if i < 2 && rr.Code != http.StatusOK {
			t.Errorf("Request %d expected 200, got %d", i+1, rr.Code)
		}
		if i == 2 && rr.Code != http.StatusTooManyRequests {
			t.Errorf("Request 3 expected 429 Too Many Requests, got %d", rr.Code)
		}
	}
}
