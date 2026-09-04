package tests

import (
	"context"
	"testing"
	"time"

	"imentor/gateway/models"
	"imentor/gateway/services"
)

func TestDeepResearchPipeline(t *testing.T) {
	sglangClient := services.NewSGLangClient("http://localhost:8000", "Qwen/Qwen2.5-7B-Instruct-AWQ")
	researchService := services.NewResearchService(sglangClient, 4)

	job := researchService.CreateJob("student_123", models.DeepResearchRequest{
		Topic:         "Transformers and Attention Mechanisms",
		MaxSubQueries: 3,
	})

	if job.JobID == "" {
		t.Fatal("Expected non-empty job ID")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	updatesCount := 0
	err := researchService.ExecuteJob(ctx, job.JobID, func(j *models.DeepResearchJob) {
		updatesCount++
	})

	if err != nil {
		t.Fatalf("Failed to execute research job: %v", err)
	}

	completedJob, err := researchService.GetJob(job.JobID)
	if err != nil {
		t.Fatalf("Failed to get completed job: %v", err)
	}

	if completedJob.Stage != models.StageComplete {
		t.Errorf("Expected stage COMPLETE, got %v", completedJob.Stage)
	}
	if completedJob.ProgressPercent != 100 {
		t.Errorf("Expected 100%% progress, got %d", completedJob.ProgressPercent)
	}
	if len(completedJob.SubQueries) == 0 {
		t.Errorf("Expected sub-queries, got 0")
	}
	if completedJob.FinalSynthesis == "" {
		t.Errorf("Expected non-empty final synthesis")
	}
}

func TestAssessmentAndBloomScoring(t *testing.T) {
	svc := services.NewAssessmentService()

	quiz, err := svc.GenerateQuiz("student_456", "CS601_ML", "overfitting_regularization", 3)
	if err != nil {
		t.Fatalf("Failed to generate quiz: %v", err)
	}

	if len(quiz.Questions) == 0 {
		t.Fatal("Expected at least 1 question in generated quiz")
	}

	// Submit correct answer to question 1
	sub := models.QuizSubmission{
		QuizID: quiz.QuizID,
		Answers: []models.SubmissionAnswer{
			{
				QuestionID:  quiz.Questions[0].ID,
				AnswerIndex: quiz.Questions[0].CorrectIndex,
			},
		},
		Duration: 45,
	}

	result, err := svc.EvaluateSubmission("student_456", sub)
	if err != nil {
		t.Fatalf("Failed to evaluate quiz submission: %v", err)
	}

	if result.CorrectCount != 1 {
		t.Errorf("Expected 1 correct answer, got %d", result.CorrectCount)
	}
	if result.XPEarned <= 0 {
		t.Errorf("Expected XP earned > 0, got %d", result.XPEarned)
	}
}

func TestSkillTreeUnlocks(t *testing.T) {
	svc := services.NewSkillTreeService()

	tree := svc.GetUserTree("student_789", "CS601_ML")
	if tree.Nodes["ml_linear_algebra"].State != models.NodeAvailable {
		t.Errorf("Expected root node to be AVAILABLE, got %s", tree.Nodes["ml_linear_algebra"].State)
	}
	if tree.Nodes["ml_linear_regression"].State != models.NodeLocked {
		t.Errorf("Expected child node to be LOCKED initially, got %s", tree.Nodes["ml_linear_regression"].State)
	}

	// Complete prerequisite node
	updatedTree, err := svc.CompleteNode("student_789", "CS601_ML", "ml_linear_algebra", 0.95)
	if err != nil {
		t.Fatalf("Failed to complete skill node: %v", err)
	}

	if updatedTree.Nodes["ml_linear_algebra"].State != models.NodeMastered {
		t.Errorf("Expected node to be MASTERED, got %s", updatedTree.Nodes["ml_linear_algebra"].State)
	}
	if updatedTree.Nodes["ml_linear_regression"].State != models.NodeAvailable {
		t.Errorf("Expected dependent node to become AVAILABLE, got %s", updatedTree.Nodes["ml_linear_regression"].State)
	}
}
