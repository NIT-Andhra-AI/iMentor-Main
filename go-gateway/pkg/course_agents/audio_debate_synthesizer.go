package course_agents

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// DialogueTurn represents a single conversational turn in the 2-host audio debate
type DialogueTurn struct {
	TurnID       int    `json:"turn_id"`
	Speaker      string `json:"speaker"`        // "Alex (Intuitive Engineer)", "Sam (Rigorous Analyst)"
	Text         string `json:"text"`
	Emotion      string `json:"emotion"`        // "EXCITED", "ANALYTICAL", "CHALLENGING", "INSIGHTFUL", "PROVOCATIVE", "TRIUMPHANT", "REFLECTIVE"
	AudioSFX     string `json:"audio_sfx,omitempty"` // e.g. "[SFX: Tech Theme Intro]", "[SFX: Digital Whiteboard Marker]"
	TimestampSec int    `json:"timestamp_sec"`
	KeyConcept   string `json:"key_concept,omitempty"`
}

// AudioDebateOverview represents a full NotebookLM-style 2-host audio podcast script
type AudioDebateOverview struct {
	Topic             string         `json:"topic"`
	CourseCode        string         `json:"course_code,omitempty"`
	FocusTrack        FocusTrack     `json:"focus_track,omitempty"`
	EstimatedDuration string         `json:"estimated_duration"`
	Host1Name         string         `json:"host1_name"`
	Host2Name         string         `json:"host2_name"`
	Dialogue          []DialogueTurn `json:"dialogue"`
	Takeaways         []string       `json:"takeaways"`
	KeyFormulas       []string       `json:"key_formulas,omitempty"`
	GeneratedAt       time.Time      `json:"generated_at"`
}

// AudioDebateSynthesizer generates 2-host conversational dialogues for audio synthesis
type AudioDebateSynthesizer struct{}

// NewAudioDebateSynthesizer initializes the synthesizer
func NewAudioDebateSynthesizer() *AudioDebateSynthesizer {
	return &AudioDebateSynthesizer{}
}

// SynthesizeTopicDebate creates an engaging, high-clarity 2-host script explaining engineering concepts
func (s *AudioDebateSynthesizer) SynthesizeTopicDebate(topic, courseCode string) *AudioDebateOverview {
	return s.SynthesizeTopicDebateForTrack(topic, courseCode, TrackStandardBTech)
}

// SynthesizeTopicDebateForTrack creates a 2-host script modulated for the specific learner focus track
func (s *AudioDebateSynthesizer) SynthesizeTopicDebateForTrack(topic, courseCode string, track FocusTrack) *AudioDebateOverview {
	tLower := strings.ToLower(topic)
	if track == "" {
		track = TrackStandardBTech
	}

	var dialogue []DialogueTurn
	var takeaways []string
	var formulas []string
	duration := "3 min 15 sec"

	switch {
	case strings.Contains(tLower, "buck") || strings.Contains(tLower, "step-down") || (strings.Contains(tLower, "converter") && !strings.Contains(tLower, "boost")):
		dialogue, takeaways, formulas = s.generateBuckDebate(topic, track)

	case strings.Contains(tLower, "boost") || strings.Contains(tLower, "step-up"):
		dialogue, takeaways, formulas = s.generateBoostDebate(topic, track)

	case strings.Contains(tLower, "mosfet") || strings.Contains(tLower, "switching loss") || strings.Contains(tLower, "thermal"):
		dialogue, takeaways, formulas = s.generateMosfetDebate(topic, track)

	case strings.Contains(tLower, "op-amp") || strings.Contains(tLower, "stability") || strings.Contains(tLower, "feedback") || strings.Contains(tLower, "phase margin"):
		dialogue, takeaways, formulas = s.generateOpAmpDebate(topic, track)

	case strings.Contains(tLower, "sampling") || strings.Contains(tLower, "nyquist") || strings.Contains(tLower, "aliasing"):
		dialogue, takeaways, formulas = s.generateSamplingDebate(topic, track)

	case strings.Contains(tLower, "fft") || strings.Contains(tLower, "fourier") || strings.Contains(tLower, "butterfly"):
		dialogue, takeaways, formulas = s.generateFFTDebate(topic, track)

	case strings.Contains(tLower, "cache") || strings.Contains(tLower, "mesi") || strings.Contains(tLower, "coherence"):
		dialogue, takeaways, formulas = s.generateCacheDebate(topic, track)

	case strings.Contains(tLower, "transformer") || strings.Contains(tLower, "attention") || strings.Contains(tLower, "self-attention"):
		dialogue, takeaways, formulas = s.generateTransformerDebate(topic, track)

	default:
		dialogue, takeaways, formulas = s.generateUniversalEngineeringDebate(topic, track)
	}

	return &AudioDebateOverview{
		Topic:             topic,
		CourseCode:        courseCode,
		FocusTrack:        track,
		EstimatedDuration: duration,
		Host1Name:         "Alex (Intuitive Engineer)",
		Host2Name:         "Sam (Rigorous Analyst)",
		Dialogue:          dialogue,
		Takeaways:         takeaways,
		KeyFormulas:       formulas,
		GeneratedAt:       time.Now(),
	}
}

func (s *AudioDebateSynthesizer) generateBuckDebate(topic string, track FocusTrack) ([]DialogueTurn, []string, []string) {
	var dialogue []DialogueTurn

	if track == TrackGateAspirant {
		dialogue = []DialogueTurn{
			{
				TurnID: 1, Speaker: "Alex (Intuitive Engineer)", Emotion: "EXCITED", AudioSFX: "[SFX: Upbeat Tech Intro Chime]", TimestampSec: 0,
				Text: "Welcome to iMentor Audio Deep Dive, GATE Edition! Today we're locking in on the step-down buck converter, focusing on high-yield boundary traps and numerical shortcuts.",
				KeyConcept: "GATE Overview",
			},
			{
				TurnID: 2, Speaker: "Sam (Rigorous Analyst)", Emotion: "ANALYTICAL", TimestampSec: 15,
				Text: "Let's cut straight to the core equation: under continuous conduction mode, Volt-Second balance gives $V_o = D \\cdot V_{in}$. But the #1 mistake in GATE NAT questions is assuming CCM always holds without verifying the critical conduction parameter.",
				KeyConcept: "Volt-Second Balance & CCM Condition",
			},
			{
				TurnID: 3, Speaker: "Alex (Intuitive Engineer)", Emotion: "CHALLENGING", AudioSFX: "[SFX: Digital Pen Tap]", TimestampSec: 36,
				Text: "That's the classic trap! If the load resistor $R_L$ is too large or inductance $L$ is too small, the inductor current drops to zero before the cycle ends. You enter Discontinuous Conduction Mode (DCM), and $V_o$ skyrockets!",
				KeyConcept: "DCM Voltage Surge Trap",
			},
			{
				TurnID: 4, Speaker: "Sam (Rigorous Analyst)", Emotion: "INSIGHTFUL", TimestampSec: 58,
				Text: "Exactly. The critical boundary condition is $I_{L,min} = 0$, where peak ripple equals twice the average load current: $\\Delta I_L = 2 I_o$. That gives the critical inductance formula: $L_{crit} = \\frac{(1-D)R_L}{2 f_s}$. If $L < L_{crit}$, you must use the DCM quadratic formulation.",
				KeyConcept: "Critical Inductance Formulation",
			},
			{
				TurnID: 5, Speaker: "Alex (Intuitive Engineer)", Emotion: "PROVOCATIVE", TimestampSec: 84,
				Text: "And what about the maximum ripple point? Questions love to ask: 'At what duty cycle is the inductor ripple maximized for a fixed switching frequency?'",
				KeyConcept: "Maximum Ripple Condition",
			},
			{
				TurnID: 6, Speaker: "Sam (Rigorous Analyst)", Emotion: "TRIUMPHANT", AudioSFX: "[SFX: Insight Stinger]", TimestampSec: 104,
				Text: "Since $\\Delta I_L = \\frac{V_{in} D (1-D)}{L f_s}$, the term $D(1-D)$ hits its global maximum at exactly $D = 0.50$, where $D(1-D) = 0.25$. Always calculate core saturation limits at $D = 0.50$!",
				KeyConcept: "Core Saturation at D=0.5",
			},
			{
				TurnID: 7, Speaker: "Alex (Intuitive Engineer)", Emotion: "REFLECTIVE", AudioSFX: "[SFX: Outro Music Swell]", TimestampSec: 128,
				Text: "Remember: check $L_{crit}$ first, verify CCM, and you'll nail those 2-mark GATE numericals every single time. See you in the next deep dive!",
				KeyConcept: "GATE Wrap-Up",
			},
		}
	} else if track == TrackPlacementPrep {
		dialogue = []DialogueTurn{
			{
				TurnID: 1, Speaker: "Alex (Intuitive Engineer)", Emotion: "EXCITED", AudioSFX: "[SFX: Upbeat Tech Intro Chime]", TimestampSec: 0,
				Text: "Welcome to iMentor Audio! Today, we're dissecting the Buck Converter from a Tier-1 hardware engineering interview perspective—think Texas Instruments, Qualcomm, and Tesla.",
				KeyConcept: "Hardware Interview Context",
			},
			{
				TurnID: 2, Speaker: "Sam (Rigorous Analyst)", Emotion: "ANALYTICAL", TimestampSec: 16,
				Text: "In hardware design, an interviewer will never just ask you for $V_o = D V_{in}$. They'll ask: 'Why does our switch node ring at 200 MHz, and how do you size an RC snubber without blowing up thermal dissipation?'",
				KeyConcept: "Parasitic Ringing & Snubber Design",
			},
			{
				TurnID: 3, Speaker: "Alex (Intuitive Engineer)", Emotion: "INSIGHTFUL", AudioSFX: "[SFX: Digital Pen Tap]", TimestampSec: 38,
				Text: "Right! That high-frequency ringing comes from the parasitic inductance of the PCB trace resonating with the MOSFET's output capacitance $C_{oss}$. To fix it, you damp the tank circuit with $R_{snub} = \\sqrt{L_p / C_{oss}}$ and place it right across the switch node.",
				KeyConcept: "Parasitic Tank Damping",
			},
			{
				TurnID: 4, Speaker: "Sam (Rigorous Analyst)", Emotion: "CHALLENGING", TimestampSec: 62,
				Text: "Another favorite interview question: 'Why replace the freewheeling Schottky diode with a low-side MOSFET to make a Synchronous Buck?'",
				KeyConcept: "Synchronous Rectification",
			},
			{
				TurnID: 5, Speaker: "Alex (Intuitive Engineer)", Emotion: "EXCITED", TimestampSec: 80,
				Text: "Because a Schottky has a fixed $0.4\\text{V}$ forward drop. At $20\\text{A}$ output, that's $8\\text{W}$ of pure wasted heat! A MOSFET with $R_{DS(on)} = 2\\text{ m}\\Omega$ only drops $40\\text{mV}$, saving massive efficiency.",
				KeyConcept: "Conduction Loss Reduction",
			},
			{
				TurnID: 6, Speaker: "Sam (Rigorous Analyst)", Emotion: "INSIGHTFUL", TimestampSec: 104,
				Text: "Just be prepared to explain dead-time management. If both FETs turn on together, you get catastrophic shoot-through. But if dead-time is too long, the body diode conducts and causes reverse-recovery loss $Q_{rr}$.",
				KeyConcept: "Dead-Time & Shoot-Through Tradeoff",
			},
			{
				TurnID: 7, Speaker: "Alex (Intuitive Engineer)", Emotion: "TRIUMPHANT", AudioSFX: "[SFX: Outro Music Swell]", TimestampSec: 130,
				Text: "Master these physical trade-offs and layout parasitic realities, and you'll stand out in any core hardware interview!",
				KeyConcept: "Placement Summary",
			},
		}
	} else {
		// Default Standard B.Tech Track
		dialogue = []DialogueTurn{
			{
				TurnID: 1, Speaker: "Alex (Intuitive Engineer)", Emotion: "EXCITED", AudioSFX: "[SFX: Upbeat Tech Intro Chime]", TimestampSec: 0,
				Text: "Welcome to the iMentor Deep Dive! Today, we're tearing down one of the foundational building blocks of modern power electronics—the step-down buck converter.",
				KeyConcept: "Buck Converter Overview",
			},
			{
				TurnID: 2, Speaker: "Sam (Rigorous Analyst)", Emotion: "ANALYTICAL", TimestampSec: 15,
				Text: "At first glance, students often ask: 'Why not just use a simple resistive voltage divider?' But in engineering, efficiency is king. A resistor converts excess voltage into wasted thermal heat.",
				KeyConcept: "Efficiency vs Resistive Loss",
			},
			{
				TurnID: 3, Speaker: "Alex (Intuitive Engineer)", Emotion: "INSIGHTFUL", TimestampSec: 34,
				Text: "Exactly. If you drop 48 volts down to 12 volts with a linear regulator, you throw away 75% of your power as pure heat! But with a buck converter, we use high-speed PWM switching across reactive storage elements.",
				KeyConcept: "Energy Storage Principle",
			},
			{
				TurnID: 4, Speaker: "Sam (Rigorous Analyst)", Emotion: "ANALYTICAL", AudioSFX: "[SFX: Digital Whiteboard Marker]", TimestampSec: 55,
				Text: "The mathematical key is Faraday's Law and volt-second balance: under steady-state continuous conduction mode, the net voltage-time integral across the inductor over one switching period must strictly equal zero. That yields $V_o = D \\cdot V_{in}$.",
				KeyConcept: "Volt-Second Balance Formulation",
			},
			{
				TurnID: 5, Speaker: "Alex (Intuitive Engineer)", Emotion: "CHALLENGING", TimestampSec: 78,
				Text: "And when the switch is ON, the inductor stores energy in its magnetic field while current ramps up. When the switch turns OFF, that magnetic field collapses and pushes current through the freewheeling diode, keeping the output smooth!",
				KeyConcept: "Magnetic Energy Buffering",
			},
			{
				TurnID: 6, Speaker: "Sam (Rigorous Analyst)", Emotion: "INSIGHTFUL", TimestampSec: 102,
				Text: "Spot on. That's why sizing the critical inductance $L_{crit} = \\frac{(1-D)R_L}{2 f_s}$ is paramount. Make sure your inductor is sized above $L_{crit}$ to stay in stable continuous conduction mode.",
				KeyConcept: "Critical Inductance Criterion",
			},
			{
				TurnID: 7, Speaker: "Alex (Intuitive Engineer)", Emotion: "TRIUMPHANT", AudioSFX: "[SFX: Outro Music Swell]", TimestampSec: 125,
				Text: "Buck converters power everything from your laptop's CPU to EV motor controllers. Master the volt-second balance, and you master modern power conversion!",
				KeyConcept: "Real-World Impact",
			},
		}
	}

	takeaways := []string{
		"Volt-Second Balance is the foundational steady-state equilibrium condition: net inductor voltage integral over Ts equals zero.",
		"Continuous Conduction Mode (CCM) requires inductance L > L_crit = (1 - D) * R_L / (2 * fs).",
		"Inductor ripple current reaches its maximum at D = 0.50 (where D*(1-D) = 0.25).",
		"Synchronous buck converters replace the freewheeling diode with a low-side MOSFET to slash conduction losses.",
	}

	formulas := []string{
		"V_o = D \\cdot V_{in}",
		"\\Delta I_L = \\frac{V_{in} D (1 - D)}{L f_s}",
		"L_{crit} = \\frac{(1 - D) R_L}{2 f_s}",
		"\\Delta V_o = \\frac{\\Delta I_L}{8 f_s C} = \\frac{V_{in} D (1 - D)}{8 L C f_s^2}",
	}

	return dialogue, takeaways, formulas
}

func (s *AudioDebateSynthesizer) generateBoostDebate(topic string, track FocusTrack) ([]DialogueTurn, []string, []string) {
	dialogue := []DialogueTurn{
		{
			TurnID: 1, Speaker: "Alex (Intuitive Engineer)", Emotion: "EXCITED", AudioSFX: "[SFX: Upbeat Tech Intro Chime]", TimestampSec: 0,
			Text: "Welcome back! Today Sam and I are breaking down the step-up Boost Converter—the circuit that takes a lower voltage and pumps it up higher without a bulky transformer.",
			KeyConcept: "Boost Converter Principle",
		},
		{
			TurnID: 2, Speaker: "Sam (Rigorous Analyst)", Emotion: "ANALYTICAL", TimestampSec: 16,
			Text: "It sounds like magic at first, but it's pure conservation of energy. In steady state, $V_o = \\frac{V_{in}}{1 - D}$. Since duty cycle $D$ is between 0 and 1, the denominator is less than 1, so $V_o$ is strictly greater than $V_{in}$.",
			KeyConcept: "Ideal Voltage Gain",
		},
		{
			TurnID: 3, Speaker: "Alex (Intuitive Engineer)", Emotion: "INSIGHTFUL", AudioSFX: "[SFX: Digital Pen Tap]", TimestampSec: 38,
			Text: "Here's the physical intuition: when the switch closes, the inductor charges up directly from $V_{in}$. When the switch opens, the inductor's voltage kicks in series with $V_{in}$, pushing energy through the diode into the output capacitor!",
			KeyConcept: "Inductive Voltage Kick",
		},
		{
			TurnID: 4, Speaker: "Sam (Rigorous Analyst)", Emotion: "CHALLENGING", TimestampSec: 62,
			Text: "Watch out for a classic Right-Half-Plane (RHP) zero in the small-signal control transfer function. When you suddenly increase duty cycle $D$ to boost voltage, output current initially dips before it rises!",
			KeyConcept: "Right-Half-Plane (RHP) Zero",
		},
		{
			TurnID: 5, Speaker: "Alex (Intuitive Engineer)", Emotion: "PROVOCATIVE", TimestampSec: 86,
			Text: "Because during the ON time, the load is completely disconnected from the input and runs solely on the capacitor! That phase lag is why boost converters are notoriously tricky to stabilize at wide bandwidths.",
			KeyConcept: "Capacitor Disconnection Phase Lag",
		},
		{
			TurnID: 6, Speaker: "Sam (Rigorous Analyst)", Emotion: "TRIUMPHANT", AudioSFX: "[SFX: Outro Music Swell]", TimestampSec: 110,
			Text: "Keep your crossover frequency well below the RHP zero frequency $\\omega_{RHP} = \\frac{R_L(1-D)^2}{L}$, and you'll maintain rock-solid phase margin.",
			KeyConcept: "Control Stability Limit",
		},
	}

	takeaways := []string{
		"Boost converter voltage conversion ratio is Vo = Vin / (1 - D).",
		"During switch ON time, the load is disconnected from the supply and supported solely by the output filter capacitor.",
		"Boost converters contain a Right-Half-Plane (RHP) zero in CCM, imposing a hard limit on closed-loop control bandwidth.",
	}

	formulas := []string{
		"V_o = \\frac{V_{in}}{1 - D}",
		"\\omega_{RHP} = \\frac{R_L (1 - D)^2}{L}",
		"L_{crit} = \\frac{D (1 - D)^2 R_L}{2 f_s}",
	}

	return dialogue, takeaways, formulas
}

func (s *AudioDebateSynthesizer) generateMosfetDebate(topic string, track FocusTrack) ([]DialogueTurn, []string, []string) {
	dialogue := []DialogueTurn{
		{
			TurnID: 1, Speaker: "Alex (Intuitive Engineer)", Emotion: "EXCITED", AudioSFX: "[SFX: Upbeat Tech Intro Chime]", TimestampSec: 0,
			Text: "Today we're tackling Power MOSFET losses—the difference between a converter that runs cool and one that melts into slag on your test bench.",
			KeyConcept: "MOSFET Loss Overview",
		},
		{
			TurnID: 2, Speaker: "Sam (Rigorous Analyst)", Emotion: "ANALYTICAL", TimestampSec: 16,
			Text: "Total MOSFET loss decomposes into three distinct terms: Conduction Loss ($I_{rms}^2 R_{DS(on)}$), Switching Loss ($P_{sw} = \\frac{1}{2} V_{ds} I_d (t_r + t_f) f_s$), and Gate Drive Loss ($P_g = Q_g V_{gs} f_s$).",
			KeyConcept: "Three Loss Components",
		},
		{
			TurnID: 3, Speaker: "Alex (Intuitive Engineer)", Emotion: "INSIGHTFUL", TimestampSec: 38,
			Text: "And that creates the classic engineer's dilemma: if you buy a huge die with ultra-low $R_{DS(on)}$ to slash conduction loss, its gate charge $Q_g$ and output capacitance $C_{oss}$ shoot through the roof, multiplying switching loss!",
			KeyConcept: "Silicon Die Size Tradeoff (Figure of Merit)",
		},
		{
			TurnID: 4, Speaker: "Sam (Rigorous Analyst)", Emotion: "CHALLENGING", TimestampSec: 62,
			Text: "That's why engineers look at the Figure of Merit ($FOM = R_{DS(on)} \\times Q_g$). Wide-bandgap semiconductors like GaN HEMTs offer FOMs nearly an order of magnitude superior to traditional silicon.",
			KeyConcept: "Figure of Merit & GaN Advances",
		},
		{
			TurnID: 5, Speaker: "Alex (Intuitive Engineer)", Emotion: "TRIUMPHANT", AudioSFX: "[SFX: Outro Music Swell]", TimestampSec: 86,
			Text: "Balance your conduction and switching losses at the target switching frequency, and design proper thermal heatsinking using $\\Delta T = P_{total} \\cdot \\theta_{JA}$.",
			KeyConcept: "Thermal Heatsink Sizing",
		},
	}

	takeaways := []string{
		"Total dissipation = Conduction Loss + Switching Loss + Gate Drive Loss + Output Capacitance Loss.",
		"Figure of Merit (FOM = RDS(on) * Qg) is the standard metric for comparing semiconductor switching efficiency.",
		"Thermal junction temperature Tj = Ta + P_total * theta_JA must never exceed maximum datasheet rating (typically 150°C-175°C).",
	}

	formulas := []string{
		"P_{cond} = I_{rms}^2 \\cdot R_{DS(on)}",
		"P_{sw} = \\frac{1}{2} V_{ds} I_d (t_r + t_f) f_s",
		"T_j = T_a + P_{loss} \\cdot (\\theta_{JC} + \\theta_{CS} + \\theta_{SA})",
	}

	return dialogue, takeaways, formulas
}

func (s *AudioDebateSynthesizer) generateOpAmpDebate(topic string, track FocusTrack) ([]DialogueTurn, []string, []string) {
	dialogue := []DialogueTurn{
		{
			TurnID: 1, Speaker: "Alex (Intuitive Engineer)", Emotion: "EXCITED", AudioSFX: "[SFX: Upbeat Tech Intro Chime]", TimestampSec: 0,
			Text: "Welcome to the deep dive on Op-Amp feedback stability! Today we answer why a circuit that looks perfect on paper can turn into a 10 MHz oscillator in the lab.",
			KeyConcept: "Op-Amp Stability Problem",
		},
		{
			TurnID: 2, Speaker: "Sam (Rigorous Analyst)", Emotion: "ANALYTICAL", TimestampSec: 17,
			Text: "Stability is governed by Barkhausen's criterion: if loop gain $|A\\beta| \\ge 1$ at the exact frequency where phase shift reaches $-180^\\circ$, negative feedback turns into regenerative positive feedback, and the amplifier oscillates.",
			KeyConcept: "Barkhausen Criterion",
		},
		{
			TurnID: 3, Speaker: "Alex (Intuitive Engineer)", Emotion: "INSIGHTFUL", TimestampSec: 40,
			Text: "That's why Phase Margin is your safety cushion! It's how many degrees of phase you have left before hitting $-180^\\circ$ at the unity gain frequency ($|A\\beta| = 1$).",
			KeyConcept: "Phase Margin Definition",
		},
		{
			TurnID: 4, Speaker: "Sam (Rigorous Analyst)", Emotion: "CHALLENGING", TimestampSec: 62,
			Text: "For critical damping with zero step overshoot, you need $PM \\ge 65^\\circ$. If your phase margin drops below $45^\\circ$, you get severe ringing, and below $0^\\circ$, you get sustained oscillation.",
			KeyConcept: "Damping vs Phase Margin",
		},
		{
			TurnID: 5, Speaker: "Alex (Intuitive Engineer)", Emotion: "TRIUMPHANT", AudioSFX: "[SFX: Outro Music Swell]", TimestampSec: 84,
			Text: "Keep capacitive loads isolated with a series resistor, apply dominant pole compensation, and protect your phase margin at all costs!",
			KeyConcept: "Compensation Best Practices",
		},
	}

	takeaways := []string{
		"Barkhausen criterion dictates that oscillation occurs when loop gain |A*beta| >= 1 with 180° phase lag.",
		"Phase Margin measures stability margin at unity-gain frequency; target PM >= 60° for clean step response without ringing.",
		"Capacitive loading on an op-amp output creates an extra pole with open-loop output impedance Ro, eroding phase margin.",
	}

	formulas := []string{
		"T(s) = A(s) \\cdot \\beta(s)",
		"PM = 180^\\circ + \\angle T(j\\omega_{ugc})",
		"f_{pole} = \\frac{1}{2\\pi R_o C_L}",
	}

	return dialogue, takeaways, formulas
}

func (s *AudioDebateSynthesizer) generateSamplingDebate(topic string, track FocusTrack) ([]DialogueTurn, []string, []string) {
	dialogue := []DialogueTurn{
		{
			TurnID: 1, Speaker: "Alex (Intuitive Engineer)", Emotion: "EXCITED", AudioSFX: "[SFX: Upbeat Tech Intro Chime]", TimestampSec: 0,
			Text: "Welcome to iMentor Audio! Today we're bridging continuous time and discrete time with the Nyquist-Shannon Sampling Theorem.",
			KeyConcept: "Sampling Theorem Basics",
		},
		{
			TurnID: 2, Speaker: "Sam (Rigorous Analyst)", Emotion: "ANALYTICAL", TimestampSec: 15,
			Text: "The theorem states that a continuous bandlimited signal with maximum frequency component $f_{max}$ can be perfectly reconstructed from its discrete samples if and only if sampling rate $f_s > 2 f_{max}$.",
			KeyConcept: "Nyquist Rate Condition",
		},
		{
			TurnID: 3, Speaker: "Alex (Intuitive Engineer)", Emotion: "CHALLENGING", TimestampSec: 36,
			Text: "And what happens if you violate it? Aliasing! High-frequency components fold back across the Nyquist boundary $f_s / 2$ and masquerade as false low-frequency ghost signals that corrupt your ADC data.",
			KeyConcept: "Spectral Aliasing Folding",
		},
		{
			TurnID: 4, Speaker: "Sam (Rigorous Analyst)", Emotion: "INSIGHTFUL", TimestampSec: 58,
			Text: "In frequency domain, periodic impulse sampling replicates the continuous spectrum $X(f)$ at every multiple of $f_s$: $X_s(f) = \\frac{1}{T_s} \\sum_{k=-\\infty}^{\\infty} X(f - k f_s)$. If $f_s < 2 f_{max}$, adjacent spectral replicas overlap.",
			KeyConcept: "Spectral Replication Math",
		},
		{
			TurnID: 5, Speaker: "Alex (Intuitive Engineer)", Emotion: "TRIUMPHANT", AudioSFX: "[SFX: Outro Music Swell]", TimestampSec: 82,
			Text: "Always put an analog anti-aliasing low-pass filter in front of your ADC before digitization, and sample safely above the Nyquist boundary!",
			KeyConcept: "Anti-Aliasing Filter Role",
		},
	}

	takeaways := []string{
		"Sampling rate must strictly satisfy fs > 2 * f_max to avoid spectral overlap and preserve original signal information.",
		"Sampling replicates the baseband spectrum at integer multiples of the sampling frequency k*fs.",
		"Analog anti-aliasing filters are essential before ADC conversion to reject out-of-band noise and prevent irreversible aliasing.",
	}

	formulas := []string{
		"f_s > 2 f_{max}",
		"X_s(f) = \\frac{1}{T_s} \\sum_{k=-\\infty}^{\\infty} X(f - k f_s)",
		"f_{alias} = |f - k f_s|",
	}

	return dialogue, takeaways, formulas
}

func (s *AudioDebateSynthesizer) generateFFTDebate(topic string, track FocusTrack) ([]DialogueTurn, []string, []string) {
	dialogue := []DialogueTurn{
		{
			TurnID: 1, Speaker: "Alex (Intuitive Engineer)", Emotion: "EXCITED", AudioSFX: "[SFX: Upbeat Tech Intro Chime]", TimestampSec: 0,
			Text: "Today we're talking about one of the top 10 algorithms of the 20th century—the Fast Fourier Transform (FFT).",
			KeyConcept: "FFT Significance",
		},
		{
			TurnID: 2, Speaker: "Sam (Rigorous Analyst)", Emotion: "ANALYTICAL", TimestampSec: 15,
			Text: "The standard Discrete Fourier Transform (DFT) requires $N^2$ complex multiplications. For $N = 1024$ points, that's over 1 million operations! Cooley and Tukey recognized that symmetry in twiddle factors allows divide-and-conquer.",
			KeyConcept: "DFT Complexity vs FFT",
		},
		{
			TurnID: 3, Speaker: "Alex (Intuitive Engineer)", Emotion: "INSIGHTFUL", TimestampSec: 36,
			Text: "By splitting the sequence into even and odd index points recursively, the Radix-2 FFT reduces computational complexity down to $O(N \\log_2 N)$. For 1024 points, that drops operations from 1,000,000 down to just 5,120!",
			KeyConcept: "Radix-2 Butterfly Decomposition",
		},
		{
			TurnID: 4, Speaker: "Sam (Rigorous Analyst)", Emotion: "CHALLENGING", TimestampSec: 59,
			Text: "The twiddle factor periodicity $W_N^{k + N/2} = -W_N^k$ enables the iconic butterfly computation: $X[k] = E[k] + W_N^k O[k]$ and $X[k + N/2] = E[k] - W_N^k O[k]$, computing two outputs per multiplication.",
			KeyConcept: "Twiddle Factor Symmetry",
		},
		{
			TurnID: 5, Speaker: "Alex (Intuitive Engineer)", Emotion: "TRIUMPHANT", AudioSFX: "[SFX: Outro Music Swell]", TimestampSec: 82,
			Text: "That algorithmic speedup is what makes real-time 5G communications, radar processing, and audio compression possible. Pure mathematical elegance!",
			KeyConcept: "Impact on Modern DSP",
		},
	}

	takeaways := []string{
		"Cooley-Tukey Radix-2 FFT slashes computation from O(N^2) to O(N log2 N).",
		"Twiddle factor symmetry W_N^(k + N/2) = -W_N^k enables dual-output butterfly computation.",
		"Requires bit-reversal indexing for in-place Decimation-in-Time computation.",
	}

	formulas := []string{
		"X[k] = \\sum_{n=0}^{N-1} x[n] W_N^{kn}, \\quad W_N = e^{-j 2\\pi / N}",
		"X[k] = E[k] + W_N^k O[k]",
		"X[k + N/2] = E[k] - W_N^k O[k]",
	}

	return dialogue, takeaways, formulas
}

func (s *AudioDebateSynthesizer) generateCacheDebate(topic string, track FocusTrack) ([]DialogueTurn, []string, []string) {
	dialogue := []DialogueTurn{
		{
			TurnID: 1, Speaker: "Alex (Intuitive Engineer)", Emotion: "EXCITED", AudioSFX: "[SFX: Upbeat Tech Intro Chime]", TimestampSec: 0,
			Text: "Welcome to computer architecture! Today we're diving into multi-core Cache Coherence and the MESI protocol.",
			KeyConcept: "Cache Coherence Problem",
		},
		{
			TurnID: 2, Speaker: "Sam (Rigorous Analyst)", Emotion: "ANALYTICAL", TimestampSec: 15,
			Text: "In a multi-core processor, every core has its own private L1 cache. If Core 1 modifies variable X in L1 while Core 2 reads stale value X from its L1, data integrity collapses. We need hardware cache coherence.",
			KeyConcept: "Stale Data Hazard",
		},
		{
			TurnID: 3, Speaker: "Alex (Intuitive Engineer)", Emotion: "INSIGHTFUL", TimestampSec: 36,
			Text: "MESI solves this with 4 explicit states: Modified (dirty, private), Exclusive (clean, private), Shared (clean, present in other caches), and Invalid (stale data, do not read)!",
			KeyConcept: "Four MESI States",
		},
		{
			TurnID: 4, Speaker: "Sam (Rigorous Analyst)", Emotion: "CHALLENGING", TimestampSec: 58,
			Text: "The key mechanism is bus snooping. When Core 1 wants to write to a line in Shared state, it broadcasts a 'BusReadX' invalidate signal, forcing all other cores to drop that line into the Invalid state before writing.",
			KeyConcept: "Bus Invalidation Protocol",
		},
		{
			TurnID: 5, Speaker: "Alex (Intuitive Engineer)", Emotion: "TRIUMPHANT", AudioSFX: "[SFX: Outro Music Swell]", TimestampSec: 80,
			Text: "Beware of false sharing—where two independent variables live on the same 64-byte cache line, causing unnecessary invalidation ping-pong across cores!",
			KeyConcept: "False Sharing Mitigation",
		},
	}

	takeaways := []string{
		"MESI protocol enforces coherent memory views across distributed multi-core caches.",
		"Four states: Modified (dirty), Exclusive (clean private), Shared (clean shared), Invalid (stale).",
		"False sharing occurs when independent variables occupy the same 64-byte cache line, causing bus invalidation ping-pong.",
	}

	formulas := []string{
		"\\text{States: } \\{M, E, S, I\\}",
		"\\text{Line Size} = 64\\text{ Bytes}",
		"\\text{AMAT} = \\text{Hit Time} + (\\text{Miss Rate} \\times \\text{Miss Penalty})",
	}

	return dialogue, takeaways, formulas
}

func (s *AudioDebateSynthesizer) generateTransformerDebate(topic string, track FocusTrack) ([]DialogueTurn, []string, []string) {
	dialogue := []DialogueTurn{
		{
			TurnID: 1, Speaker: "Alex (Intuitive Engineer)", Emotion: "EXCITED", AudioSFX: "[SFX: Upbeat Tech Intro Chime]", TimestampSec: 0,
			Text: "Today we're unpacking the mechanism powering modern frontier AI—the Transformer Scaled Dot-Product Self-Attention mechanism!",
			KeyConcept: "Transformer Attention Architecture",
		},
		{
			TurnID: 2, Speaker: "Sam (Rigorous Analyst)", Emotion: "ANALYTICAL", TimestampSec: 16,
			Text: "At its mathematical core, attention maps queries and keys to attention weights via Softmax: $\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right) V$.",
			KeyConcept: "Attention Formulation",
		},
		{
			TurnID: 3, Speaker: "Alex (Intuitive Engineer)", Emotion: "INSIGHTFUL", TimestampSec: 38,
			Text: "Here's the search engine analogy: the Query $Q$ is what you're looking for, the Key $K$ is the title tag of every item in the database, and the Value $V$ is the actual content returned weighted by relevance score!",
			KeyConcept: "Query-Key-Value Analogy",
		},
		{
			TurnID: 4, Speaker: "Sam (Rigorous Analyst)", Emotion: "CHALLENGING", TimestampSec: 60,
			Text: "And why the scaling factor $\\frac{1}{\\sqrt{d_k}}$? For large embedding dimensions $d_k$, dot products grow large in magnitude, pushing the softmax function into regions with vanishingly small gradients. Scaling stabilizes gradient backpropagation.",
			KeyConcept: "Scaling Factor Function",
		},
		{
			TurnID: 5, Speaker: "Alex (Intuitive Engineer)", Emotion: "TRIUMPHANT", AudioSFX: "[SFX: Outro Music Swell]", TimestampSec: 84,
			Text: "By allowing every token to attend to every other token simultaneously with $O(N^2)$ parallelism, transformers eliminated the sequential bottleneck of RNNs and sparked the modern AI revolution!",
			KeyConcept: "Parallelism over RNNs",
		},
	}

	takeaways := []string{
		"Scaled Dot-Product Attention weights values V by normalized query-key similarity scores.",
		"Scaling by sqrt(d_k) prevents dot-product explosion and softmax gradient vanishing.",
		"Multi-Head Attention projects Q, K, V into multiple subspaces to capture diverse contextual relationships.",
	}

	formulas := []string{
		"\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}}\\right) V",
		"\\text{MultiHead}(Q, K, V) = \\text{Concat}(\\text{head}_1, \\dots, \\text{head}_h) W^O",
		"\\text{head}_i = \\text{Attention}(Q W_i^Q, K W_i^K, V W_i^V)",
	}

	return dialogue, takeaways, formulas
}

func (s *AudioDebateSynthesizer) generateUniversalEngineeringDebate(topic string, track FocusTrack) ([]DialogueTurn, []string, []string) {
	dialogue := []DialogueTurn{
		{
			TurnID: 1, Speaker: "Alex (Intuitive Engineer)", Emotion: "EXCITED", AudioSFX: "[SFX: Upbeat Tech Intro Chime]", TimestampSec: 0,
			Text: fmt.Sprintf("Welcome back to the iMentor Deep Dive! Today Sam and I are breaking down **%s** from first principles.", topic),
			KeyConcept: fmt.Sprintf("Core Definition: %s", topic),
		},
		{
			TurnID: 2, Speaker: "Sam (Rigorous Analyst)", Emotion: "ANALYTICAL", TimestampSec: 18,
			Text: fmt.Sprintf("When analyzing %s in engineering, the key isn't memorizing formulas—it's understanding the governing conservation laws and boundary conditions that dictate system behavior.", topic),
			KeyConcept: "First-Principles Conservation",
		},
		{
			TurnID: 3, Speaker: "Alex (Intuitive Engineer)", Emotion: "INSIGHTFUL", AudioSFX: "[SFX: Digital Pen Tap]", TimestampSec: 40,
			Text: "Let's trace what happens when we look at the physical energy balance and the primary operating regimes step-by-step.",
			KeyConcept: "Operating Regimes",
		},
		{
			TurnID: 4, Speaker: "Sam (Rigorous Analyst)", Emotion: "CHALLENGING", TimestampSec: 62,
			Text: "Always verify physical limits: check what happens as frequency tends to zero, or as load resistance approaches infinity. Boundary condition analysis exposes non-linearities and stability limits instantly.",
			KeyConcept: "Boundary Condition Limits",
		},
		{
			TurnID: 5, Speaker: "Alex (Intuitive Engineer)", Emotion: "TRIUMPHANT", AudioSFX: "[SFX: Outro Music Swell]", TimestampSec: 86,
			Text: fmt.Sprintf("Mastering %s comes down to connecting the physical intuition with mathematical rigor. That's the hallmark of a world-class engineer!", topic),
			KeyConcept: "Engineering Synthesis",
		},
	}

	takeaways := []string{
		fmt.Sprintf("Establish physical conservation laws before deriving mathematical formulations for %s.", topic),
		"Always evaluate asymptotic boundary conditions (DC steady-state vs high-frequency limits).",
		"Verify dimensional consistency across all governing transfer functions and equations.",
	}

	formulas := []string{
		"\\mathbf{\\dot{x}}(t) = \\mathbf{A} \\mathbf{x}(t) + \\mathbf{B} \\mathbf{u}(t)",
		"G(s) = \\mathbf{C}(s\\mathbf{I} - \\mathbf{A})^{-1}\\mathbf{B} + \\mathbf{D}",
		"\\sum_{k} I_k = 0, \\quad \\oint \\mathbf{E} \\cdot d\\mathbf{l} = -\\frac{\\partial}{\\partial t} \\iint \\mathbf{B} \\cdot d\\mathbf{A}",
	}

	return dialogue, takeaways, formulas
}

// ToMarkdown formats the audio overview as a high-fidelity readable transcript
func (a *AudioDebateOverview) ToMarkdown() string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("# 🎙️ iMentor Audio Deep Dive: %s\n\n", a.Topic))
	sb.WriteString(fmt.Sprintf("**Hosts**: %s & %s | **Duration**: %s", a.Host1Name, a.Host2Name, a.EstimatedDuration))
	if a.FocusTrack != "" {
		sb.WriteString(fmt.Sprintf(" | **Focus Track**: `%s`", a.FocusTrack))
	}
	sb.WriteString("\n\n---\n\n")

	for _, d := range a.Dialogue {
		min := d.TimestampSec / 60
		sec := d.TimestampSec % 60
		icon := "👤"
		if strings.Contains(d.Speaker, "Alex") {
			icon = "⚡"
		} else if strings.Contains(d.Speaker, "Sam") {
			icon = "📐"
		}

		if d.AudioSFX != "" {
			sb.WriteString(fmt.Sprintf("🎶 *%s*\n\n", d.AudioSFX))
		}
		sb.WriteString(fmt.Sprintf("`[%02d:%02d]` **%s %s** *(%s)*:\n> %s\n\n", min, sec, icon, d.Speaker, d.Emotion, d.Text))
	}

	if len(a.KeyFormulas) > 0 {
		sb.WriteString("---\n\n### 📐 Key Governing Mathematical Formulas:\n")
		for _, f := range a.KeyFormulas {
			sb.WriteString(fmt.Sprintf("$$ %s $$\n", f))
		}
		sb.WriteString("\n")
	}

	sb.WriteString("---\n\n### 🔑 Key Engineering Takeaways:\n")
	for _, t := range a.Takeaways {
		sb.WriteString(fmt.Sprintf("- %s\n", t))
	}
	return sb.String()
}

// ToSSML formats the audio debate as Speech Synthesis Markup Language (SSML)
func (a *AudioDebateOverview) ToSSML() string {
	var sb strings.Builder
	sb.WriteString("<speak>\n")
	for _, d := range a.Dialogue {
		voiceName := "en-US-Neural2-J" // Default Alex
		if strings.Contains(d.Speaker, "Sam") {
			voiceName = "en-US-Neural2-D" // Sam (more analytical)
		}
		sb.WriteString(fmt.Sprintf("  <voice name=\"%s\">\n", voiceName))
		if d.Emotion == "EXCITED" || d.Emotion == "TRIUMPHANT" {
			sb.WriteString("    <prosody rate=\"fast\" pitch=\"+1st\">\n")
		} else if d.Emotion == "ANALYTICAL" {
			sb.WriteString("    <prosody rate=\"medium\" pitch=\"-1st\">\n")
		} else {
			sb.WriteString("    <prosody rate=\"medium\">\n")
		}
		sb.WriteString(fmt.Sprintf("      %s\n", d.Text))
		sb.WriteString("    </prosody>\n")
		sb.WriteString("  </voice>\n")
		sb.WriteString("  <break time=\"350ms\"/>\n")
	}
	sb.WriteString("</speak>\n")
	return sb.String()
}

// ToJSON serializes the audio debate overview to formatted JSON
func (a *AudioDebateOverview) ToJSON() (string, error) {
	bytes, err := json.MarshalIndent(a, "", "  ")
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// StudentInterjectionResponse represents the dynamic tri-party response when a student interjects hands-free
type StudentInterjectionResponse struct {
	InterjectionID   string         `json:"interjection_id"`
	Topic            string         `json:"topic"`
	FocusTrack       FocusTrack     `json:"focus_track"`
	StudentUtterance string         `json:"student_utterance"`
	BargeInTimestamp int            `json:"barge_in_timestamp"`
	InterruptedTurn  int            `json:"interrupted_turn"`
	HostResponses    []DialogueTurn `json:"host_responses"`
	NextTopicBranch  string         `json:"next_topic_branch"`
	IsHandsFree      bool           `json:"is_hands_free"`
	GeneratedAt      time.Time      `json:"generated_at"`
}

// HandleStudentInterjection processes live spoken student input, pauses the debate, and produces immediate co-host answers
func (s *AudioDebateSynthesizer) HandleStudentInterjection(topic string, currentTurnIndex int, studentUtterance string, track FocusTrack) *StudentInterjectionResponse {
	if track == "" {
		track = TrackStandardBTech
	}
	uLower := strings.ToLower(studentUtterance)
	interjectID := fmt.Sprintf("interject_%d", time.Now().UnixNano())

	var hostTurns []DialogueTurn

	switch {
	case strings.Contains(uLower, "frequency") || strings.Contains(uLower, "mhz") || strings.Contains(uLower, "khz") || strings.Contains(uLower, "faster"):
		hostTurns = []DialogueTurn{
			{
				TurnID:       1,
				Speaker:      "Sam (Rigorous Analyst)",
				Text:         fmt.Sprintf("Great hands-free question! You're asking about frequency scaling in **%s**. If you push switching frequency up to 1 MHz, inductor volume shrinks by nearly 70%% because $L_{crit} \\propto 1/f_s$. But here's the catch: MOSFET switching loss $P_{sw} = \\frac{1}{2} V_{in} I_o (t_r + t_f) f_s$ scales linearly with frequency.", topic),
				Emotion:      "INSIGHTFUL",
				AudioSFX:     "[SFX: Digital Pen Tap]",
				TimestampSec: 0,
				KeyConcept:   "Frequency Scaling vs Switching Loss",
			},
			{
				TurnID:       2,
				Speaker:      "Alex (Intuitive Engineer)",
				Text:         "Right! In traditional Silicon, your efficiency drops off a cliff at 1 MHz. But that's exactly why the industry transitioned to Gallium Nitride (GaN) HEMTs—they have near-zero reverse recovery and switch 10x faster with minimal thermal loss!",
				Emotion:      "EXCITED",
				TimestampSec: 18,
				KeyConcept:   "GaN WBG Enablement",
			},
		}

	case strings.Contains(uLower, "efficiency") || strings.Contains(uLower, "loss") || strings.Contains(uLower, "heat") || strings.Contains(uLower, "thermal"):
		hostTurns = []DialogueTurn{
			{
				TurnID:       1,
				Speaker:      "Alex (Intuitive Engineer)",
				Text:         "Spot on interjection! When discussing efficiency, never forget that power doesn't disappear—it turns into heat that will boil your PCB if your junction-to-ambient thermal resistance $\\theta_{JA}$ isn't properly heatsinked.",
				Emotion:      "CHALLENGING",
				AudioSFX:     "[SFX: Warning Tone]",
				TimestampSec: 0,
				KeyConcept:   "Thermal Dissipation",
			},
			{
				TurnID:       2,
				Speaker:      "Sam (Rigorous Analyst)",
				Text:         "Mathematically, junction temperature is $T_j = T_a + P_{loss} \\cdot \\theta_{JA}$. To optimize efficiency, you must balance conduction loss $I_{rms}^2 R_{DS(on)}$ against switching loss $\\frac{1}{2} V I f_s$ right at your target operating current.",
				Emotion:      "ANALYTICAL",
				TimestampSec: 16,
				KeyConcept:   "Thermal Resistance Model",
			},
		}

	case strings.Contains(uLower, "gate") || strings.Contains(uLower, "exam") || strings.Contains(uLower, "formula") || strings.Contains(uLower, "shortcut"):
		hostTurns = []DialogueTurn{
			{
				TurnID:       1,
				Speaker:      "Sam (Rigorous Analyst)",
				Text:         "Here is the exact GATE trick for this: questions frequently test whether the converter enters Discontinuous Conduction Mode (DCM). If $L < L_{crit} = \\frac{(1-D)R_L}{2 f_s}$, the classic $V_o = D V_{in}$ fails completely and output voltage shoots upward toward $V_{in}$!",
				Emotion:      "TRIUMPHANT",
				AudioSFX:     "[SFX: Lightbulb Ping]",
				TimestampSec: 0,
				KeyConcept:   "GATE DCM Trap Elimination",
			},
			{
				TurnID:       2,
				Speaker:      "Alex (Intuitive Engineer)",
				Text:         "Remember that rule: under light or no load ($R_L \\to \\infty$), $V_o$ approaches $V_{in}$ regardless of duty ratio. Always check $L_{crit}$ first before doing any 2-mark calculations!",
				Emotion:      "INSIGHTFUL",
				TimestampSec: 17,
				KeyConcept:   "No-Load Voltage Boost",
			},
		}

	default:
		hostTurns = []DialogueTurn{
			{
				TurnID:       1,
				Speaker:      "Alex (Intuitive Engineer)",
				Text:         fmt.Sprintf("Love that you jumped in with that point! Looking at '%s' from first principles, this directly connects to how energy is stored in the reactive magnetic field during each switching phase.", studentUtterance),
				Emotion:      "EXCITED",
				AudioSFX:     "[SFX: Digital Whiteboard Marker]",
				TimestampSec: 0,
				KeyConcept:   "Interactive Deepening",
			},
			{
				TurnID:       2,
				Speaker:      "Sam (Rigorous Analyst)",
				Text:         "And from the governing mathematics, maintaining volt-second equilibrium $\\int v_L dt = 0$ is what enforces steady-state stability. Now let's continue tracing the waveform boundary.",
				Emotion:      "ANALYTICAL",
				TimestampSec: 15,
				KeyConcept:   "Equilibrium Restoration",
			},
		}
	}

	return &StudentInterjectionResponse{
		InterjectionID:   interjectID,
		Topic:            topic,
		FocusTrack:       track,
		StudentUtterance: studentUtterance,
		BargeInTimestamp: currentTurnIndex * 15,
		InterruptedTurn:  currentTurnIndex,
		HostResponses:    hostTurns,
		NextTopicBranch:  "Resuming core analytical progression with student context integrated.",
		IsHandsFree:      true,
		GeneratedAt:      time.Now(),
	}
}
