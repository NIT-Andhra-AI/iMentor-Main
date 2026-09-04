package course_agents

import (
	"encoding/json"
	"fmt"
	"math"
	"sync"
	"time"
)

// SM2Flashcard represents a single active recall card with SuperMemo-2 spaced decay metrics
type SM2Flashcard struct {
	CardID         string    `json:"card_id"`
	ConceptID      string    `json:"concept_id"`
	CourseCode     string    `json:"course_code"`
	PromptQuestion string    `json:"prompt_question"`
	ExpectedAnswer string    `json:"expected_answer"`
	KeyFormula     string    `json:"key_formula,omitempty"`
	BloomLevel     string    `json:"bloom_level"`
	Repetition     int       `json:"repetition"`
	IntervalDays   int       `json:"interval_days"`
	EasinessFactor float64   `json:"easiness_factor"` // Default 2.5
	NextReviewDate time.Time `json:"next_review_date"`
	LastReviewedAt time.Time `json:"last_reviewed_at"`
	TotalReviews   int       `json:"total_reviews"`
	Lapses         int       `json:"lapses"`
}

// SpacedRepetitionSM2Engine manages in-memory decay queues and spaced reviews
type SpacedRepetitionSM2Engine struct {
	mu    sync.RWMutex
	cards map[string]*SM2Flashcard
}

// NewSpacedRepetitionSM2Engine creates a new SM-2 spaced repetition engine
func NewSpacedRepetitionSM2Engine() *SpacedRepetitionSM2Engine {
	engine := &SpacedRepetitionSM2Engine{
		cards: make(map[string]*SM2Flashcard),
	}
	engine.seedDefaultEngineeringCards()
	return engine
}

// ReviewGrade represents the recall quality score from 0 (complete blackout) to 5 (perfect recall)
type ReviewGrade int

const (
	GradeBlackout   ReviewGrade = 0 // Complete blackout
	GradeIncorrect  ReviewGrade = 1 // Incorrect response; the correct one remembered
	GradeStruggled  ReviewGrade = 2 // Incorrect response; where the correct one seemed easy to recall
	GradeHardRecall ReviewGrade = 3 // Correct response recalled with serious difficulty
	GradeGoodRecall ReviewGrade = 4 // Correct response after a hesitation
	GradeEasyRecall ReviewGrade = 5 // Perfect recall without hesitation
)

// ProcessReview applies the SuperMemo-2 algorithm to compute next review interval and easiness factor
func (e *SpacedRepetitionSM2Engine) ProcessReview(cardID string, grade ReviewGrade) (*SM2Flashcard, error) {
	e.mu.Lock()
	defer e.mu.Unlock()

	card, exists := e.cards[cardID]
	if !exists {
		return nil, fmt.Errorf("card %s not found in spaced repetition memory", cardID)
	}

	q := int(grade)
	if q < 0 {
		q = 0
	}
	if q > 5 {
		q = 5
	}

	now := time.Now()
	card.LastReviewedAt = now
	card.TotalReviews++

	// 1. Calculate new Easiness Factor (EF')
	// EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
	diff := 5.0 - float64(q)
	newEF := card.EasinessFactor + (0.1 - diff*(0.08+diff*0.02))
	if newEF < 1.30 {
		newEF = 1.30 // Hard floor at 1.30 per SM-2 standard
	}
	card.EasinessFactor = math.Round(newEF*100) / 100

	// 2. Calculate next interval
	if q < 3 {
		// Failed recall (lapse) -> Reset repetition to 0 and interval to 1 day
		card.Repetition = 0
		card.IntervalDays = 1
		card.Lapses++
	} else {
		// Successful recall
		if card.Repetition == 0 {
			card.IntervalDays = 1
		} else if card.Repetition == 1 {
			card.IntervalDays = 6
		} else {
			card.IntervalDays = int(math.Round(float64(card.IntervalDays) * card.EasinessFactor))
		}
		card.Repetition++
	}

	card.NextReviewDate = now.AddDate(0, 0, card.IntervalDays)
	return card, nil
}

// GetDueCards returns all active cards that are due for review
func (e *SpacedRepetitionSM2Engine) GetDueCards(courseCode string) []*SM2Flashcard {
	e.mu.RLock()
	defer e.mu.RUnlock()

	now := time.Now()
	var due []*SM2Flashcard

	for _, card := range e.cards {
		if courseCode != "" && card.CourseCode != courseCode {
			continue
		}
		if now.After(card.NextReviewDate) || now.Equal(card.NextReviewDate) {
			due = append(due, card)
		}
	}
	return due
}

// RegisterFlashcard adds a new concept flashcard to the active recall queue
func (e *SpacedRepetitionSM2Engine) RegisterFlashcard(card *SM2Flashcard) {
	e.mu.Lock()
	defer e.mu.Unlock()

	if card.EasinessFactor <= 0 {
		card.EasinessFactor = 2.5
	}
	if card.NextReviewDate.IsZero() {
		card.NextReviewDate = time.Now()
	}
	e.cards[card.CardID] = card
}

// seedDefaultEngineeringCards initializes high-yield concept review cards
func (e *SpacedRepetitionSM2Engine) seedDefaultEngineeringCards() {
	defaultCards := []*SM2Flashcard{
		{
			CardID:         "card_buck_ccm",
			ConceptID:      "buck_converter",
			CourseCode:     "EE3011",
			PromptQuestion: "What is the critical inductance formula L_crit required to ensure Continuous Conduction Mode (CCM) in a Buck converter?",
			ExpectedAnswer: "L_crit = (1 - D) * R_L / (2 * f_s)",
			KeyFormula:     "L_{crit} = \\frac{(1-D)R_L}{2 f_s}",
			BloomLevel:     "L3_APPLY",
			EasinessFactor: 2.5,
			NextReviewDate: time.Now(),
		},
		{
			CardID:         "card_boost_gain",
			ConceptID:      "boost_converter",
			CourseCode:     "EE3011",
			PromptQuestion: "Derive the ideal steady-state voltage conversion ratio Vo / Vin for a Step-Up Boost converter.",
			ExpectedAnswer: "Vo / Vin = 1 / (1 - D)",
			KeyFormula:     "\\frac{V_o}{V_{in}} = \\frac{1}{1 - D}",
			BloomLevel:     "L2_UNDERSTAND",
			EasinessFactor: 2.5,
			NextReviewDate: time.Now(),
		},
		{
			CardID:         "card_mosfet_sw_loss",
			ConceptID:      "power_semiconductors",
			CourseCode:     "EE3011",
			PromptQuestion: "Write the governing equation for total turn-on plus turn-off switching power dissipation in a power MOSFET.",
			ExpectedAnswer: "P_sw = 0.5 * V_ds * I_d * (t_r + t_f) * f_s",
			KeyFormula:     "P_{sw} = \\frac{1}{2} V_{ds} I_d (t_r + t_f) f_s",
			BloomLevel:     "L3_APPLY",
			EasinessFactor: 2.5,
			NextReviewDate: time.Now(),
		},
		{
			CardID:         "card_nyquist_sampling",
			ConceptID:      "dsp_sampling",
			CourseCode:     "EE3621",
			PromptQuestion: "State the Nyquist-Shannon sampling criterion to avoid aliasing in continuous-time bandlimited signals.",
			ExpectedAnswer: "Sampling frequency f_s must be strictly greater than or equal to twice the maximum signal frequency (f_s >= 2 * f_max).",
			KeyFormula:     "f_s \\ge 2 f_{max}",
			BloomLevel:     "L1_REMEMBER",
			EasinessFactor: 2.5,
			NextReviewDate: time.Now(),
		},
	}

	for _, c := range defaultCards {
		e.cards[c.CardID] = c
	}
}

// ToJSON serializes due cards to JSON
func (e *SpacedRepetitionSM2Engine) ToJSON() (string, error) {
	e.mu.RLock()
	defer e.mu.RUnlock()

	bytes, err := json.MarshalIndent(e.cards, "", "  ")
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}
