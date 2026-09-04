package handlers

import (
	"encoding/json"
	"net/http"

	"imentor/gateway/middleware"
	"imentor/gateway/services"
)

// GamificationHandler handles XP, leaderboard, and bounty endpoints
type GamificationHandler struct {
	gamificationService *services.GamificationService
}

// NewGamificationHandler creates a new GamificationHandler
func NewGamificationHandler(service *services.GamificationService) *GamificationHandler {
	return &GamificationHandler{gamificationService: service}
}

// HandleProfile handles GET /api/gamification/profile
func (h *GamificationHandler) HandleProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.UserClaims)
	userID := "anonymous"
	if ok && claims != nil {
		userID = claims.UserID
	}

	profile := h.gamificationService.GetOrCreateProfile(userID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"profile": profile,
	})
}

// HandleLeaderboard handles GET /api/gamification/leaderboard
func (h *GamificationHandler) HandleLeaderboard(w http.ResponseWriter, r *http.Request) {
	leaderboard := h.gamificationService.GetLeaderboard(20)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":     true,
		"leaderboard": leaderboard,
	})
}

type claimBountyRequest struct {
	BountyCredits   int64 `json:"bountyCredits"`
	LearningCredits int64 `json:"learningCredits"`
}

// HandleClaimBounty handles POST /api/gamification/claim-bounty
func (h *GamificationHandler) HandleClaimBounty(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.UserClaims)
	if !ok || claims == nil {
		http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req claimBountyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request"}`, http.StatusBadRequest)
		return
	}

	credits, learningCredits := h.gamificationService.ClaimBounty(claims.UserID, req.BountyCredits, req.LearningCredits)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":         true,
		"creditsBalance":  credits,
		"learningCredits": learningCredits,
	})
}
