package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

// User represents an iMentor student, faculty, or administrator account
type User struct {
	ID                     string                 `json:"id"`
	Username               string                 `json:"username"`
	Email                  string                 `json:"email"`
	PasswordHash           string                 `json:"-"`
	IsFaculty              bool                   `json:"isFaculty"`
	IsAdmin                bool                   `json:"isAdmin"`
	Department             string                 `json:"department,omitempty"`
	PreferredLLMProvider   string                 `json:"preferredLlmProvider"` // "sglang", "gemini", "groq"
	HasCompletedOnboarding bool                   `json:"hasCompletedOnboarding"`
	Profile                UserProfile            `json:"profile"`
	CurriculumProgress     map[string]interface{} `json:"curriculumProgress,omitempty"`
	CreatedAt              time.Time              `json:"createdAt"`
	UpdatedAt              time.Time              `json:"updatedAt"`
}

// UserProfile holds personal, academic, and mastery information
type UserProfile struct {
	FirstName       string             `json:"firstName,omitempty"`
	LastName        string             `json:"lastName,omitempty"`
	Branch          string             `json:"branch,omitempty"`
	Semester        int                `json:"semester,omitempty"`
	ConceptMastery  map[string]float64 `json:"conceptMastery,omitempty"`
	QuizScores      []int              `json:"quizScores,omitempty"`
	LearningStyle   string             `json:"learningStyle,omitempty"` // "visual", "theoretical", "applied"
	TargetCognitive string             `json:"targetCognitive,omitempty"`
}

// SetPassword hashes and assigns the user's password using bcrypt
func (u *User) SetPassword(plainPassword string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.PasswordHash = string(hash)
	return nil
}

// CheckPassword verifies a plaintext password against the stored bcrypt hash
func (u *User) CheckPassword(plainPassword string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(plainPassword))
	return err == nil
}
