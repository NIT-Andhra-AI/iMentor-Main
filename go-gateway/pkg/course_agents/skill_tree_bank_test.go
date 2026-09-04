package course_agents

import (
	"testing"
)

func TestSkillTreeQuestionBank(t *testing.T) {
	bank := NewSkillTreeQuestionBank()

	// Test 1: Question Selection
	qs := bank.SelectQuestions("buck_converter", 2, nil)
	if len(qs) != 2 {
		t.Fatalf("Expected 2 questions selected, got %d", len(qs))
	}

	// Test 2: Replay Protection (seen questions filter)
	seen := []string{qs[0].ID}
	nextQs := bank.SelectQuestions("buck_converter", 2, seen)
	if len(nextQs) != 2 {
		t.Fatalf("Expected 2 questions selected with replay filter, got %d", len(nextQs))
	}
	if nextQs[0].ID == seen[0] {
		t.Errorf("Replay protection failed: First selected question was already seen")
	}

	// Test 3: Answer Evaluation & Bloom Multiplier
	resCorrect := bank.EvaluateAnswer(qs[0], qs[0].CorrectIndex)
	if !resCorrect.IsCorrect {
		t.Errorf("Expected answer to be correct")
	}
	if resCorrect.WeightedScore <= 10.0 {
		t.Errorf("Expected Bloom multiplier to boost weighted score above 10.0, got %.2f", resCorrect.WeightedScore)
	}

	resWrong := bank.EvaluateAnswer(qs[0], (qs[0].CorrectIndex+1)%4)
	if resWrong.IsCorrect {
		t.Errorf("Expected answer to be incorrect")
	}
	if len(resWrong.IdentifiedGaps) == 0 {
		t.Errorf("Expected concept gap to be identified on incorrect answer")
	}

	// Test 4: Boss Battle Initialization
	battle := bank.CreateBossBattle("EE3011", "buck_converter")
	if battle.BossHP != 300 {
		t.Errorf("Expected Boss HP to be 300, got %d", battle.BossHP)
	}
	if len(battle.Questions) != 3 {
		t.Errorf("Expected 3 questions in Boss Battle, got %d", len(battle.Questions))
	}
}
