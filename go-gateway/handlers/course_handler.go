package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"imentor/gateway/middleware"
	"imentor/gateway/services"
)

// CourseHandler handles curriculum browsing and milestone updates
type CourseHandler struct {
	courseService *services.CourseService
}

// NewCourseHandler creates a new CourseHandler
func NewCourseHandler(service *services.CourseService) *CourseHandler {
	return &CourseHandler{courseService: service}
}

// HandleListCourses handles GET /api/course/list
func (h *CourseHandler) HandleListCourses(w http.ResponseWriter, r *http.Request) {
	department := r.URL.Query().Get("department")
	courses := h.courseService.ListCourses(department)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"courses": courses,
	})
}

// HandleGetCourse handles GET /api/course/detail?id=...
func (h *CourseHandler) HandleGetCourse(w http.ResponseWriter, r *http.Request) {
	courseID := r.URL.Query().Get("id")
	if courseID == "" {
		// support /api/course/{id} path parameter extraction
		pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(pathParts) > 2 {
			courseID = pathParts[2]
		}
	}

	if courseID == "" {
		http.Error(w, `{"error":"Course ID required"}`, http.StatusBadRequest)
		return
	}

	course, err := h.courseService.GetCourseByID(courseID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"course":  course,
	})
}

type progressRequest struct {
	CourseID string `json:"courseId"`
	LessonID string `json:"lessonId"`
}

// HandleUpdateProgress handles POST /api/course/progress
func (h *CourseHandler) HandleUpdateProgress(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.UserClaims)
	if !ok || claims == nil {
		http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req progressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request"}`, http.StatusBadRequest)
		return
	}

	progress := h.courseService.UpdateProgress(claims.UserID, req.CourseID, req.LessonID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"progress": progress,
	})
}
