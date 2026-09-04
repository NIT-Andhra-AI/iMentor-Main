package course_agents

import (
	"strings"
	"testing"
)

func TestScaffoldingPlan_AllFiveTracks(t *testing.T) {
	engine := NewScaffoldChatEngine("", "")
	tracks := []FocusTrack{
		TrackStandardBTech,
		TrackGateAspirant,
		TrackPlacementPrep,
		TrackEntrepreneurship,
		TrackResearcher,
	}

	query := "Explain Buck Converter operation and critical inductance"

	for _, tr := range tracks {
		t.Run(string(tr), func(t *testing.T) {
			profile := &StudentProfile{
				UserID:        "test_user",
				FocusTrack:    tr,
				StudentLevel:  "INTERMEDIATE",
				LearningSpeed: "NORMAL",
			}

			plan := engine.PlanScaffolding(query, profile)
			if plan == nil {
				t.Fatalf("Plan should not be nil for track %s", tr)
			}
			if plan.ActiveTrack != tr {
				t.Errorf("Expected track %s, got %s", tr, plan.ActiveTrack)
			}
			if len(plan.PlannedSections) < 4 {
				t.Errorf("Expected at least 4 planned sections for track %s, got %d", tr, len(plan.PlannedSections))
			}
			if plan.ScaffoldDepth == "" {
				t.Errorf("Expected non-empty ScaffoldDepth for track %s", tr)
			}
			if plan.PersonaBridge == "" {
				t.Errorf("Expected non-empty PersonaBridge for track %s", tr)
			}
		})
	}
}

func TestGenerateCircuitSVG(t *testing.T) {
	tests := []struct {
		concept string
		track   FocusTrack
		substr  string
	}{
		{"Buck Converter", TrackStandardBTech, "<svg"},
		{"Boost Converter", TrackGateAspirant, "Boost Converter Vector Schematic"},
		{"H-Bridge Inverter", TrackPlacementPrep, "Inverter Topology"},
		{"Op-Amp Active Filter", TrackResearcher, "Active Operational Amplifier Filter"},
		{"Buck Regulator", TrackGateAspirant, "GATE Model"},
	}

	for _, tt := range tests {
		t.Run(tt.concept, func(t *testing.T) {
			svg := GenerateCircuitSVG(tt.concept, tt.track)
			if !strings.Contains(svg, "<svg") {
				t.Errorf("Generated circuit for '%s' does not contain <svg>", tt.concept)
			}
			if !strings.Contains(svg, "</svg>") {
				t.Errorf("Generated circuit for '%s' does not contain </svg>", tt.concept)
			}
			if !strings.Contains(svg, tt.substr) {
				t.Errorf("Generated circuit for '%s' missing substring '%s'", tt.concept, tt.substr)
			}
		})
	}
}

func TestGenerateInteractiveSliderMicroSandbox(t *testing.T) {
	sandbox := GenerateInteractiveSliderMicroSandbox("Buck Converter", TrackStandardBTech)

	expectedTokens := []string{
		"class=\"interactive-sandbox\"",
		"sliderD",
		"sliderVin",
		"sliderFs",
		"sliderL",
		"updateSim()",
		"MODE: CONTINUOUS (CCM)",
	}

	for _, token := range expectedTokens {
		if !strings.Contains(sandbox, token) {
			t.Errorf("Interactive sandbox missing expected token '%s'", token)
		}
	}
}

func TestGenerateWaveformPlotSVG(t *testing.T) {
	svg := GenerateWaveformPlotSVG("Buck Converter", 0.40)

	if !strings.Contains(svg, "<svg") || !strings.Contains(svg, "</svg>") {
		t.Errorf("Waveform plot missing valid SVG tags")
	}
	if !strings.Contains(svg, "i_L(t)") {
		t.Errorf("Waveform plot missing inductor current label i_L(t)")
	}
	if !strings.Contains(svg, "DT_s") {
		t.Errorf("Waveform plot missing duty period marker DT_s")
	}
}

func TestGenerateScaffoldedResponse_EmitsAllSections(t *testing.T) {
	engine := NewScaffoldChatEngine("http://invalid-url-to-trigger-fallback:9999", "")

	profile := &StudentProfile{
		UserID:         "student_tester",
		FocusTrack:     TrackStandardBTech,
		StudentLevel:   "INTERMEDIATE",
		LearningSpeed:  "NORMAL",
		EmotionalState: "CURIOUS",
	}

	emittedCount := 0
	sections, err := engine.GenerateScaffoldedResponse(
		"Explain Buck Converter operation",
		profile,
		nil,
		func(sec *ScaffoldSection) {
			emittedCount++
			if sec.Title == "" {
				t.Errorf("Emitted section has empty Title")
			}
			if sec.Content == "" {
				t.Errorf("Emitted section has empty Content")
			}
		},
	)

	if err != nil {
		t.Fatalf("GenerateScaffoldedResponse returned unexpected error: %v", err)
	}

	if len(sections) == 0 {
		t.Fatalf("Expected non-empty completed sections")
	}

	if emittedCount != len(sections) {
		t.Errorf("Expected %d emitted callbacks, got %d", len(sections), emittedCount)
	}

	// Verify KaTeX math in sections
	hasMath := false
	hasVisual := false
	for _, sec := range sections {
		if strings.Contains(sec.Content, "$") {
			hasMath = true
		}
		if sec.HasVisual || strings.Contains(sec.Content, "<svg") || strings.Contains(sec.Content, "interactive-sandbox") {
			hasVisual = true
		}
	}

	if !hasMath {
		t.Errorf("Expected at least one section with KaTeX mathematical formulas ($)")
	}
	if !hasVisual {
		t.Errorf("Expected at least one section with visual / SVG / sandbox artifacts")
	}
}

func TestExtractTargetConcept(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"Explain Buck Converter", "Buck Converter"},
		{"what is Boost Converter?", "Boost Converter"},
		{"how does Inverter work?", "Inverter work"},
		{"derive critical inductance for CCM", "critical inductance for CCM"},
		{"calculate output voltage ripple", "output voltage ripple"},
		{"State-Space Averaging", "State-Space Averaging"},
	}

	for _, tt := range tests {
		actual := extractTargetConcept(tt.input)
		if actual != tt.expected {
			t.Errorf("extractTargetConcept(%q) = %q; expected %q", tt.input, actual, tt.expected)
		}
	}
}
