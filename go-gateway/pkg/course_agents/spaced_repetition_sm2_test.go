package course_agents

import (
	"testing"
	"time"
)

func TestSpacedRepetitionSM2_Progression(t *testing.T) {
	engine := NewSpacedRepetitionSM2Engine()

	cardID := "card_buck_ccm"

	// 1. Initial State Check
	due := engine.GetDueCards("EE3011")
	if len(due) == 0 {
		t.Fatalf("Expected due cards on initialization, got 0")
	}

	// 2. Review Grade 5 (Perfect Recall)
	card, err := engine.ProcessReview(cardID, GradeEasyRecall)
	if err != nil {
		t.Fatalf("ProcessReview failed: %v", err)
	}

	if card.Repetition != 1 {
		t.Errorf("Expected Repetition 1 after first successful review, got %d", card.Repetition)
	}
	if card.IntervalDays != 1 {
		t.Errorf("Expected Interval 1 day after first review, got %d", card.IntervalDays)
	}
	if card.EasinessFactor < 2.50 {
		t.Errorf("Expected Easiness Factor >= 2.50 on perfect score, got %f", card.EasinessFactor)
	}

	// 3. Second Review Grade 4 (Good Recall)
	card, err = engine.ProcessReview(cardID, GradeGoodRecall)
	if err != nil {
		t.Fatalf("ProcessReview failed: %v", err)
	}
	if card.Repetition != 2 {
		t.Errorf("Expected Repetition 2, got %d", card.Repetition)
	}
	if card.IntervalDays != 6 {
		t.Errorf("Expected Interval 6 days on second review, got %d", card.IntervalDays)
	}

	// 4. Third Review Grade 5 (Perfect Recall) -> Interval should expand exponentially
	card, err = engine.ProcessReview(cardID, GradeEasyRecall)
	if err != nil {
		t.Fatalf("ProcessReview failed: %v", err)
	}
	if card.Repetition != 3 {
		t.Errorf("Expected Repetition 3, got %d", card.Repetition)
	}
	if card.IntervalDays < 15 {
		t.Errorf("Expected Interval >= 15 days on third review (6 * 2.6), got %d", card.IntervalDays)
	}

	// 5. Review with Grade 1 (Blackout / Lapse) -> Should reset repetition & set interval to 1
	card, err = engine.ProcessReview(cardID, GradeIncorrect)
	if err != nil {
		t.Fatalf("ProcessReview failed: %v", err)
	}
	if card.Repetition != 0 {
		t.Errorf("Expected Repetition reset to 0 on lapse, got %d", card.Repetition)
	}
	if card.IntervalDays != 1 {
		t.Errorf("Expected Interval reset to 1 day on lapse, got %d", card.IntervalDays)
	}
	if card.Lapses != 1 {
		t.Errorf("Expected Lapses count = 1, got %d", card.Lapses)
	}
}

func TestSpacedRepetitionSM2_FloorBoundary(t *testing.T) {
	engine := NewSpacedRepetitionSM2Engine()

	// Register a card and fail repeatedly to verify 1.30 floor
	customCard := &SM2Flashcard{
		CardID:         "test_floor_card",
		ConceptID:      "test_concept",
		CourseCode:     "TEST101",
		PromptQuestion: "Test Question",
		ExpectedAnswer: "Test Answer",
		BloomLevel:     "L1_REMEMBER",
		EasinessFactor: 2.5,
		NextReviewDate: time.Now(),
	}
	engine.RegisterFlashcard(customCard)

	for i := 0; i < 10; i++ {
		engine.ProcessReview("test_floor_card", GradeBlackout)
	}

	card := engine.cards["test_floor_card"]
	if card.EasinessFactor < 1.30 {
		t.Errorf("Easiness Factor violated 1.30 floor boundary: %f", card.EasinessFactor)
	}
}
