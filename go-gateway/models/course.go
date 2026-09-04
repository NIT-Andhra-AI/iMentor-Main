package models

import "time"

// Lesson represents an individual topic lesson in a course
type Lesson struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Summary     string   `json:"summary"`
	KeyConcepts []string `json:"keyConcepts"`
	DurationMin int      `json:"durationMin"`
}

// Module represents a course module containing multiple lessons
type Module struct {
	ID          string   `json:"id"`
	ModuleNumber int     `json:"moduleNumber"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Lessons     []Lesson `json:"lessons"`
}

// Course represents a complete academic subject curriculum
type Course struct {
	ID          string    `json:"id"`
	CourseCode  string    `json:"courseCode"`
	Title       string    `json:"title"`
	Department  string    `json:"department"`
	Semester    int       `json:"semester"`
	Modules     []Module  `json:"modules"`
	TotalTopics int       `json:"totalTopics"`
	CreatedBy   string    `json:"createdBy,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
}

// CourseProgress tracks an individual student's completion across a course
type CourseProgress struct {
	UserID             string             `json:"userId"`
	CourseID           string             `json:"courseId"`
	CompletedLessonIDs map[string]bool    `json:"completedLessonIds"`
	PercentComplete    float64            `json:"percentComplete"`
	CurrentModuleID    string             `json:"currentModuleId"`
	LastAccessedAt     time.Time          `json:"lastAccessedAt"`
}
