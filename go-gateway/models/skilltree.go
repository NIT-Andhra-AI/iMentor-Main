package models

import "time"

// SkillTreeNodeState defines student status on a specific node
type SkillTreeNodeState string

const (
	NodeLocked     SkillTreeNodeState = "LOCKED"
	NodeAvailable  SkillTreeNodeState = "AVAILABLE"
	NodeInProgress SkillTreeNodeState = "IN_PROGRESS"
	NodeMastered   SkillTreeNodeState = "MASTERED"
)

// SkillTreeNode represents a concept node within a course skill tree
type SkillTreeNode struct {
	ID            string             `json:"id"`
	Title         string             `json:"title"`
	Description   string             `json:"description"`
	CourseID      string             `json:"courseId"`
	ModuleNumber  int                `json:"moduleNumber"`
	Level         int                `json:"level"` // 1 to 5
	Prerequisites []string           `json:"prerequisites"`
	RequiredXP    int                `json:"requiredXp"`
	State         SkillTreeNodeState `json:"state"`
	MasteryScore  float64            `json:"masteryScore"` // 0.0 to 1.0
}

// UserSkillTree represents the full interactive tree graph for a student
type UserSkillTree struct {
	UserID        string                   `json:"userId"`
	CourseID      string                   `json:"courseId"`
	CourseName    string                   `json:"courseName"`
	Nodes         map[string]*SkillTreeNode `json:"nodes"`
	CompletedCount int                     `json:"completedCount"`
	TotalCount    int                      `json:"totalCount"`
	ProgressPct   float64                  `json:"progressPct"`
	LastUpdated   time.Time                `json:"lastUpdated"`
}
