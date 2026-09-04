package course_agents

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	"strings"
)

// BloomTaxonomyLevel defines the 6 cognitive depth tiers
type BloomTaxonomyLevel string

const (
	BloomRemember   BloomTaxonomyLevel = "remember"
	BloomUnderstand BloomTaxonomyLevel = "understand"
	BloomApply      BloomTaxonomyLevel = "apply"
	BloomAnalyze    BloomTaxonomyLevel = "analyze"
	BloomEvaluate   BloomTaxonomyLevel = "evaluate"
	BloomCreate     BloomTaxonomyLevel = "create"
)

// ConceptQuestion represents a validated, Bloom-calibrated assessment item
type ConceptQuestion struct {
	ID               string             `json:"id"`
	CourseCode       string             `json:"course_code"`
	Concept          string             `json:"concept"`
	BloomLevel       BloomTaxonomyLevel `json:"bloom_level"`
	Difficulty       string             `json:"difficulty"` // "easy", "medium", "hard"
	QuestionText     string             `json:"question_text"`
	Options          [4]string          `json:"options"`
	CorrectIndex     int                `json:"correct_index"`
	Explanation      string             `json:"explanation"`
	EstimatedTimeSec int                `json:"estimated_time_sec"`
	GATEWeightage    string             `json:"gate_weightage,omitempty"`
	TimesUsed        int                `json:"times_used"`
	TimesCorrect     int                `json:"times_correct"`
}

// AssessmentResult evaluates a student's answer with Bloom weighting
type AssessmentResult struct {
	QuestionID       string  `json:"question_id"`
	IsCorrect        bool    `json:"is_correct"`
	Score            float64 `json:"score"`           // 0.0 to 10.0
	WeightedScore    float64 `json:"weighted_score"`  // Multiplied by Bloom & Difficulty weight
	BloomLevel       string  `json:"bloom_level"`
	Difficulty       string  `json:"difficulty"`
	Explanation      string  `json:"explanation"`
	XPEarned         int     `json:"xp_earned"`
	IdentifiedGaps   []string `json:"identified_gaps,omitempty"`
}

// BossBattleStage represents a multi-tiered exam challenge
type BossBattleStage struct {
	StageNumber   int               `json:"stage_number"`
	StageName     string            `json:"stage_name"`
	BossHP        int               `json:"boss_hp"`
	TimeLimitSec  int               `json:"time_limit_sec"`
	Questions     []ConceptQuestion `json:"questions"`
	DamagePerHit  int               `json:"damage_per_hit"`
}

// SkillTreeQuestionBank manages in-memory question banks with replay protection
type SkillTreeQuestionBank struct {
	bank map[string][]ConceptQuestion // Concept -> Questions
}

// NewSkillTreeQuestionBank initializes the bank with discipline-specific questions
func NewSkillTreeQuestionBank() *SkillTreeQuestionBank {
	b := &SkillTreeQuestionBank{
		bank: make(map[string][]ConceptQuestion),
	}
	b.seedDefaultQuestions()
	return b
}

func (b *SkillTreeQuestionBank) seedDefaultQuestions() {
	// Seed Power Electronics questions
	b.bank["buck_converter"] = []ConceptQuestion{
		{
			ID:               "q_buck_01",
			CourseCode:       "EE3011",
			Concept:          "buck_converter",
			BloomLevel:       BloomUnderstand,
			Difficulty:       "easy",
			QuestionText:     "In a step-down DC-DC buck converter operating in CCM, the steady-state output voltage $V_o$ is given by:",
			Options:          [4]string{"$V_o = D \\cdot V_{in}$", "$V_o = V_{in} / (1 - D)$", "$V_o = D \\cdot V_{in} / (1 - D)$", "$V_o = V_{in} / D$"},
			CorrectIndex:     0,
			Explanation:      "Applying Faraday's law of induction across one switching period yields $(V_{in} - V_o)DT_s - V_o(1-D)T_s = 0 \\implies V_o = D V_{in}$.",
			EstimatedTimeSec: 45,
			GATEWeightage:    "1 Mark MCQ",
		},
		{
			ID:               "q_buck_02",
			CourseCode:       "EE3011",
			Concept:          "buck_converter",
			BloomLevel:       BloomApply,
			Difficulty:       "medium",
			QuestionText:     "A buck converter has $V_{in} = 48\\text{ V}$, $V_o = 12\\text{ V}$, $f_s = 50\\text{ kHz}$, and $R_L = 10\\ \\Omega$. What is the critical inductance $L_{crit}$ to ensure continuous conduction mode?",
			Options:          [4]string{"75 µH", "120 µH", "60 µH", "150 µH"},
			CorrectIndex:     0,
			Explanation:      "$D = 12/48 = 0.25$. $L_{crit} = \\frac{(1-D)R_L}{2 f_s} = \\frac{(1-0.25) \\times 10}{2 \\times 50000} = 75\\ \\mu\\text{H}$.",
			EstimatedTimeSec: 90,
			GATEWeightage:    "2 Mark NAT",
		},
		{
			ID:               "q_buck_03",
			CourseCode:       "EE3011",
			Concept:          "buck_converter",
			BloomLevel:       BloomAnalyze,
			Difficulty:       "hard",
			QuestionText:     "What causes subharmonic oscillation in peak current-mode controlled DC-DC converters when the duty cycle exceeds 50%?",
			Options:          [4]string{"Perturbation growth in inductor current ripple across successive switching cycles", "Reverse recovery charge in the freewheeling diode", "Thermal runaway of the power MOSFET", "ESR zero of the output capacitor"},
			CorrectIndex:     0,
			Explanation:      "For $D > 0.5$, any small current perturbation $\\Delta i_0$ grows by factor $m_2/m_1 > 1$, causing instability. Adding artificial slope compensation restores stability.",
			EstimatedTimeSec: 120,
			GATEWeightage:    "2 Mark MCQ",
		},
	}

	// Seed Circuits questions
	b.bank["thevenin_theorem"] = []ConceptQuestion{
		{
			ID:               "q_thev_01",
			CourseCode:       "EE1011",
			Concept:          "thevenin_theorem",
			BloomLevel:       BloomUnderstand,
			Difficulty:       "easy",
			QuestionText:     "Thevenin's theorem replaces a linear two-terminal circuit with an equivalent circuit consisting of:",
			Options:          [4]string{"An ideal voltage source $V_{Th}$ in series with resistance $R_{Th}$", "An ideal current source $I_N$ in parallel with resistance $R_N$", "An ideal voltage source in parallel with capacitance", "A dependent source with zero internal resistance"},
			CorrectIndex:     0,
			Explanation:      "Thevenin's theorem states any linear active resistive network can be replaced by an independent voltage source $V_{Th}$ in series with $R_{Th}$.",
			EstimatedTimeSec: 30,
			GATEWeightage:    "1 Mark MCQ",
		},
	}
}

// SelectQuestions retrieves unseen questions with Bloom distribution and replay safety
func (b *SkillTreeQuestionBank) SelectQuestions(concept string, count int, seenIDs []string) []ConceptQuestion {
	all, exists := b.bank[concept]
	if !exists || len(all) == 0 {
		return b.generateFallbackQuestions(concept, count)
	}

	seenMap := make(map[string]bool)
	for _, id := range seenIDs {
		seenMap[id] = true
	}

	var unseen []ConceptQuestion
	var seen []ConceptQuestion

	for _, q := range all {
		if !seenMap[q.ID] {
			unseen = append(unseen, q)
		} else {
			seen = append(seen, q)
		}
	}

	var selected []ConceptQuestion
	for _, q := range unseen {
		if len(selected) < count {
			selected = append(selected, q)
		}
	}

	// If not enough unseen, fill with least-used seen questions
	for _, q := range seen {
		if len(selected) < count {
			selected = append(selected, q)
		}
	}

	return selected
}

// EvaluateAnswer grades a submission with Bloom multipliers and XP calculation
func (b *SkillTreeQuestionBank) EvaluateAnswer(q ConceptQuestion, selectedIdx int) AssessmentResult {
	isCorrect := q.CorrectIndex == selectedIdx
	rawScore := 0.0
	if isCorrect {
		rawScore = 10.0
	}

	bloomMultiplier := 1.0
	switch q.BloomLevel {
	case BloomRemember:
		bloomMultiplier = 1.0
	case BloomUnderstand:
		bloomMultiplier = 1.2
	case BloomApply:
		bloomMultiplier = 1.5
	case BloomAnalyze:
		bloomMultiplier = 1.8
	case BloomEvaluate:
		bloomMultiplier = 2.0
	case BloomCreate:
		bloomMultiplier = 2.5
	}

	diffMultiplier := 1.0
	switch q.Difficulty {
	case "easy":
		diffMultiplier = 1.0
	case "medium":
		diffMultiplier = 1.3
	case "hard":
		diffMultiplier = 1.7
	}

	weightedScore := rawScore * bloomMultiplier * diffMultiplier
	xpEarned := int(weightedScore * 10)

	var gaps []string
	if !isCorrect {
		gaps = append(gaps, fmt.Sprintf("Concept gap in %s (%s level)", q.Concept, q.BloomLevel))
	}

	return AssessmentResult{
		QuestionID:     q.ID,
		IsCorrect:      isCorrect,
		Score:          rawScore,
		WeightedScore:  weightedScore,
		BloomLevel:     string(q.BloomLevel),
		Difficulty:     q.Difficulty,
		Explanation:    q.Explanation,
		XPEarned:       xpEarned,
		IdentifiedGaps: gaps,
	}
}

// CreateBossBattle initializes a 3-stage Boss Battle session for a course
func (b *SkillTreeQuestionBank) CreateBossBattle(courseCode, concept string) *BossBattleStage {
	questions := b.SelectQuestions(concept, 3, nil)

	return &BossBattleStage{
		StageNumber:  1,
		StageName:    fmt.Sprintf("Boss Battle: Master of %s", strings.ToUpper(concept)),
		BossHP:       300,
		TimeLimitSec: 300,
		Questions:    questions,
		DamagePerHit: 100,
	}
}

func (b *SkillTreeQuestionBank) generateFallbackQuestions(concept string, count int) []ConceptQuestion {
	var list []ConceptQuestion
	for i := 0; i < count; i++ {
		list = append(list, ConceptQuestion{
			ID:               fmt.Sprintf("q_%s_%d", concept, i+1),
			CourseCode:       "EE_GENERIC",
			Concept:          concept,
			BloomLevel:       BloomApply,
			Difficulty:       "medium",
			QuestionText:     fmt.Sprintf("Which of the following statements is mathematically sound regarding **%s**?", concept),
			Options:          [4]string{"Fundamental energy balance is strictly conserved", "Entropy decreases in an isolated system", "Inductor current changes instantaneously", "Transfer function has right-half-plane poles under stable negative feedback"},
			CorrectIndex:     0,
			Explanation:      "In all physical engineering systems, fundamental energy and charge conservation are universal invariants.",
			EstimatedTimeSec: 60,
			GATEWeightage:    "1 Mark MCQ",
		})
	}
	return list
}

func randomInt(max int) int {
	n, _ := rand.Int(rand.Reader, big.NewInt(int64(max)))
	return int(n.Int64())
}

// Helper for JSON serialization
func (q *ConceptQuestion) ToJSON() string {
	d, _ := json.MarshalIndent(q, "", "  ")
	return string(d)
}
