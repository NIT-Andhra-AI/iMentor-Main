package handlers

import (
	"encoding/json"
	"net/http"

	"imentor/gateway/services"
)

// StatsHandler handles health checks and gateway operational stats
type StatsHandler struct {
	resourceQueue *services.ResourceQueueService
}

// NewStatsHandler creates a new StatsHandler
func NewStatsHandler(rq *services.ResourceQueueService) *StatsHandler {
	return &StatsHandler{resourceQueue: rq}
}

// HandleHealth returns HTTP 200 OK
func (h *StatsHandler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"healthy","service":"imentor-go-gateway"}`))
}

// HandleStats returns JSON metrics about active streams and queued tasks
func (h *StatsHandler) HandleStats(w http.ResponseWriter, r *http.Request) {
	stats := h.resourceQueue.GetStats()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"gateway": stats,
	})
}
