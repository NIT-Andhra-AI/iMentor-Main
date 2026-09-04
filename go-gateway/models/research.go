package models

import "time"

// ResearchStage represents the current execution stage of Deep Research
type ResearchStage string

const (
	StageDecomposing ResearchStage = "DECOMPOSING"
	StageSearching   ResearchStage = "SEARCHING"
	StageSynthesizing ResearchStage = "SYNTHESIZING"
	StageComplete    ResearchStage = "COMPLETE"
	StageFailed      ResearchStage = "FAILED"
)

// SubQueryTask represents a decomposed research sub-query
type SubQueryTask struct {
	ID        string    `json:"id"`
	Query     string    `json:"query"`
	Status    string    `json:"status"` // pending, running, completed, failed
	Findings  string    `json:"findings,omitempty"`
	Sources   []string  `json:"sources,omitempty"`
	DurationMs int64    `json:"durationMs"`
}

// DeepResearchRequest represents the incoming research initiation payload
type DeepResearchRequest struct {
	Topic           string   `json:"topic"`
	CourseID        string   `json:"courseId,omitempty"`
	Depth           string   `json:"depth,omitempty"` // "quick", "standard", "comprehensive"
	DomainFilter    []string `json:"domainFilter,omitempty"`
	MaxSubQueries   int      `json:"maxSubQueries,omitempty"`
}

// DeepResearchJob represents an active or completed research job
type DeepResearchJob struct {
	JobID           string          `json:"jobId"`
	UserID          string          `json:"userId"`
	Topic           string          `json:"topic"`
	Stage           ResearchStage   `json:"stage"`
	ProgressPercent int             `json:"progressPercent"`
	SubQueries      []SubQueryTask  `json:"subQueries"`
	FinalSynthesis  string          `json:"finalSynthesis,omitempty"`
	KeyInsights     []string        `json:"keyInsights,omitempty"`
	Citations       []string        `json:"citations,omitempty"`
	CredibilityScore float64        `json:"credibilityScore"`
	CreatedAt       time.Time       `json:"createdAt"`
	CompletedAt     *time.Time      `json:"completedAt,omitempty"`
}
