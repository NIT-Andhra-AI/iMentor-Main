package handlers

import (
	"encoding/json"
	"net/http"

	"imentor/gateway/middleware"
	"imentor/gateway/services"
)

// KnowledgeHandler manages student mastery inspection and updates
type KnowledgeHandler struct {
	knowledgeService *services.KnowledgeService
}

// NewKnowledgeHandler creates a new KnowledgeHandler
func NewKnowledgeHandler(service *services.KnowledgeService) *KnowledgeHandler {
	return &KnowledgeHandler{knowledgeService: service}
}

// HandleGetState handles GET /api/knowledge-state/profile
func (h *KnowledgeHandler) HandleGetState(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.UserClaims)
	userID := "anonymous"
	if ok && claims != nil {
		userID = claims.UserID
	}

	state := h.knowledgeService.GetOrCreateState(userID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":        true,
		"knowledgeState": state,
	})
}

type updateMasteryRequest struct {
	ConceptID      string  `json:"conceptId"`
	ConceptName    string  `json:"conceptName"`
	Topic          string  `json:"topic"`
	ScoreDelta     float64 `json:"scoreDelta"`
	CognitiveLevel string  `json:"cognitiveLevel"`
}

// HandleUpdateMastery handles POST /api/knowledge-state/mastery
func (h *KnowledgeHandler) HandleUpdateMastery(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.UserClaims)
	if !ok || claims == nil {
		http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req updateMasteryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid payload"}`, http.StatusBadRequest)
		return
	}

	state := h.knowledgeService.UpdateConceptMastery(
		claims.UserID,
		req.ConceptID,
		req.ConceptName,
		req.Topic,
		req.ScoreDelta,
		req.CognitiveLevel,
	)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":        true,
		"knowledgeState": state,
	})
}
