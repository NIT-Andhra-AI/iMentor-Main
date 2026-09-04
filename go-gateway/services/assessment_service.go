package services

import (
	"fmt"
	"math"
	"sync"
	"time"

	"imentor/gateway/models"
)

// AssessmentService manages quizzes, question bank delivery, and Bloom's mastery scoring
type AssessmentService struct {
	mu           sync.RWMutex
	questionBank map[string]*models.AssessmentQuestion
	quizzes      map[string]*models.AssessmentQuiz
}

// NewAssessmentService initializes the Assessment and Question Bank service
func NewAssessmentService() *AssessmentService {
	svc := &AssessmentService{
		questionBank: make(map[string]*models.AssessmentQuestion),
		quizzes:      make(map[string]*models.AssessmentQuiz),
	}
	svc.seedDefaultQuestionBank()
	return svc
}

// seedDefaultQuestionBank populates initial conceptual questions across EE and CS
func (s *AssessmentService) seedDefaultQuestionBank() {
	defaultQuestions := []models.AssessmentQuestion{
		{
			ID:         "q_ml_overfit",
			ConceptID:  "overfitting_regularization",
			CourseID:   "CS601_ML",
			Text:       "Which technique directly penalizes large weight magnitudes to prevent overfitting in neural networks?",
			Type:       models.QuestionMultipleChoice,
			BloomLevel: models.BloomL2Understand,
			Options: []string{
				"L2 Regularization (Weight Decay)",
				"Data Duplication",
				"Increasing Learning Rate",
				"Removing Batch Normalization",
			},
			CorrectIndex: 0,
			Explanation:  "L2 regularization adds a penalty proportional to the square of the magnitude of weights.",
			Difficulty:   0.4,
		},
		{
			ID:         "q_ee_kvl",
			ConceptID:  "kirchhoffs_voltage_law",
			CourseID:   "EE201_CIRCUITS",
			Text:       "According to Kirchhoff's Voltage Law (KVL), the algebraic sum of all voltages around any closed loop must equal:",
			Type:       models.QuestionMultipleChoice,
			BloomLevel: models.BloomL1Remember,
			Options: []string{
				"Zero",
				"The total resistance",
				"The maximum source voltage",
				"Infinity",
			},
			CorrectIndex: 0,
			Explanation:  "KVL states that the sum of all electrical potential differences around any closed loop is zero.",
			Difficulty:   0.2,
		},
		{
			ID:         "q_dsa_binary_search",
			ConceptID:  "binary_search_trees",
			CourseID:   "CS201_DSA",
			Text:       "What is the worst-case time complexity of searching in an unbalanced binary search tree?",
			Type:       models.QuestionMultipleChoice,
			BloomLevel: models.BloomL3Apply,
			Options: []string{
				"O(N)",
				"O(log N)",
				"O(1)",
				"O(N log N)",
			},
			CorrectIndex: 0,
			Explanation:  "When a BST degenerates into a linear linked-list structure, worst-case search becomes O(N).",
			Difficulty:   0.5,
		},
	}

	for i := range defaultQuestions {
		s.questionBank[defaultQuestions[i].ID] = &defaultQuestions[i]
	}
}

// GenerateQuiz creates an adaptive quiz targeting a specific course/concept
func (s *AssessmentService) GenerateQuiz(userID, courseID, targetConcept string, numQuestions int) (*models.AssessmentQuiz, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if numQuestions <= 0 {
		numQuestions = 3
	}

	quizID := fmt.Sprintf("quiz_%d_%s", time.Now().UnixNano(), userID)
	questions := make([]models.AssessmentQuestion, 0)

	for _, q := range s.questionBank {
		if courseID == "" || q.CourseID == courseID || q.ConceptID == targetConcept {
			questions = append(questions, *q)
			if len(questions) >= numQuestions {
				break
			}
		}
	}

	if len(questions) == 0 {
		// Fallback to all available questions
		for _, q := range s.questionBank {
			questions = append(questions, *q)
			if len(questions) >= numQuestions {
				break
			}
		}
	}

	quiz := &models.AssessmentQuiz{
		QuizID:        quizID,
		UserID:        userID,
		CourseID:      courseID,
		TargetConcept: targetConcept,
		Questions:     questions,
		TotalPoints:   len(questions) * 10,
		CreatedAt:     time.Now(),
	}

	s.quizzes[quizID] = quiz
	return quiz, nil
}

// EvaluateSubmission scores the student's submission and calculates mastery delta
func (s *AssessmentService) EvaluateSubmission(userID string, sub models.QuizSubmission) (*models.QuizResult, error) {
	s.mu.RLock()
	quiz, exists := s.quizzes[sub.QuizID]
	s.mu.RUnlock()

	if !exists {
		return nil, fmt.Errorf("quiz %s not found", sub.QuizID)
	}

	correctCount := 0
	masteryDelta := make(map[string]float64)

	answerMap := make(map[string]int)
	for _, ans := range sub.Answers {
		answerMap[ans.QuestionID] = ans.AnswerIndex
	}

	for _, q := range quiz.Questions {
		submittedIdx, hasAnswer := answerMap[q.ID]
		if hasAnswer && submittedIdx == q.CorrectIndex {
			correctCount++
			masteryDelta[q.ConceptID] += 0.15 * (1.0 + q.Difficulty)
		} else {
			masteryDelta[q.ConceptID] -= 0.05
		}
	}

	totalQuestions := len(quiz.Questions)
	if totalQuestions == 0 {
		totalQuestions = 1
	}

	scorePct := math.Round((float64(correctCount)/float64(totalQuestions))*100.0*100) / 100
	xpEarned := correctCount * 25

	feedback := "Solid performance! You demonstrated good conceptual understanding."
	if scorePct < 50.0 {
		feedback = "Review prerequisite concepts and practice active recall on target topics."
	} else if scorePct >= 90.0 {
		feedback = "Outstanding mastery! You are ready for advanced synthesis and boss battles."
	}

	result := &models.QuizResult{
		QuizID:         quiz.QuizID,
		UserID:         userID,
		ScorePercent:   scorePct,
		CorrectCount:   correctCount,
		TotalQuestions: totalQuestions,
		XPEarned:       xpEarned,
		MasteryDelta:   masteryDelta,
		Feedback:       feedback,
		AssessedAt:     time.Now(),
	}

	return result, nil
}
