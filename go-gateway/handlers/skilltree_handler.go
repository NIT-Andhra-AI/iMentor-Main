package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"imentor/gateway/middleware"
	"imentor/gateway/services"
)

// SkillTreeHandler manages student skill tree progression endpoints
type SkillTreeHandler struct {
	skillTreeService *services.SkillTreeService
}

// NewSkillTreeHandler creates a new SkillTreeHandler
func NewSkillTreeHandler(skillTreeService *services.SkillTreeService) *SkillTreeHandler {
	return &SkillTreeHandler{
		skillTreeService: skillTreeService,
	}
}

// HandleGetTree returns the user's skill tree (GET /api/skilltree/user-tree?courseId=xxx)
func (h *SkillTreeHandler) HandleGetTree(w http.ResponseWriter, r *http.Request) {
	courseID := r.URL.Query().Get("courseId")
	if courseID == "" {
		courseID = "CS601_ML"
	}

	userID := middleware.GetUserID(r)
	if userID == "" {
		userID = "anonymous_student"
	}

	tree := h.skillTreeService.GetUserTree(userID, courseID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"tree":    tree,
	})
}

// HandleCompleteNode updates node mastery and recomputes unlocks (POST /api/skilltree/complete-node)
func (h *SkillTreeHandler) HandleCompleteNode(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		CourseID string  `json:"courseId"`
		NodeID   string  `json:"nodeId"`
		Score    float64 `json:"score"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	userID := middleware.GetUserID(r)
	if userID == "" {
		userID = "anonymous_student"
	}

	tree, err := h.skillTreeService.CompleteNode(userID, req.CourseID, req.NodeID, req.Score)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"tree":    tree,
	})
}
