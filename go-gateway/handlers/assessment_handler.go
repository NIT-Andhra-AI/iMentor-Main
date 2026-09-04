package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"imentor/gateway/middleware"
	"imentor/gateway/models"
	"imentor/gateway/services"
)

// AssessmentHandler manages quiz generation and submission scoring
type AssessmentHandler struct {
	assessmentService *services.AssessmentService
}

// NewAssessmentHandler creates a new AssessmentHandler
func NewAssessmentHandler(assessmentService *services.AssessmentService) *AssessmentHandler {
	return &AssessmentHandler{
		assessmentService: assessmentService,
	}
}

// HandleGenerateQuiz generates a quiz (POST /api/assessment/generate-quiz)
func (h *AssessmentHandler) HandleGenerateQuiz(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		CourseID      string `json:"courseId"`
		TargetConcept string `json:"targetConcept"`
		NumQuestions  int    `json:"numQuestions"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	userID := middleware.GetUserID(r)
	if userID == "" {
		userID = "anonymous_student"
	}

	quiz, err := h.assessmentService.GenerateQuiz(userID, req.CourseID, req.TargetConcept, req.NumQuestions)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"quiz":    quiz,
	})
}

// HandleSubmitQuiz processes student answers and returns score + XP (POST /api/assessment/submit)
func (h *AssessmentHandler) HandleSubmitQuiz(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var sub models.QuizSubmission
	if err := json.NewDecoder(r.Body).Decode(&sub); err != nil {
		http.Error(w, `{"error":"Invalid submission payload"}`, http.StatusBadRequest)
		return
	}

	userID := middleware.GetUserID(r)
	if userID == "" {
		userID = "anonymous_student"
	}

	result, err := h.assessmentService.EvaluateSubmission(userID, sub)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"result":  result,
	})
}

// HandleGetQuestions gets question bank questions (GET /api/assessment/questions)
func (h *AssessmentHandler) HandleGetQuestions(w http.ResponseWriter, r *http.Request) {
	courseID := r.URL.Query().Get("courseId")
	conceptID := r.URL.Query().Get("conceptId")
	limitStr := r.URL.Query().Get("limit")

	limit := 10
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	quiz, _ := h.assessmentService.GenerateQuiz("bank_preview", courseID, conceptID, limit)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":   true,
		"questions": quiz.Questions,
	})
}
