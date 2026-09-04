package services

import (
	"fmt"
	"strings"
	"sync"
	"time"

	"imentor/gateway/models"
)

// KnowledgeService manages student mastery states and contextual memory
type KnowledgeService struct {
	mu     sync.RWMutex
	states map[string]*models.StudentKnowledgeState // keyed by UserID
}

// NewKnowledgeService creates a new KnowledgeService
func NewKnowledgeService() *KnowledgeService {
	return &KnowledgeService{
		states: make(map[string]*models.StudentKnowledgeState),
	}
}

// GetOrCreateState retrieves or creates a student knowledge state
func (s *KnowledgeService) GetOrCreateState(userID string) *models.StudentKnowledgeState {
	s.mu.Lock()
	defer s.mu.Unlock()

	state, exists := s.states[userID]
	if !exists {
		state = &models.StudentKnowledgeState{
			UserID:   userID,
			Concepts: make(map[string]models.ConceptMasteryNode),
		}
		s.states[userID] = state
	}
	return state
}

// UpdateConceptMastery updates student score on a concept and recalculates struggle/mastery lists
func (s *KnowledgeService) UpdateConceptMastery(userID, conceptID, conceptName, topic string, scoreDelta float64, cognitiveLevel string) *models.StudentKnowledgeState {
	state := s.GetOrCreateState(userID)

	s.mu.Lock()
	defer s.mu.Unlock()

	node, exists := state.Concepts[conceptID]
	if !exists {
		node = models.ConceptMasteryNode{
			ConceptID:      conceptID,
			ConceptName:    conceptName,
			Topic:          topic,
			MasteryScore:   0.5,
			CognitiveLevel: cognitiveLevel,
			AttemptsCount:  0,
		}
	}

	node.MasteryScore = clampFloat(node.MasteryScore+scoreDelta, 0.0, 1.0)
	node.AttemptsCount++
	node.LastPracticed = time.Now()
	if cognitiveLevel != "" {
		node.CognitiveLevel = cognitiveLevel
	}

	state.Concepts[conceptID] = node
	state.RecomputeAggregates()

	return state
}

// GetContextualMemoryBlock builds the prompt block injected into Socratic tutoring sessions
func (s *KnowledgeService) GetContextualMemoryBlock(userID string) string {
	state := s.GetOrCreateState(userID)

	s.mu.RLock()
	defer s.mu.RUnlock()

	if len(state.Concepts) == 0 {
		return ""
	}

	var builder strings.Builder
	builder.WriteString("=== STUDENT CONTEXTUAL MEMORY ===\n")
	builder.WriteString(fmt.Sprintf("Overall Syllabus Mastery: %.1f%%\n", state.OverallMastery*100.0))

	if len(state.StrugglingTopics) > 0 {
		builder.WriteString(fmt.Sprintf("Topics Requiring Scaffolding: %s\n", strings.Join(state.StrugglingTopics, ", ")))
	}
	if len(state.MasteredTopics) > 0 {
		builder.WriteString(fmt.Sprintf("Demonstrated Mastery: %s\n", strings.Join(state.MasteredTopics, ", ")))
	}
	builder.WriteString("=================================")

	return builder.String()
}

func clampFloat(v, min, max float64) float64 {
	if v < min {
		return min
	}
	if v > max {
		return max
	}
	return v
}
