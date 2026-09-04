package course_agents

import (
	"strings"
	"testing"
)

func TestAudioDebateSynthesizer_Topics(t *testing.T) {
	synthesizer := NewAudioDebateSynthesizer()

	topics := []string{
		"Buck Converter",
		"Boost Converter",
		"MOSFET Switching Losses",
		"Op-Amp Feedback Stability",
		"Nyquist Sampling",
		"Fast Fourier Transform",
		"Cache Coherence MESI",
		"Transformer Self-Attention",
		"Quantum Computing Gate Synthesis", // Tests universal fallback
	}

	for _, topic := range topics {
		t.Run(topic, func(t *testing.T) {
			overview := synthesizer.SynthesizeTopicDebate(topic, "EE3011")
			if overview == nil {
				t.Fatalf("SynthesizeTopicDebate returned nil for topic '%s'", topic)
			}
			if overview.Topic != topic {
				t.Errorf("Expected topic '%s', got '%s'", topic, overview.Topic)
			}
			if len(overview.Dialogue) < 4 {
				t.Errorf("Expected at least 4 dialogue turns, got %d", len(overview.Dialogue))
			}
			if len(overview.Takeaways) == 0 {
				t.Errorf("Expected non-empty takeaways for topic '%s'", topic)
			}

			// Verify turns have valid speakers, emotions, timestamps
			lastTime := -1
			hasAlex := false
			hasSam := false

			for i, turn := range overview.Dialogue {
				if turn.Speaker == "" {
					t.Errorf("Turn %d has empty Speaker", i)
				}
				if strings.Contains(turn.Speaker, "Alex") {
					hasAlex = true
				}
				if strings.Contains(turn.Speaker, "Sam") {
					hasSam = true
				}
				if turn.Text == "" {
					t.Errorf("Turn %d has empty Text", i)
				}
				if turn.Emotion == "" {
					t.Errorf("Turn %d has empty Emotion", i)
				}
				if turn.TimestampSec < lastTime {
					t.Errorf("Turn %d timestamp %d is less than previous timestamp %d", i, turn.TimestampSec, lastTime)
				}
				lastTime = turn.TimestampSec
			}

			if !hasAlex || !hasSam {
				t.Errorf("Debate should contain turns from both Alex and Sam")
			}
		})
	}
}

func TestAudioDebateSynthesizer_Tracks(t *testing.T) {
	synthesizer := NewAudioDebateSynthesizer()
	tracks := []FocusTrack{
		TrackStandardBTech,
		TrackGateAspirant,
		TrackPlacementPrep,
		TrackEntrepreneurship,
		TrackResearcher,
	}

	for _, tr := range tracks {
		t.Run(string(tr), func(t *testing.T) {
			overview := synthesizer.SynthesizeTopicDebateForTrack("Buck Converter", "EE3011", tr)
			if overview == nil {
				t.Fatalf("SynthesizeTopicDebateForTrack returned nil for track %s", tr)
			}
			if overview.FocusTrack != tr {
				t.Errorf("Expected focus track %s, got %s", tr, overview.FocusTrack)
			}
			if len(overview.Dialogue) == 0 {
				t.Errorf("Expected non-empty dialogue for track %s", tr)
			}
		})
	}
}

func TestAudioDebate_FormattingOutputs(t *testing.T) {
	synthesizer := NewAudioDebateSynthesizer()
	overview := synthesizer.SynthesizeTopicDebateForTrack("Buck Converter", "EE3011", TrackGateAspirant)

	// Test Markdown Output
	md := overview.ToMarkdown()
	if !strings.Contains(md, "# 🎙️ iMentor Audio Deep Dive:") {
		t.Errorf("Markdown missing podcast title header")
	}
	if !strings.Contains(md, "Alex (Intuitive Engineer)") || !strings.Contains(md, "Sam (Rigorous Analyst)") {
		t.Errorf("Markdown missing host names")
	}
	if !strings.Contains(md, "Key Engineering Takeaways:") {
		t.Errorf("Markdown missing takeaways section")
	}

	// Test SSML Output
	ssml := overview.ToSSML()
	if !strings.HasPrefix(ssml, "<speak>") || !strings.HasSuffix(strings.TrimSpace(ssml), "</speak>") {
		t.Errorf("SSML output not enclosed in <speak> tags")
	}
	if !strings.Contains(ssml, "<voice name=") {
		t.Errorf("SSML output missing <voice> tags")
	}

	// Test JSON Output
	jsonStr, err := overview.ToJSON()
	if err != nil {
		t.Fatalf("ToJSON failed: %v", err)
	}
	if !strings.Contains(jsonStr, "\"topic\": \"Buck Converter\"") {
		t.Errorf("JSON output missing topic field")
	}
}

func TestAudioDebateSynthesizer_HandsFreeStudentInterjection(t *testing.T) {
	synthesizer := NewAudioDebateSynthesizer()

	// 1. Frequency Scaling Interjection
	res1 := synthesizer.HandleStudentInterjection("Buck Converter", 2, "Why not just switch at 1 MHz instead of 50 kHz?", TrackGateAspirant)
	if res1 == nil {
		t.Fatalf("Expected non-nil interjection response")
	}
	if len(res1.HostResponses) != 2 {
		t.Errorf("Expected 2 host responses for student question, got %d", len(res1.HostResponses))
	}
	if !res1.IsHandsFree {
		t.Errorf("Expected IsHandsFree to be true")
	}
	if !strings.Contains(res1.HostResponses[0].Text, "1 MHz") {
		t.Errorf("Expected Sam to address 1 MHz frequency directly")
	}

	// 2. Efficiency Interjection
	res2 := synthesizer.HandleStudentInterjection("Buck Converter", 1, "Where does the lost power go as heat?", TrackPlacementPrep)
	if res2 == nil || len(res2.HostResponses) < 2 {
		t.Fatalf("Expected 2 host responses for efficiency interjection")
	}
	if !strings.Contains(res2.HostResponses[0].Text, "heat") {
		t.Errorf("Expected Alex to address thermal dissipation")
	}

	// 3. GATE Formula Shortcut Interjection
	res3 := synthesizer.HandleStudentInterjection("Buck Converter", 3, "What is the GATE exam formula shortcut for this?", TrackGateAspirant)
	if res3 == nil || len(res3.HostResponses) < 2 {
		t.Fatalf("Expected 2 host responses for GATE shortcut interjection")
	}
	if !strings.Contains(res3.HostResponses[0].Text, "DCM") {
		t.Errorf("Expected Sam to address DCM trap for GATE")
	}
}
