package services

import (
	"fmt"
	"math"
	"sync"
	"time"

	"imentor/gateway/models"
)

// SkillTreeService manages the Skill Tree progression graphs for 1000+ students
type SkillTreeService struct {
	mu         sync.RWMutex
	trees      map[string]*models.UserSkillTree // key: userId_courseId
	templates  map[string]map[string]*models.SkillTreeNode // key: courseId -> node map
}

// NewSkillTreeService initializes the Skill Tree engine
func NewSkillTreeService() *SkillTreeService {
	svc := &SkillTreeService{
		trees:     make(map[string]*models.UserSkillTree),
		templates: make(map[string]map[string]*models.SkillTreeNode),
	}
	svc.seedCourseSkillTrees()
	return svc
}

// seedCourseSkillTrees creates default skill trees for courses
func (s *SkillTreeService) seedCourseSkillTrees() {
	mlNodes := map[string]*models.SkillTreeNode{
		"ml_linear_algebra": {
			ID:            "ml_linear_algebra",
			Title:         "Linear Algebra & Matrix Calculus",
			Description:   "Eigenvalues, matrix multiplication, and vector spaces",
			CourseID:      "CS601_ML",
			ModuleNumber:  1,
			Level:         1,
			Prerequisites: []string{},
			RequiredXP:    0,
			State:         models.NodeAvailable,
		},
		"ml_linear_regression": {
			ID:            "ml_linear_regression",
			Title:         "Linear & Ridge Regression",
			Description:   "Cost functions, Gradient Descent, and Normal Equations",
			CourseID:      "CS601_ML",
			ModuleNumber:  1,
			Level:         2,
			Prerequisites: []string{"ml_linear_algebra"},
			RequiredXP:    50,
			State:         models.NodeLocked,
		},
		"ml_neural_networks": {
			ID:            "ml_neural_networks",
			Title:         "Feedforward Neural Networks",
			Description:   "Backpropagation, activation functions, and loss surfaces",
			CourseID:      "CS601_ML",
			ModuleNumber:  2,
			Level:         3,
			Prerequisites: []string{"ml_linear_regression"},
			RequiredXP:    150,
			State:         models.NodeLocked,
		},
	}

	s.templates["CS601_ML"] = mlNodes
}

// GetUserTree returns or initializes a user's skill tree for a course
func (s *SkillTreeService) GetUserTree(userID, courseID string) *models.UserSkillTree {
	s.mu.Lock()
	defer s.mu.Unlock()

	key := fmt.Sprintf("%s_%s", userID, courseID)
	if tree, exists := s.trees[key]; exists {
		return tree
	}

	templateNodes, exists := s.templates[courseID]
	if !exists {
		// Default to CS601_ML template
		templateNodes = s.templates["CS601_ML"]
		courseID = "CS601_ML"
	}

	userNodes := make(map[string]*models.SkillTreeNode)
	for id, node := range templateNodes {
		copiedNode := *node
		userNodes[id] = &copiedNode
	}

	tree := &models.UserSkillTree{
		UserID:         userID,
		CourseID:       courseID,
		CourseName:     "Machine Learning & Deep Neural Architectures",
		Nodes:          userNodes,
		CompletedCount: 0,
		TotalCount:     len(userNodes),
		ProgressPct:    0.0,
		LastUpdated:    time.Now(),
	}

	s.trees[key] = tree
	return tree
}

// CompleteNode marks a skill node as mastered and unlocks dependent nodes
func (s *SkillTreeService) CompleteNode(userID, courseID, nodeID string, score float64) (*models.UserSkillTree, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	key := fmt.Sprintf("%s_%s", userID, courseID)
	tree, exists := s.trees[key]
	if !exists {
		s.mu.Unlock()
		tree = s.GetUserTree(userID, courseID)
		s.mu.Lock()
	}

	targetNode, exists := tree.Nodes[nodeID]
	if !exists {
		return nil, fmt.Errorf("node %s not found in course %s", nodeID, courseID)
	}

	targetNode.State = models.NodeMastered
	targetNode.MasteryScore = math.Min(1.0, math.Max(score, 0.85))

	// Recompute unlocks
	completed := 0
	for _, node := range tree.Nodes {
		if node.State == models.NodeMastered {
			completed++
			continue
		}

		// Check if prerequisites are satisfied
		allMet := true
		for _, prereqID := range node.Prerequisites {
			if prereqNode, ok := tree.Nodes[prereqID]; !ok || prereqNode.State != models.NodeMastered {
				allMet = false
				break
			}
		}

		if allMet && node.State == models.NodeLocked {
			node.State = models.NodeAvailable
		}
	}

	tree.CompletedCount = completed
	if tree.TotalCount > 0 {
		tree.ProgressPct = math.Round((float64(completed)/float64(tree.TotalCount))*100.0*10) / 10
	}
	tree.LastUpdated = time.Now()

	return tree, nil
}
