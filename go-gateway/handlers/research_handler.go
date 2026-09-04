package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"imentor/gateway/middleware"
	"imentor/gateway/models"
	"imentor/gateway/services"
)

// ResearchHandler manages Deep Research endpoints and SSE streaming
type ResearchHandler struct {
	researchService *services.ResearchService
	resourceQueue   *services.ResourceQueueService
}

// NewResearchHandler creates a new ResearchHandler
func NewResearchHandler(researchService *services.ResearchService, resourceQueue *services.ResourceQueueService) *ResearchHandler {
	return &ResearchHandler{
		researchService: researchService,
		resourceQueue:   resourceQueue,
	}
}

// HandleStartResearch starts a new research job (POST /api/research/start)
func (h *ResearchHandler) HandleStartResearch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req models.DeepResearchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.Topic) == "" {
		http.Error(w, `{"error":"Topic is required"}`, http.StatusBadRequest)
		return
	}

	userID := middleware.GetUserID(r)
	if userID == "" {
		userID = "anonymous_student"
	}

	job := h.researchService.CreateJob(userID, req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"job":     job,
	})
}

// HandleGetJob retrieves research status (GET /api/research/status?jobId=xxx)
func (h *ResearchHandler) HandleGetJob(w http.ResponseWriter, r *http.Request) {
	jobID := r.URL.Query().Get("jobId")
	if jobID == "" {
		http.Error(w, `{"error":"jobId query parameter is required"}`, http.StatusBadRequest)
		return
	}

	job, err := h.researchService.GetJob(jobID)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"job":     job,
	})
}

// HandleStreamResearch runs research and streams live stage updates via SSE (GET or POST /api/research/stream)
func (h *ResearchHandler) HandleStreamResearch(w http.ResponseWriter, r *http.Request) {
	jobID := r.URL.Query().Get("jobId")
	topic := r.URL.Query().Get("topic")

	userID := middleware.GetUserID(r)
	if userID == "" {
		userID = "anonymous_student"
	}

	var job *models.DeepResearchJob
	var err error

	if jobID != "" {
		job, err = h.researchService.GetJob(jobID)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusNotFound)
			return
		}
	} else if topic != "" {
		job = h.researchService.CreateJob(userID, models.DeepResearchRequest{
			Topic: topic,
		})
	} else {
		http.Error(w, `{"error":"jobId or topic parameter required"}`, http.StatusBadRequest)
		return
	}

	// Register interactive activity
	h.resourceQueue.TrackInteractiveStart()
	defer h.resourceQueue.TrackInteractiveEnd()

	// SSE Setup
	w.Header().Set("Content-Type", "text/event-stream; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, `{"error":"Streaming unsupported"}`, http.StatusInternalServerError)
		return
	}
	flusher.Flush()

	// Callback to push SSE chunks
	progressCallback := func(updatedJob *models.DeepResearchJob) {
		payload, err := json.Marshal(map[string]interface{}{
			"type":            "stage_update",
			"stage":           updatedJob.Stage,
			"progressPercent": updatedJob.ProgressPercent,
			"subQueries":      updatedJob.SubQueries,
			"finalSynthesis":  updatedJob.FinalSynthesis,
			"keyInsights":     updatedJob.KeyInsights,
			"citations":       updatedJob.Citations,
		})
		if err == nil {
			fmt.Fprintf(w, "data: %s\n\n", payload)
			flusher.Flush()
		}
	}

	// Run execution synchronously on this connection
	_ = h.researchService.ExecuteJob(r.Context(), job.JobID, progressCallback)

	donePayload, _ := json.Marshal(map[string]interface{}{
		"type": "done",
		"done": true,
	})
	fmt.Fprintf(w, "data: %s\n\n", donePayload)
	flusher.Flush()
}
