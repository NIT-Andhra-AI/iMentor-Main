package models

import "time"

// QuestionType defines the assessment question format
type QuestionType string

const (
	QuestionMultipleChoice QuestionType = "MULTIPLE_CHOICE"
	QuestionCodeAnalysis   QuestionType = "CODE_ANALYSIS"
	QuestionConceptual     QuestionType = "CONCEPTUAL"
)

// BloomLevel represents Bloom's Taxonomy cognitive depths (L1 to L6)
type BloomLevel string

const (
	BloomL1Remember   BloomLevel = "L1_REMEMBER"
	BloomL2Understand BloomLevel = "L2_UNDERSTAND"
	BloomL3Apply      BloomLevel = "L3_APPLY"
	BloomL4Analyze    BloomLevel = "L4_ANALYZE"
	BloomL5Evaluate   BloomLevel = "L5_EVALUATE"
	BloomL6Create     BloomLevel = "L6_CREATE"
)

// AssessmentQuestion represents a single question in the bank
type AssessmentQuestion struct {
	ID             string       `json:"id"`
	ConceptID      string       `json:"conceptId"`
	CourseID       string       `json:"courseId"`
	Text           string       `json:"text"`
	Type           QuestionType `json:"type"`
	BloomLevel     BloomLevel   `json:"bloomLevel"`
	Options        []string     `json:"options,omitempty"`
	CorrectIndex   int          `json:"correctIndex,omitempty"`
	Explanation    string       `json:"explanation"`
	Difficulty     float64      `json:"difficulty"` // 0.1 to 1.0
	Prerequisites  []string     `json:"prerequisites,omitempty"`
}

// AssessmentQuiz represents a generated quiz for a student
type AssessmentQuiz struct {
	QuizID        string               `json:"quizId"`
	UserID        string               `json:"userId"`
	CourseID      string               `json:"courseId"`
	TargetConcept string               `json:"targetConcept"`
	Questions     []AssessmentQuestion `json:"questions"`
	TotalPoints   int                  `json:"totalPoints"`
	CreatedAt     time.Time            `json:"createdAt"`
}

// SubmissionAnswer represents the student's submitted response
type SubmissionAnswer struct {
	QuestionID  string `json:"questionId"`
	AnswerIndex int    `json:"answerIndex,omitempty"`
	TextAnswer  string `json:"textAnswer,omitempty"`
}

// QuizSubmission represents the full quiz submission payload
type QuizSubmission struct {
	QuizID   string             `json:"quizId"`
	Answers  []SubmissionAnswer `json:"answers"`
	Duration int                `json:"durationSec"`
}

// QuizResult represents the evaluated score, XP gain, and mastery delta
type QuizResult struct {
	QuizID         string             `json:"quizId"`
	UserID         string             `json:"userId"`
	ScorePercent   float64            `json:"scorePercent"`
	CorrectCount   int                `json:"correctCount"`
	TotalQuestions int                `json:"totalQuestions"`
	XPEarned       int                `json:"xpEarned"`
	MasteryDelta   map[string]float64 `json:"masteryDelta"` // conceptId -> delta
	Feedback       string             `json:"feedback"`
	AssessedAt     time.Time          `json:"assessedAt"`
}
