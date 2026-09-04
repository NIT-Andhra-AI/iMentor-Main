package models

import "time"

// ConceptMasteryNode tracks student understanding for a single syllabus concept
type ConceptMasteryNode struct {
	ConceptID      string    `json:"conceptId"`
	ConceptName    string    `json:"conceptName"`
	Topic          string    `json:"topic"`
	MasteryScore   float64   `json:"masteryScore"` // 0.0 to 1.0 (>= 0.8 is Mastered, <= 0.45 is Struggling)
	CognitiveLevel string    `json:"cognitiveLevel"` // "L1_CONCEPT", "L2_APPLICATION", "L3_CRITICAL"
	AttemptsCount  int       `json:"attemptsCount"`
	LastPracticed  time.Time `json:"lastPracticed"`
}

// StudentKnowledgeState models the student's holistic understanding graph
type StudentKnowledgeState struct {
	UserID           string                        `json:"userId"`
	Concepts         map[string]ConceptMasteryNode `json:"concepts"`
	StrugglingTopics []string                      `json:"strugglingTopics"`
	MasteredTopics   []string                      `json:"masteredTopics"`
	OverallMastery   float64                       `json:"overallMastery"`
	UpdatedAt        time.Time                     `json:"updatedAt"`
}

// RecomputeAggregates recalculates overall mastery and identifies struggling topics
func (s *StudentKnowledgeState) RecomputeAggregates() {
	if len(s.Concepts) == 0 {
		s.OverallMastery = 0.0
		s.StrugglingTopics = nil
		s.MasteredTopics = nil
		return
	}

	var sum float64
	var struggling []string
	var mastered []string

	for _, node := range s.Concepts {
		sum += node.MasteryScore
		if node.MasteryScore <= 0.45 {
			struggling = append(struggling, node.ConceptName)
		} else if node.MasteryScore >= 0.80 {
			mastered = append(mastered, node.ConceptName)
		}
	}

	s.OverallMastery = sum / float64(len(s.Concepts))
	s.StrugglingTopics = struggling
	s.MasteredTopics = mastered
	s.UpdatedAt = time.Now()
}
