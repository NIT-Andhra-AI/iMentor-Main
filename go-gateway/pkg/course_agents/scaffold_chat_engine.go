package course_agents

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"
)

// FocusTrack represents the mutually-exclusive learning persona chosen in the student profile
type FocusTrack string

const (
	TrackStandardBTech    FocusTrack = "STANDARD_BTECH"   // Default: B.Tech Engineering Student preparing on a topic
	TrackGateAspirant     FocusTrack = "GATE_ASPIRANT"    // GATE Exam Focus (PYQs, 2-mark NATs, boundary traps, quick formulas)
	TrackPlacementPrep    FocusTrack = "PLACEMENT_PREP"   // Core/Tech Industry Placements (Interview questions, datasheets, debugging)
	TrackEntrepreneurship FocusTrack = "ENTREPRENEURSHIP" // New Venture / Startup (BOM cost, techno-economic feasibility, standards)
	TrackResearcher       FocusTrack = "RESEARCHER"       // Research & Advanced Modeling (Literature, state-of-the-art, open problems)
)

// StudentProfile represents the learner model for zero-latency scaffolding adaptation
type StudentProfile struct {
	UserID         string             `json:"user_id"`
	FocusTrack     FocusTrack         `json:"focus_track"`     // Mutually exclusive: STANDARD_BTECH (default), GATE_ASPIRANT, PLACEMENT_PREP, ENTREPRENEURSHIP, RESEARCHER
	StudentLevel   string             `json:"student_level"`   // "BEGINNER", "INTERMEDIATE", "ADVANCED"
	LearningSpeed  string             `json:"learning_speed"`  // "FAST", "NORMAL", "THOROUGH"
	EmotionalState string             `json:"emotional_state"` // "CURIOUS", "CONFIDENT", "UNCERTAIN", "FRUSTRATED"
	ConceptMastery map[string]float64 `json:"concept_mastery"` // Topic -> Mastery Score (0.0 to 1.0)
	KnowledgeGaps  []string           `json:"knowledge_gaps"`  // Unresolved prerequisite concepts
	ActiveCourse   string             `json:"active_course"`
	ActiveLecture  int                `json:"active_lecture"`
}

// ScaffoldingPlan outlines the sequential pedagogical steps planned for the response
type ScaffoldingPlan struct {
	TargetConcept   string              `json:"target_concept"`
	ActiveTrack     FocusTrack          `json:"active_track"`
	ScaffoldDepth   string              `json:"scaffold_depth"`
	PlannedSections []string            `json:"planned_sections"`
	VisualArtifacts []string            `json:"visual_artifacts"`
	PersonaBridge   string              `json:"persona_bridge"`
	Complexity      *ComplexityEstimate `json:"complexity,omitempty"`
	ReasoningBranch *CandidateBranch    `json:"reasoning_branch,omitempty"`
}

// ScaffoldSection represents a single rendered step in the continuous explanation
type ScaffoldSection struct {
	Index       int    `json:"index"`
	Title       string `json:"title"`
	Content     string `json:"content"`
	HasVisual   bool   `json:"has_visual"`
	VisualType  string `json:"visual_type"`
	VisualCode  string `json:"visual_code"`
	IsSocratic  bool   `json:"is_socratic"`
	TimeTakenMs int64  `json:"time_taken_ms"`
}

// ScaffoldChatEngine coordinates low-latency student-adaptive generation via local SGLang
type ScaffoldChatEngine struct {
	sglangURL  string
	modelName  string
	httpClient *http.Client
	router     *AdaptiveReasoningRouter
}

// NewScaffoldChatEngine initializes the scaffolding engine
func NewScaffoldChatEngine(sglangURL, modelName string) *ScaffoldChatEngine {
	if sglangURL == "" {
		sglangURL = "http://localhost:8000/v1"
	}
	if modelName == "" {
		modelName = "Qwen/Qwen2.5-7B-Instruct-AWQ"
	}
	return &ScaffoldChatEngine{
		sglangURL:  sglangURL,
		modelName:  modelName,
		httpClient: &http.Client{Timeout: 60 * time.Second},
		router:     NewAdaptiveReasoningRouter(),
	}
}

// PlanScaffolding evaluates the student profile, active focus track, and Karpathy reasoning tier in < 1ms
func (e *ScaffoldChatEngine) PlanScaffolding(userQuery string, profile *StudentProfile) *ScaffoldingPlan {
	complexity := e.router.EstimateComplexity(userQuery, profile)

	track := TrackStandardBTech
	if profile != nil && profile.FocusTrack != "" {
		track = profile.FocusTrack
	}

	var sections []string
	var visuals []string
	var bridge string
	var depth string

	switch track {
	case TrackGateAspirant:
		depth = "RIGOROUS_GATE"
		sections = []string{
			"Operating Modes & Critical CCM/DCM Boundary Conditions",
			"Exact Governing Differential Equations & Critical Parameter Formulations",
			"High-Contrast Vector Circuit Schematic & Ripple Current Spectrum",
			"Advanced GATE Previous Year Examination Problem (2 Marks, NAT) & Trap Analysis",
			"High-Yield Exam Shortcuts & Common Traps",
		}
		visuals = []string{"CIRCUIT_SVG", "WAVEFORM_PLOT"}
		bridge = "Optimized for GATE examination speed, CCM/DCM boundary condition traps, and high-yield numerical accuracy."

	case TrackPlacementPrep:
		depth = "CORE_INDUSTRY"
		sections = []string{
			"Industrial Architecture, Topology Selection & System Constraints",
			"Component Selection Criteria & Datasheet Parameters (Thermal, Losses, EMI)",
			"Hardware Vector Topology, Parasitic Inductance & Hot-Loop Layout",
			"Practical Hardware Debugging & RC Snubber Network Optimization",
			"Tier-1 Core Engineering Technical Interview Questions & Model Solutions",
		}
		visuals = []string{"CIRCUIT_SVG", "INTERACTIVE_SLIDER"}
		bridge = "Tailored for Core Hardware Engineering & Tier-1 Company Technical Interviews (Texas Instruments, ABB, Apple Hardware, Tesla, Qualcomm)."

	case TrackEntrepreneurship:
		depth = "TECHNO_ECONOMIC"
		sections = []string{
			"Product Value Proposition & Target Application Requirements",
			"Bill of Materials (BOM) Cost Breakdown & Volume Sourcing Optimization",
			"Modular Vector System Architecture & Power Density Layout",
			"Industrial Standards & Regulatory Certification Roadmap (CISPR, IEC, RoHS)",
			"Techno-Economic Feasibility, Unit Economics & Market Sizing",
		}
		visuals = []string{"CIRCUIT_SVG", "INTERACTIVE_SLIDER"}
		bridge = "Oriented towards Hardware Startups, Productization, BOM Cost Engineering, and Venture Feasibility."

	case TrackResearcher:
		depth = "RESEARCH_FRONTIER"
		sections = []string{
			"Theoretical State-of-the-Art & Literature Landscape (IEEE TPEL/JESTPE)",
			"Rigorous Non-Linear Mathematical Modeling & State-Space Averaging",
			"High-Frequency Dynamic Small-Signal Vector Topology & Impedance Map",
			"Lyapunov Stability Proofs, Sliding Mode Control & Orbit Stability",
			"Open Research Challenges & High-Frequency Frontier Opportunities",
		}
		visuals = []string{"CIRCUIT_SVG", "WAVEFORM_PLOT", "MERMAID_DAG"}
		bridge = "Synthesized for Academic Research, Master's/Ph.D. Exploration, and IEEE Transactions rigor."

	default: // TrackStandardBTech (Default B.Tech Engineering Student)
		depth = "SEMESTER_BTECH"
		sections = []string{
			"Physical Working Principle & Intuitive Energy Balance",
			"High-Contrast Vector Circuit Schematic & Current Conduction Loops",
			"First-Principles Volt-Second & Ampere-Second Mathematical Derivations",
			"Dynamic Parameter Micro-Sandbox & Real-Time Waveform Realization",
			"Socratic Concept Checkpoint & Diagnostic Reflection",
		}
		visuals = []string{"CIRCUIT_SVG", "INTERACTIVE_SLIDER", "WAVEFORM_PLOT"}
		bridge = "Structured for B.Tech Semester Coursework, High Conceptual Clarity, and Rigorous Fundamentals."
	}

	plan := &ScaffoldingPlan{
		TargetConcept:   extractTargetConcept(userQuery),
		ActiveTrack:     track,
		ScaffoldDepth:   depth,
		PlannedSections: sections,
		VisualArtifacts: visuals,
		PersonaBridge:   bridge,
		Complexity:      complexity,
	}

	// If System 2 is warranted, run tree search and self-verification
	if complexity.Tier == TierAnalytical || complexity.Tier == TierRigorousProof {
		winner, _ := e.router.ExecuteSystem2Reasoning(userQuery, plan, complexity)
		plan.ReasoningBranch = winner
	}

	return plan
}

// GenerateScaffoldedResponse generates sequential sections with SGLang prefix caching and zero discontinuity
func (e *ScaffoldChatEngine) GenerateScaffoldedResponse(
	userQuery string,
	profile *StudentProfile,
	courseMem *CourseMemory,
	onSectionEmit func(section *ScaffoldSection),
) ([]ScaffoldSection, error) {
	start := time.Now()
	plan := e.PlanScaffolding(userQuery, profile)
	log.Printf("🧠 [Scaffold Engine] Plan formulated in %v for [%s] (Track: %s, Depth: %s, %d sections)",
		time.Since(start), plan.TargetConcept, plan.ActiveTrack, plan.ScaffoldDepth, len(plan.PlannedSections))

	var completedSections []ScaffoldSection
	var conversationContext strings.Builder

	// Build compact system instruction
	systemPrompt := e.buildSystemPrompt(plan, profile, courseMem)
	conversationContext.WriteString(fmt.Sprintf("User Question: %s\n\n", userQuery))

	for sIdx, secTitle := range plan.PlannedSections {
		secStart := time.Now()
		isLast := sIdx == len(plan.PlannedSections)-1

		// Generate section content
		secPrompt := e.buildSectionPrompt(secTitle, sIdx, plan, completedSections)
		rawOutput, err := e.callSGLangCompletion(systemPrompt, conversationContext.String()+secPrompt)
		if err != nil {
			log.Printf("ℹ️ SGLang endpoint offline/fallback, rendering high-fidelity localized template: %v", err)
			rawOutput = e.generateFallbackSection(secTitle, plan, userQuery)
		}

		// Parse Code-as-Visual elements
		hasVisual, vType, vCode, cleanText := e.extractVisuals(rawOutput, plan)

		section := ScaffoldSection{
			Index:       sIdx + 1,
			Title:       secTitle,
			Content:     cleanText,
			HasVisual:   hasVisual,
			VisualType:  vType,
			VisualCode:  vCode,
			IsSocratic:  isLast && plan.ActiveTrack == TrackStandardBTech,
			TimeTakenMs: time.Since(secStart).Milliseconds(),
		}

		completedSections = append(completedSections, section)
		conversationContext.WriteString(fmt.Sprintf("### %s\n%s\n\n", secTitle, cleanText))

		if onSectionEmit != nil {
			onSectionEmit(&section)
		}
	}

	return completedSections, nil
}

func (e *ScaffoldChatEngine) buildSystemPrompt(plan *ScaffoldingPlan, profile *StudentProfile, mem *CourseMemory) string {
	var sb strings.Builder
	sb.WriteString("You are an elite, world-class engineering educator and multimodal AI architect.\n")
	sb.WriteString(fmt.Sprintf("Active Focus Track: %s | Target Concept: %s | Depth: %s\n",
		plan.ActiveTrack, plan.TargetConcept, plan.ScaffoldDepth))

	if profile != nil {
		sb.WriteString(fmt.Sprintf("Student Context: %s (Speed: %s, State: %s)\n",
			profile.StudentLevel, profile.LearningSpeed, profile.EmotionalState))
	}
	if mem != nil {
		sb.WriteString(fmt.Sprintf("Course Mapping: %s (Module: %s)\n",
			mem.CourseName, mem.ActiveLecture.Module))
	}

	sb.WriteString("\nCRITICAL PRINCIPLES FOR ARTIFACTS & COGNITIVE FLOW:\n")
	sb.WriteString("1. Zero conversational preamble. Never write meta-introductions like 'In this section' or repeat introductory greetings.\n")
	sb.WriteString("2. Every section must seamlessly link to the preceding section using transitional connective phrases.\n")
	sb.WriteString("3. Use KaTeX for ALL mathematical formulas ($...$ inline, $$...$$ display block). Never use ASCII math.\n")
	sb.WriteString("4. Output rich, clean inline vector SVGs (<svg ...) with dark-mode aesthetic (#070d1a bg, #38bdf8 signals, #34d399 inductors, #f59e0b switches) whenever a circuit or block diagram is requested.\n")
	sb.WriteString("5. Embed interactive HTML/JS slider micro-sandboxes for intuitive exploration of trade-offs.\n")

	return sb.String()
}

func (e *ScaffoldChatEngine) buildSectionPrompt(secTitle string, secIdx int, plan *ScaffoldingPlan, prevSections []ScaffoldSection) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("\nNow generate Section %d: '%s'.\n", secIdx+1, secTitle))

	if secIdx == 0 {
		sb.WriteString("Begin immediately with the foundational physical hook tailored to the student persona track.\n")
	} else {
		lastSec := prevSections[secIdx-1]
		sb.WriteString(fmt.Sprintf("Open with a natural transitional hook continuing seamlessly from '%s'.\n", lastSec.Title))
	}

	if strings.Contains(secTitle, "Schematic") || strings.Contains(secTitle, "Circuit") || strings.Contains(secTitle, "Topology") {
		sb.WriteString("Provide a comprehensive, high-contrast inline SVG vector schematic with component identifiers, polarities, and current flow loop arrows.\n")
	} else if strings.Contains(secTitle, "GATE") || strings.Contains(secTitle, "Numerical") {
		sb.WriteString("Present a representative 2-mark GATE numerical problem with exact parameter values, step-by-step substitution, and tolerance answer range.\n")
	} else if strings.Contains(secTitle, "Interview") || strings.Contains(secTitle, "Placement") {
		sb.WriteString("Provide 2 high-frequency technical interview questions from top core engineering firms (TI, Qualcomm, Apple, Tesla) with model answers.\n")
	} else if strings.Contains(secTitle, "BOM") || strings.Contains(secTitle, "Cost") || strings.Contains(secTitle, "Entrepreneurship") {
		sb.WriteString("Provide a realistic Bill of Materials (BOM) cost breakdown table and volume manufacturing scaling analysis.\n")
	} else if strings.Contains(secTitle, "Literature") || strings.Contains(secTitle, "Researcher") || strings.Contains(secTitle, "State-Space") {
		sb.WriteString("Formulate state-space non-linear averaging matrices and small-signal transfer function with IEEE Transactions rigor.\n")
	} else if strings.Contains(secTitle, "Sandbox") || strings.Contains(secTitle, "Parameter") {
		sb.WriteString("Provide an interactive parameter micro-sandbox with live sliders and dynamic output metrics.\n")
	}

	return sb.String()
}

func (e *ScaffoldChatEngine) extractVisuals(text string, plan *ScaffoldingPlan) (bool, string, string, string) {
	if strings.Contains(text, "<svg") {
		start := strings.Index(text, "<svg")
		end := strings.Index(text, "</svg>")
		if start >= 0 && end > start {
			svgCode := text[start : end+6]
			cleanText := strings.TrimSpace(text[:start] + text[end+6:])
			return true, "SVG_CIRCUIT", svgCode, cleanText
		}
	}

	if strings.Contains(text, "```mermaid") {
		start := strings.Index(text, "```mermaid")
		end := strings.Index(text[start+10:], "```")
		if start >= 0 && end > 0 {
			mCode := text[start+10 : start+10+end]
			cleanText := strings.TrimSpace(text[:start] + text[start+10+end+3:])
			return true, "MERMAID_DAG", strings.TrimSpace(mCode), cleanText
		}
	}

	if strings.Contains(text, "class=\"interactive-sandbox\"") || strings.Contains(text, "class=\"slider-box\"") {
		return true, "INTERACTIVE_SLIDER", "", text
	}

	return false, "", "", text
}

func (e *ScaffoldChatEngine) callSGLangCompletion(systemPrompt, prompt string) (string, error) {
	reqBody := map[string]interface{}{
		"model":       e.modelName,
		"messages":    []map[string]string{{"role": "system", "content": systemPrompt}, {"role": "user", "content": prompt}},
		"max_tokens":  1024,
		"temperature": 0.3,
	}

	data, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}
	resp, err := e.httpClient.Post(e.sglangURL+"/chat/completions", "application/json", bytes.NewBuffer(data))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("SGLang returned status %d: %s", resp.StatusCode, string(body))
	}

	var res struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return "", err
	}
	if len(res.Choices) == 0 {
		return "", fmt.Errorf("no completion returned from SGLang")
	}

	return res.Choices[0].Message.Content, nil
}

// GenerateCircuitSVG generates high-contrast, responsive vector circuit schematics
func GenerateCircuitSVG(concept string, track FocusTrack) string {
	cLower := strings.ToLower(concept)

	if strings.Contains(cLower, "boost") {
		return generateBoostConverterSVG(concept)
	} else if strings.Contains(cLower, "inverter") || strings.Contains(cLower, "h-bridge") {
		return generateHBridgeInverterSVG(concept)
	} else if strings.Contains(cLower, "op-amp") || strings.Contains(cLower, "amplifier") || strings.Contains(cLower, "filter") {
		return generateActiveFilterSVG(concept)
	}
	// Default to Buck Converter / DC-DC step-down
	return generateBuckConverterSVG(concept, track)
}

func generateBuckConverterSVG(concept string, track FocusTrack) string {
	badge := "Topology: Synchronous / Asynchronous Step-Down CCM"
	if track == TrackGateAspirant {
		badge = "GATE Model: CCM/DCM Boundary & State Vectors"
	} else if track == TrackPlacementPrep {
		badge = "Industrial TI / ABB High-Efficiency PoL Topology"
	}

	return fmt.Sprintf(`
<div style="background:#070d1a; border:1px solid #1e2d4a; border-radius:10px; padding:20px; text-align:center; margin:16px 0; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #1e2d4a; padding-bottom:8px;">
    <span style="color:#38bdf8; font-weight:700; font-size:13px; font-family:sans-serif;">⚡ Step-Down Buck Converter Vector Schematic (%s)</span>
    <span style="color:#94a3b8; font-size:11px; font-family:monospace; background:#0f172a; padding:2px 8px; border-radius:4px; border:1px solid #334155;">%s</span>
  </div>
  <svg width="700" height="240" viewBox="0 0 700 240" xmlns="http://www.w3.org/2000/svg" style="max-width:100%%; height:auto;">
    <defs>
      <pattern id="buckGrid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#101c30" stroke-width="0.8"/>
      </pattern>
      <marker id="arrCyan" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
      </marker>
      <marker id="arrGreen" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L0,6 L8,3 z" fill="#34d399" />
      </marker>
      <marker id="arrAmber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L0,6 L8,3 z" fill="#f59e0b" />
      </marker>
    </defs>
    
    <rect width="100%%" height="100%%" fill="url(#buckGrid)" rx="6"/>

    <!-- Conduction Loops Annotation -->
    <rect x="65" y="35" width="530" height="150" rx="10" fill="none" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="6,4" opacity="0.3"/>
    <text x="75" y="52" fill="#38bdf8" font-size="10" font-family="monospace" opacity="0.8">Loop 1: Q1 ON ($0 &lt; t \le DT_s$)</text>

    <rect x="235" y="35" width="360" height="150" rx="10" fill="none" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="4,4" opacity="0.3"/>
    <text x="245" y="175" fill="#f59e0b" font-size="10" font-family="monospace" opacity="0.8">Loop 2: D1 Freewheel ($DT_s &lt; t \le T_s$)</text>

    <!-- Source Vin -->
    <circle cx="80" cy="110" r="26" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
    <text x="80" y="106" fill="#38bdf8" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">V_in</text>
    <text x="80" y="122" fill="#64748b" font-family="sans-serif" font-size="9" text-anchor="middle">DC Supply</text>
    <text x="80" y="74" fill="#38bdf8" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">+</text>
    <text x="80" y="150" fill="#94a3b8" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">−</text>

    <!-- High-Side MOSFET Switch Q1 -->
    <line x1="106" y1="110" x2="180" y2="110" stroke="#94a3b8" stroke-width="2.5"/>
    <rect x="180" y="85" width="70" height="50" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <text x="215" y="108" fill="#38bdf8" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">Q1</text>
    <text x="215" y="124" fill="#94a3b8" font-family="sans-serif" font-size="9" text-anchor="middle">MOSFET</text>
    <line x1="215" y1="85" x2="215" y2="65" stroke="#38bdf8" stroke-width="1.5"/>
    <rect x="195" y="52" width="40" height="14" rx="3" fill="#0c1a30" stroke="#38bdf8" stroke-width="1"/>
    <text x="215" y="63" fill="#38bdf8" font-family="sans-serif" font-size="8.5" text-anchor="middle">PWM(D)</text>

    <!-- Switch Node Vx -->
    <circle cx="280" cy="110" r="4" fill="#fbbf24"/>
    <text x="280" y="96" fill="#fbbf24" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">Node V_x</text>
    <line x1="250" y1="110" x2="330" y2="110" stroke="#94a3b8" stroke-width="2.5"/>

    <!-- Freewheeling Diode D1 -->
    <line x1="280" y1="110" x2="280" y2="140" stroke="#94a3b8" stroke-width="2"/>
    <polygon points="270,160 290,160 280,140" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
    <line x1="268" y1="140" x2="292" y2="140" stroke="#f59e0b" stroke-width="2"/>
    <line x1="280" y1="160" x2="280" y2="190" stroke="#94a3b8" stroke-width="2"/>
    <text x="302" y="154" fill="#f59e0b" font-family="sans-serif" font-size="10.5" font-weight="bold">D1</text>

    <!-- Inductor L -->
    <path d="M 330,110 Q 345,85 360,110 Q 375,85 390,110 Q 405,85 420,110 Q 435,85 450,110" fill="none" stroke="#34d399" stroke-width="3"/>
    <text x="390" y="78" fill="#34d399" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">Inductor L</text>
    <line x1="365" y1="94" x2="415" y2="94" stroke="#34d399" stroke-width="1.8" marker-end="url(#arrGreen)"/>
    <text x="390" y="104" fill="#34d399" font-family="monospace" font-size="9.5" text-anchor="middle">i_L(t)</text>

    <!-- Filter Capacitor C -->
    <line x1="450" y1="110" x2="590" y2="110" stroke="#94a3b8" stroke-width="2.5"/>
    <line x1="500" y1="110" x2="500" y2="135" stroke="#94a3b8" stroke-width="2"/>
    <line x1="488" y1="135" x2="512" y2="135" stroke="#38bdf8" stroke-width="3"/>
    <line x1="488" y1="143" x2="512" y2="143" stroke="#38bdf8" stroke-width="3"/>
    <line x1="500" y1="143" x2="500" y2="190" stroke="#94a3b8" stroke-width="2"/>
    <text x="522" y="142" fill="#38bdf8" font-family="sans-serif" font-size="11" font-weight="bold">C</text>

    <!-- Load Resistor R_L -->
    <line x1="580" y1="110" x2="580" y2="130" stroke="#94a3b8" stroke-width="2"/>
    <rect x="570" y="130" width="20" height="35" rx="3" fill="#1e293b" stroke="#f43f5e" stroke-width="2"/>
    <text x="580" y="152" fill="#f43f5e" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">R_L</text>
    <line x1="580" y1="165" x2="580" y2="190" stroke="#94a3b8" stroke-width="2"/>
    <text x="612" y="152" fill="#f43f5e" font-family="sans-serif" font-size="12" font-weight="bold">V_o</text>

    <!-- Ground Rail -->
    <line x1="80" y1="136" x2="80" y2="190" stroke="#94a3b8" stroke-width="2.5"/>
    <line x1="80" y1="190" x2="580" y2="190" stroke="#94a3b8" stroke-width="2.5"/>

    <!-- Ground Symbol -->
    <line x1="280" y1="190" x2="280" y2="204" stroke="#94a3b8" stroke-width="2"/>
    <line x1="268" y1="204" x2="292" y2="204" stroke="#94a3b8" stroke-width="2"/>
    <line x1="272" y1="209" x2="288" y2="209" stroke="#94a3b8" stroke-width="1.5"/>
    <line x1="277" y1="214" x2="283" y2="214" stroke="#94a3b8" stroke-width="1"/>
    <text x="280" y="226" fill="#64748b" font-family="sans-serif" font-size="8.5" text-anchor="middle">GND</text>
  </svg>
</div>`, concept, badge)
}

func generateBoostConverterSVG(concept string) string {
	return fmt.Sprintf(`
<div style="background:#070d1a; border:1px solid #1e2d4a; border-radius:10px; padding:20px; text-align:center; margin:16px 0;">
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #1e2d4a; padding-bottom:8px;">
    <span style="color:#38bdf8; font-weight:700; font-size:13px; font-family:sans-serif;">⚡ Step-Up Boost Converter Vector Schematic (%s)</span>
    <span style="color:#94a3b8; font-size:11px; font-family:monospace; background:#0f172a; padding:2px 8px; border-radius:4px;">$V_o = \frac{V_{in}}{1 - D}$</span>
  </div>
  <svg width="700" height="220" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg" style="max-width:100%%; height:auto;">
    <!-- Vin -> Inductor L -> Switch Q1 to GND -> Diode D1 -> C || R_L -->
    <circle cx="80" cy="110" r="26" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
    <text x="80" y="115" fill="#38bdf8" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">V_in</text>
    <line x1="106" y1="110" x2="160" y2="110" stroke="#94a3b8" stroke-width="2.5"/>
    <path d="M 160,110 Q 175,85 190,110 Q 205,85 220,110 Q 235,85 250,110 Q 265,85 280,110" fill="none" stroke="#34d399" stroke-width="3"/>
    <text x="220" y="78" fill="#34d399" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">Inductor L</text>
    <line x1="280" y1="110" x2="350" y2="110" stroke="#94a3b8" stroke-width="2.5"/>
    <!-- Switch to Ground -->
    <rect x="330" y="110" width="40" height="40" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <text x="350" y="135" fill="#38bdf8" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">Q1</text>
    <line x1="350" y1="150" x2="350" y2="180" stroke="#94a3b8" stroke-width="2"/>
    <!-- Series Diode D1 -->
    <line x1="350" y1="110" x2="430" y2="110" stroke="#94a3b8" stroke-width="2"/>
    <polygon points="430,100 430,120 450,110" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
    <line x1="450" y1="100" x2="450" y2="120" stroke="#f59e0b" stroke-width="2"/>
    <text x="440" y="90" fill="#f59e0b" font-family="sans-serif" font-size="11" font-weight="bold">D1</text>
    <line x1="450" y1="110" x2="580" y2="110" stroke="#94a3b8" stroke-width="2.5"/>
    <!-- C and R_L -->
    <line x1="510" y1="110" x2="510" y2="135" stroke="#94a3b8" stroke-width="2"/>
    <line x1="498" y1="135" x2="522" y2="135" stroke="#38bdf8" stroke-width="3"/>
    <line x1="498" y1="143" x2="522" y2="143" stroke="#38bdf8" stroke-width="3"/>
    <line x1="510" y1="143" x2="510" y2="180" stroke="#94a3b8" stroke-width="2"/>
    <text x="532" y="142" fill="#38bdf8" font-family="sans-serif" font-size="11" font-weight="bold">C</text>
    <rect x="570" y="130" width="20" height="35" rx="3" fill="#1e293b" stroke="#f43f5e" stroke-width="2"/>
    <text x="580" y="152" fill="#f43f5e" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">R_L</text>
    <line x1="580" y1="165" x2="580" y2="180" stroke="#94a3b8" stroke-width="2"/>
    <!-- GND Rail -->
    <line x1="80" y1="136" x2="80" y2="180" stroke="#94a3b8" stroke-width="2.5"/>
    <line x1="80" y1="180" x2="580" y2="180" stroke="#94a3b8" stroke-width="2.5"/>
  </svg>
</div>`, concept)
}

func generateHBridgeInverterSVG(concept string) string {
	return fmt.Sprintf(`
<div style="background:#070d1a; border:1px solid #1e2d4a; border-radius:10px; padding:20px; text-align:center; margin:16px 0;">
  <div style="color:#38bdf8; font-weight:700; font-size:13px; margin-bottom:8px;">⚡ Full-Bridge (H-Bridge) DC-AC Inverter Topology (%s)</div>
  <svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg" style="max-width:100%%;">
    <rect x="150" y="30" width="60" height="35" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <text x="180" y="52" fill="#38bdf8" font-family="sans-serif" font-size="11" text-anchor="middle">Q1</text>
    <rect x="390" y="30" width="60" height="35" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <text x="420" y="52" fill="#38bdf8" font-family="sans-serif" font-size="11" text-anchor="middle">Q3</text>
    <rect x="150" y="130" width="60" height="35" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <text x="180" y="152" fill="#38bdf8" font-family="sans-serif" font-size="11" text-anchor="middle">Q2</text>
    <rect x="390" y="130" width="60" height="35" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <text x="420" y="152" fill="#38bdf8" font-family="sans-serif" font-size="11" text-anchor="middle">Q4</text>
    <!-- Load between Midpoints -->
    <line x1="180" y1="97" x2="260" y2="97" stroke="#34d399" stroke-width="2.5"/>
    <rect x="260" y="82" width="80" height="30" rx="4" fill="#0f172a" stroke="#34d399" stroke-width="2"/>
    <text x="300" y="102" fill="#34d399" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">AC Load Z_L</text>
    <line x1="340" y1="97" x2="420" y2="97" stroke="#34d399" stroke-width="2.5"/>
  </svg>
</div>`, concept)
}

func generateActiveFilterSVG(concept string) string {
	return fmt.Sprintf(`
<div style="background:#070d1a; border:1px solid #1e2d4a; border-radius:10px; padding:20px; text-align:center; margin:16px 0;">
  <div style="color:#38bdf8; font-weight:700; font-size:13px; margin-bottom:8px;">📐 Active Operational Amplifier Filter Circuit (%s)</div>
  <svg width="600" height="180" viewBox="0 0 600 180" xmlns="http://www.w3.org/2000/svg" style="max-width:100%%;">
    <!-- Triangle Op-Amp -->
    <polygon points="280,50 280,130 360,90" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <text x="295" y="75" fill="#f43f5e" font-size="14" font-weight="bold">−</text>
    <text x="295" y="115" fill="#38bdf8" font-size="14" font-weight="bold">+</text>
    <line x1="200" y1="70" x2="280" y2="70" stroke="#94a3b8" stroke-width="2"/>
    <rect x="220" y="60" width="35" height="20" rx="2" fill="#0f172a" stroke="#d4a853" stroke-width="1.5"/>
    <text x="237" y="74" fill="#d4a853" font-size="10" text-anchor="middle">R1</text>
    <line x1="360" y1="90" x2="450" y2="90" stroke="#38bdf8" stroke-width="2"/>
    <text x="460" y="94" fill="#38bdf8" font-size="12" font-weight="bold">V_out</text>
  </svg>
</div>`, concept)
}

// GenerateInteractiveSliderMicroSandbox creates an embedded HTML/JS interactive simulation widget
func GenerateInteractiveSliderMicroSandbox(concept string, track FocusTrack) string {
	return `
<div class="interactive-sandbox" style="background:#0a1020; border:1px solid #1e2d4a; border-radius:10px; padding:20px; margin:16px 0; font-family:var(--font-sans, system-ui);">
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
    <span style="color:#38bdf8; font-weight:700; font-size:1rem;">⚡ Live Parameter Micro-Sandbox & Dynamic Waveform Analyzer</span>
    <span id="ccmBadge" style="background:#065f46; color:#34d399; font-size:0.75rem; font-weight:700; padding:3px 10px; border-radius:20px; border:1px solid #059669;">MODE: CONTINUOUS (CCM)</span>
  </div>

  <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:14px; margin-bottom:16px;">
    <div style="background:#0f172a; padding:12px; border-radius:8px; border:1px solid #1e293b;">
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#cbd5e1;">
        <span>Duty Ratio ($D$):</span>
        <strong id="dVal" style="color:#38bdf8;">0.40 (40%)</strong>
      </div>
      <input id="sliderD" type="range" min="0.05" max="0.95" step="0.01" value="0.40" style="width:100%; margin-top:8px; accent-color:#38bdf8;" oninput="updateSim()">
    </div>

    <div style="background:#0f172a; padding:12px; border-radius:8px; border:1px solid #1e293b;">
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#cbd5e1;">
        <span>Input Voltage ($V_{in}$):</span>
        <strong id="vinVal" style="color:#fbbf24;">48.0 V</strong>
      </div>
      <input id="sliderVin" type="range" min="12" max="100" step="1" value="48" style="width:100%; margin-top:8px; accent-color:#fbbf24;" oninput="updateSim()">
    </div>

    <div style="background:#0f172a; padding:12px; border-radius:8px; border:1px solid #1e293b;">
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#cbd5e1;">
        <span>Switching Frequency ($f_s$):</span>
        <strong id="fsVal" style="color:#34d399;">50 kHz</strong>
      </div>
      <input id="sliderFs" type="range" min="10" max="250" step="5" value="50" style="width:100%; margin-top:8px; accent-color:#34d399;" oninput="updateSim()">
    </div>

    <div style="background:#0f172a; padding:12px; border-radius:8px; border:1px solid #1e293b;">
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#cbd5e1;">
        <span>Inductance ($L$):</span>
        <strong id="lVal" style="color:#a78bfa;">200 µH</strong>
      </div>
      <input id="sliderL" type="range" min="20" max="1000" step="10" value="200" style="width:100%; margin-top:8px; accent-color:#a78bfa;" oninput="updateSim()">
    </div>
  </div>

  <!-- Real-time Computed Metrics -->
  <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:10px; background:#070d1a; padding:12px; border-radius:8px; border:1px solid #1e2d4a; text-align:center; font-family:monospace; margin-bottom:12px;">
    <div><span style="color:#94a3b8; font-size:0.75rem;">Output Voltage $V_o$</span><br><strong id="voOut" style="color:#38bdf8; font-size:1.1rem;">19.20 V</strong></div>
    <div><span style="color:#94a3b8; font-size:0.75rem;">Peak Ripple $\Delta I_L$</span><br><strong id="dilOut" style="color:#34d399; font-size:1.1rem;">1.15 A</strong></div>
    <div><span style="color:#94a3b8; font-size:0.75rem;">$L_{crit}$ Boundary</span><br><strong id="lcritOut" style="color:#fbbf24; font-size:1.1rem;">60.0 µH</strong></div>
    <div><span style="color:#94a3b8; font-size:0.75rem;">Theoretical Eff. $\eta$</span><br><strong id="effOut" style="color:#34d399; font-size:1.1rem;">95.4 %</strong></div>
  </div>

  <script>
    function updateSim() {
      const d = parseFloat(document.getElementById('sliderD') ? document.getElementById('sliderD').value : 0.40);
      const vin = parseFloat(document.getElementById('sliderVin') ? document.getElementById('sliderVin').value : 48);
      const fs = parseFloat(document.getElementById('sliderFs') ? document.getElementById('sliderFs').value : 50) * 1000;
      const l = parseFloat(document.getElementById('sliderL') ? document.getElementById('sliderL').value : 200) * 1e-6;
      const rLoad = 10.0;

      const vo = d * vin;
      const dil = (vin * d * (1.0 - d)) / (l * fs);
      const lcrit = ((1.0 - d) * rLoad) / (2.0 * fs);
      const isCCM = l >= lcrit;

      if (document.getElementById('dVal')) document.getElementById('dVal').innerText = d.toFixed(2) + ' (' + Math.round(d*100) + '%)';
      if (document.getElementById('vinVal')) document.getElementById('vinVal').innerText = vin.toFixed(1) + ' V';
      if (document.getElementById('fsVal')) document.getElementById('fsVal').innerText = (fs/1000).toFixed(0) + ' kHz';
      if (document.getElementById('lVal')) document.getElementById('lVal').innerText = (l*1e6).toFixed(0) + ' µH';
      if (document.getElementById('voOut')) document.getElementById('voOut').innerText = vo.toFixed(2) + ' V';
      if (document.getElementById('dilOut')) document.getElementById('dilOut').innerText = dil.toFixed(2) + ' A';
      if (document.getElementById('lcritOut')) document.getElementById('lcritOut').innerText = (lcrit*1e6).toFixed(1) + ' µH';

      const badge = document.getElementById('ccmBadge');
      if (badge) {
        if (isCCM) {
          badge.innerText = 'MODE: CONTINUOUS (CCM)';
          badge.style.background = '#065f46';
          badge.style.color = '#34d399';
          badge.style.borderColor = '#059669';
        } else {
          badge.innerText = '⚠️ MODE: DISCONTINUOUS (DCM)';
          badge.style.background = '#831843';
          badge.style.color = '#f43f5e';
          badge.style.borderColor = '#be123c';
        }
      }
    }
  </script>
</div>`
}

// GenerateWaveformPlotSVG creates clean Matplotlib-style vector SVG waveforms
func GenerateWaveformPlotSVG(concept string, duty float64) string {
	if duty <= 0 || duty >= 1.0 {
		duty = 0.40
	}
	dtPixels := int(duty * 160.0)

	return fmt.Sprintf(`
<div style="background:#070d1a; border:1px solid #1e2d4a; border-radius:10px; padding:16px; text-align:center; margin:16px 0;">
  <div style="color:#38bdf8; font-weight:700; font-size:12px; margin-bottom:6px; font-family:sans-serif;">📊 Steady-State Inductor Current & Voltage Waveforms ($D=%.2f$)</div>
  <svg width="640" height="180" viewBox="0 0 640 180" xmlns="http://www.w3.org/2000/svg" style="max-width:100%%;">
    <!-- Axes -->
    <line x1="40" y1="100" x2="600" y2="100" stroke="#334155" stroke-width="1.5"/>
    <line x1="40" y1="20" x2="40" y2="160" stroke="#334155" stroke-width="1.5"/>
    <text x="610" y="104" fill="#94a3b8" font-size="10" font-family="sans-serif">Time t</text>

    <!-- Period 1: 0 to 160 px -->
    <path d="M 40,80 L %d,30 L 200,80 L %d,30 L 360,80 L %d,30 L 520,80" fill="none" stroke="#34d399" stroke-width="2.5"/>
    <text x="120" y="24" fill="#34d399" font-size="11" font-weight="bold" font-family="monospace">i_L(t) Ramp</text>

    <!-- Markers -->
    <line x1="%d" y1="25" x2="%d" y2="140" stroke="#38bdf8" stroke-width="1" stroke-dasharray="3,3"/>
    <text x="%d" y="152" fill="#38bdf8" font-size="9" text-anchor="middle" font-family="monospace">DT_s</text>

    <line x1="200" y1="25" x2="200" y2="140" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3,3"/>
    <text x="200" y="152" fill="#94a3b8" font-size="9" text-anchor="middle" font-family="monospace">T_s</text>

    <!-- Annotations -->
    <text x="25" y="34" fill="#34d399" font-size="10" text-anchor="end" font-family="monospace">I_max</text>
    <text x="25" y="84" fill="#34d399" font-size="10" text-anchor="end" font-family="monospace">I_min</text>
  </svg>
</div>`, duty, 40+dtPixels, 200+dtPixels, 360+dtPixels, 40+dtPixels, 40+dtPixels, 40+dtPixels)
}

func (e *ScaffoldChatEngine) generateFallbackSection(title string, plan *ScaffoldingPlan, query string) string {
	concept := plan.TargetConcept
	if concept == "" {
		concept = "DC-DC Buck Converter"
	}

	switch plan.ActiveTrack {
	case TrackGateAspirant:
		if strings.Contains(title, "Operating Modes") || strings.Contains(title, "Boundary") {
			return "In continuous conduction mode (CCM), the inductor current $i_L(t)$ remains strictly positive throughout the entire switching cycle $T_s$. The critical boundary condition separating CCM and Discontinuous Conduction Mode (DCM) occurs when the minimum inductor valley current reaches zero ($I_{L,min} = 0$).\n\nAt this boundary:\n$$ I_o = \\frac{1}{2} \\Delta I_L = \\frac{V_{in} D (1 - D) T_s}{2 L} $$\n\nSolving for the dimensionless conduction parameter $K = \\frac{2L}{R_L T_s}$, CCM is strictly maintained if and only if $K > K_{crit} = 1 - D$."
		} else if strings.Contains(title, "Governing") || strings.Contains(title, "Formulations") {
			return "Applying the fundamental Volt-Second balance across the inductor in periodic steady state:\n$$ \\langle v_L \\rangle = \\frac{1}{T_s} \\int_0^{T_s} v_L(t) dt = D (V_{in} - V_o) + (1 - D)(-V_o) = 0 \\implies V_o = D \\cdot V_{in} $$\n\nTo ensure CCM operation for a given minimum load resistance $R_L$ and switching frequency $f_s$, the critical inductance is derived as:\n$$ L_{crit} = \\frac{(1 - D) R_L}{2 f_s} $$\n\nThe corresponding output voltage ripple due to filter capacitance $C$ is:\n$$ \\Delta V_o = \\frac{\\Delta I_L}{8 f_s C} = \\frac{V_{in} D (1 - D)}{8 L C f_s^2} $$"
		} else if strings.Contains(title, "Schematic") || strings.Contains(title, "Ripple") {
			return fmt.Sprintf("Observe the high-contrast state vector schematic and current ripple geometry:\n\n%s\n\n%s",
				GenerateCircuitSVG(concept, plan.ActiveTrack),
				GenerateWaveformPlotSVG(concept, 0.40))
		} else if strings.Contains(title, "GATE") || strings.Contains(title, "Numerical") {
			return "**🎯 GATE Previous Year Examination Problem (2 Marks, NAT):**\n\n*Problem Statement:*\nA step-down DC-DC buck converter is supplied from an ideal $V_{in} = 100\\text{ V}$ DC source and delivers $P_o = 50\\text{ W}$ at a regulated output voltage $V_o = 40\\text{ V}$. The switching frequency is $f_s = 25\\text{ kHz}$. Assuming ideal lossless components, calculate the minimum critical inductance $L_{crit}$ (in $\\mu\\text{H}$) required to maintain continuous conduction mode.\n\n*Step-by-Step Analytical Solution:*\n1. **Duty Ratio Determination:**\n   $$ D = \\frac{V_o}{V_{in}} = \\frac{40}{100} = 0.40 $$\n2. **Effective Load Resistance:**\n   $$ R_L = \\frac{V_o^2}{P_o} = \\frac{40^2}{50} = \\frac{1600}{50} = 32\\ \\Omega $$\n3. **Critical Inductance Evaluation:**\n   $$ L_{crit} = \\frac{(1 - D) R_L}{2 f_s} = \\frac{(1 - 0.40) \\times 32}{2 \\times 25000} = \\frac{0.60 \\times 32}{50000} = \\frac{19.2}{50000} = 384\\ \\mu\\text{H} $$\n\n**GATE Correct Answer Range:** $[380\\text{ to }388\\ \\mu\\text{H}]$. $\\blacksquare$"
		} else if strings.Contains(title, "Traps") || strings.Contains(title, "Shortcuts") {
			return "**⚡ GATE Exam Boundary Traps & Rapid Elimination Rules:**\n\n1. **The DCM Voltage Escalation Trap:** In DCM ($L < L_{crit}$), the standard formula $V_o = D V_{in}$ no longer applies! $V_o$ rises and becomes load-dependent: $\\frac{V_o}{V_{in}} = \\frac{2}{1 + \\sqrt{1 + 4K/D^2}}$. Under no-load ($R_L \\to \\infty$), $V_o \\to V_{in}$.\n2. **Maximum Inductor Ripple Condition:** $\\Delta I_L$ is maximized at $D = 0.50$ (where $D(1-D) = 0.25$). Always design inductor core saturation for the $D = 0.5$ boundary condition.\n3. **Capacitor ESR Dominated Ripple:** In practical electrolytic capacitors, the ESR ripple $\\Delta V_{o,ESR} = \\Delta I_L \\cdot R_{ESR}$ typically exceeds the capacitive charging ripple by an order of magnitude."
		}

	case TrackPlacementPrep:
		if strings.Contains(title, "Industrial") || strings.Contains(title, "Architecture") {
			return "In tier-1 power hardware systems (e.g. 48V-to-12V server Point-of-Load modules at Google/Meta data centers, automotive ECUs at Tesla, or power ICs at Texas Instruments), high efficiency (>94%) and sub-millisecond dynamic transient response (<3% voltage droop under 10A/µs load step) govern architecture selection.\n\nAt high output currents ($I_o > 20\\text{A}$), multi-phase interleaved buck topologies are preferred over single-phase designs to divide current thermal stress and multiply the effective ripple frequency by phase count $N$."
		} else if strings.Contains(title, "Component") || strings.Contains(title, "Datasheet") {
			return "**Key Component Selection & Datasheet Trade-Offs:**\n\n- **High-Side MOSFET ($Q_1$):** Dominated by switching losses $P_{sw} = \\frac{1}{2} V_{in} I_o (t_r + t_f) f_s$. Select silicon with low Gate Charge ($Q_g < 15\\text{ nC}$) and low gate-drain capacitance $C_{gd}$ to prevent Miller plateau delay.\n- **Low-Side Synchronous MOSFET ($Q_2$):** Conducts for $(1-D)T_s$; dominated by conduction losses $P_{cond} = I_{rms}^2 R_{DS(on)}$. Prioritize ultra-low $R_{DS(on)} < 2\\text{ m}\\Omega$.\n- **Power Inductor ($L$):** Select shielded composite metal-dust cores with saturation current $I_{sat} > I_{peak} = I_o + \\frac{\\Delta I_L}{2}$ at $105^\\circ\\text{C}$ to prevent core drop under transient overloads."
		} else if strings.Contains(title, "Vector") || strings.Contains(title, "Hot-Loop") {
			return fmt.Sprintf("Observe the industrial synchronous vector layout and power hot-loop paths:\n\n%s\n\n%s",
				GenerateCircuitSVG(concept, plan.ActiveTrack),
				GenerateInteractiveSliderMicroSandbox(concept, plan.ActiveTrack))
		} else if strings.Contains(title, "Hardware") || strings.Contains(title, "Debugging") {
			return "**Hardware Debugging Case Study: Switch-Node Ringing & EMI Damping**\n\n*Observation:* Oscilloscope probe at the switch node $V_x$ exhibits high-frequency ringing ($f_{ring} \\approx 180\\text{ MHz}$) exceeding $1.4\\times V_{in}$, risking MOSFET avalanche breakdown and violating CISPR 32 radiated EMI limits.\n\n*Root Cause Analysis:* Parasitic inductance of the PCB loop ($L_{loop} \\approx 3\\text{ nH}$) resonating with MOSFET output capacitance ($C_{oss} \\approx 250\\text{ pF}$).\n\n*Optimal Mitigation:* Implement a compact RC snubber directly across the low-side switch:\n$$ C_{snub} \\approx 3 \\times C_{oss} = 750\\text{ pF}, \\quad R_{snub} = \\sqrt{\\frac{L_{loop}}{C_{oss}}} = \\sqrt{\\frac{3\\times 10^{-9}}{250\\times 10^{-12}}} \\approx 3.46\\ \\Omega $$"
		} else if strings.Contains(title, "Interview") || strings.Contains(title, "Tier-1") {
			return "**Top Core Hardware Interview Questions (Texas Instruments / Qualcomm / Tesla):**\n\n**Q1: Why do synchronous buck converters employ dead-time, and what are the consequences of improper dead-time?**\n*Model Answer:* Dead-time (typically $15\\text{–}30\\text{ ns}$) ensures both high-side and low-side MOSFETs are never ON simultaneously, preventing catastrophic supply shoot-through. However, excessive dead-time forces inductor current through the parasitic body diode of the low-side FET, causing high forward conduction drop ($0.7\\text{V}$) and reverse recovery loss $Q_{rr}$, degrading efficiency by $2\\text{–}4\\%$.\n\n**Q2: What is the physical cause of subharmonic oscillation in Peak Current-Mode control when $D > 0.5$, and how is it compensated?**\n*Model Answer:* In peak current mode control with $D > 0.5$, any inductor current perturbation $\\Delta i_0$ magnifies by factor $-\\frac{D}{1-D} < -1$ each cycle, leading to period-doubling instability. It is resolved by adding an artificial stabilizing ramp (slope compensation $S_e \\ge \\frac{1}{2} S_n$, where $S_n$ is the inductor down-slope)."
		}

	case TrackEntrepreneurship:
		if strings.Contains(title, "Product") || strings.Contains(title, "Proposition") {
			return "**Product Proposition & Commercial Positioning:**\nA compact, high-efficiency (>95%) Point-of-Load (PoL) DC-DC power converter module engineered for commercial drone power distribution boards (PDB), robotics actuators, and industrial IoT edge gateways requiring wide input range ($18\\text{V} - 60\\text{V}$) and tight thermal packaging ($<20\\times 20\\text{ mm}$)."
		} else if strings.Contains(title, "BOM") || strings.Contains(title, "Cost") {
			return "**Bill of Materials (BOM) Cost Breakdown & Volume Scaling (USD):**\n\n| Subsystem Component | Part Reference | Unit Cost (1k Volume) | Unit Cost (100k Volume) | Source Vendor |\n| :--- | :--- | :--- | :--- | :--- |\n| PWM Sync Controller IC | TPS54302 / LM5164 | $0.58 | $0.29 | Texas Instruments |\n| Shielded Power Inductor | Coilcraft XAL5030 10µH | $0.45 | $0.22 | Coilcraft / Wurth |\n| Dual N-Ch Power MOSFETs | CSD87330Q3D | $0.38 | $0.18 | TI / Infineon |\n| MLCC Filter Capacitors | 1210 X7R 47µF (x4) | $0.28 | $0.12 | Murata / TDK |\n| 4-Layer FR4 PCB & SMD Assembly | 1 oz Cu, ENIG finish | $0.55 | $0.24 | JLCPCB / USI |\n| **Total Estimated Unit Cost** | **Finished Module** | **$2.24** | **$1.05** | **Target Retail: $4.99** |\n\n*Gross Margin Modeling:* At $1.05 unit manufacturing cost and $4.99 selling price, gross margin is **$78.9\\%$**, providing strong venture unit economics."
		} else if strings.Contains(title, "Architecture") || strings.Contains(title, "Density") {
			return fmt.Sprintf("Observe the modular system schematic and dynamic parametric sandbox:\n\n%s\n\n%s",
				GenerateCircuitSVG(concept, plan.ActiveTrack),
				GenerateInteractiveSliderMicroSandbox(concept, plan.ActiveTrack))
		} else if strings.Contains(title, "Standards") || strings.Contains(title, "Regulatory") {
			return "**Regulatory Certification & Industrial Standards Roadmap:**\n\n1. **Electromagnetic Compatibility (EMC):** Compliance with **CISPR 32 / EN 55032 Class B** (residential conducted and radiated limits). Requires 2-stage input Pi filter ($C_{in} - L_{bead} - C_{in}$) to attenuate switching harmonics.\n2. **Product Safety:** **IEC/EN 62368-1** Audio/Video, Information and Communication Technology equipment safety standard.\n3. **Environmental Compliance:** **RoHS 3 (EU 2015/863)** lead-free solder paste and **REACH** SVHC certification."
		} else if strings.Contains(title, "Feasibility") || strings.Contains(title, "Market") {
			return "**Techno-Economic Feasibility & Market Sizing (TAM/SAM/SOM):**\n\n- **Total Addressable Market (TAM):** Global DC-DC Converter Market is projected to reach **$8.4B by 2030** (CAGR 8.7%), fueled by industrial automation, EV battery management systems, and satellite avionics.\n- **Serviceable Addressable Market (SAM):** High-density industrial PoL modules: **$1.8B**.\n- **Serviceable Obtainable Market (SOM):** Drone & robotics hardware startup ecosystem: **$42M in Year 3**."
		}

	case TrackResearcher:
		if strings.Contains(title, "Literature") || strings.Contains(title, "IEEE") {
			return "Contemporary research in power electronics (IEEE Transactions on Power Electronics 2024–2026, IEEE JESTPE) focuses on monolithic Gallium Nitride (GaN) and Silicon Carbide (SiC) wide-bandgap topologies operating at multi-megahertz frequencies ($f_s > 3\\text{ MHz}$), allowing planar embedded magnetics to surpass $1000\\text{ W/in}^3$ volumetric power density.\n\nKey research frontiers center on active gate driving to suppress $dv/dt$ induced Miller turn-on and dynamic non-linear state-space control."
		} else if strings.Contains(title, "Mathematical") || strings.Contains(title, "State-Space") {
			return "Let the continuous state vector be $\\mathbf{x}(t) = [i_L(t), v_o(t)]^T \\in \\mathbb{R}^2$ and input vector $\\mathbf{u}(t) = [v_{in}(t)]$. Under state-space averaging:\n\n$$ \\mathbf{\\dot{x}}(t) = \\mathbf{A}_{avg} \\mathbf{x}(t) + \\mathbf{B}_{avg} \\mathbf{u}(t) $$\n\nWhere the averaged transition and input matrices evaluate to:\n$$ \\mathbf{A}_{avg} = \\begin{bmatrix} 0 & -\\frac{1}{L} \\\\ \\frac{1}{C} & -\\frac{1}{R_L C} \\end{bmatrix}, \\quad \\mathbf{B}_{avg} = \\begin{bmatrix} \\frac{D}{L} \\\\ 0 \\end{bmatrix} $$\n\nLinearizing with small-signal perturbations $\\mathbf{x} = \\mathbf{X} + \\mathbf{\\tilde{x}}$, $d = D + \\tilde{d}$ yields the control-to-output transfer function:\n$$ G_{vd}(s) = \\frac{\\tilde{v}_o(s)}{\\tilde{d}(s)} = \\frac{V_{in}}{1 + s \\frac{L}{R_L} + s^2 L C} = \\frac{V_{in} \\omega_o^2}{s^2 + 2 \\zeta \\omega_o s + \\omega_o^2} $$\nWhere resonant natural frequency $\\omega_o = \\frac{1}{\\sqrt{LC}}$ and damping factor $\\zeta = \\frac{1}{2 R_L} \\sqrt{\\frac{L}{C}}$."
		} else if strings.Contains(title, "Vector") || strings.Contains(title, "Topology") {
			return fmt.Sprintf("Observe the small-signal high-frequency state vector representation:\n\n%s\n\n%s",
				GenerateCircuitSVG(concept, plan.ActiveTrack),
				GenerateWaveformPlotSVG(concept, 0.40))
		} else if strings.Contains(title, "Lyapunov") || strings.Contains(title, "Stability") {
			return "**Lyapunov Stability & Sliding Mode Orbital Convergence:**\n\nDefine the dynamic sliding manifold $S(\\mathbf{x}) = (i_L - I_{ref}) + k_v (v_o - V_{ref}) = 0$. Choose the positive-definite Lyapunov candidate function:\n$$ V(\\mathbf{x}) = \\frac{1}{2} S(\\mathbf{x})^2 > 0 \\quad \\forall S \\ne 0 $$\n\nTaking the time derivative along system trajectories yields:\n$$ \\dot{V}(\\mathbf{x}) = S(\\mathbf{x}) \\dot{S}(\\mathbf{x}) = S(\\mathbf{x}) \\left[ \\frac{v_{in} u(t) - v_o}{L} + k_v \\left( \\frac{i_L - v_o / R_L}{C} \\right) \\right] $$\n\nSelecting control law $u(t) = \\frac{1}{2}(1 - \\text{sgn}(S(\\mathbf{x})))$ guarantees $\\dot{V} < -\\alpha |S| < 0$, proving global finite-time reachability and asymptotic orbital stability."
		} else if strings.Contains(title, "Open") || strings.Contains(title, "Challenges") {
			return "**Open Research Frontiers & High-Frequency Investigation Opportunities:**\n\n1. **Integrated Planar PCB Magnetics:** Zero-Voltage Switching (ZVS) resonant topologies utilizing PCB trace spiral windings with embedded ferrite polymer composites.\n2. **AI-Driven Auto-Tuning Digital Controllers:** Reinforcement-learning algorithms embedded on FPGA/DSP silicon to adaptively update compensation zeros in real-time under non-linear capacitor derating."
		}

	default: // TrackStandardBTech
		if strings.Contains(title, "Physical") || strings.Contains(title, "Intuitive") {
			return fmt.Sprintf("In electrical power engineering, the **%s** is the foundational step-down DC-DC switching regulator. When stepping down a DC voltage (e.g. converting $48\\text{V}$ from a battery down to $12\\text{V}$ or $3.3\\text{V}$ for microcontrollers), a linear voltage divider dissipates all excess voltage as heat, achieving a dismal efficiency $\\eta = V_o / V_{in} = 25\\%%$.\n\nThe buck converter achieves $>90\\%%$ efficiency by employing high-speed PWM switching across reactive energy-storage elements (inductor $L$ and capacitor $C$) that buffer and smooth energy with minimal thermal dissipation.", concept)
		} else if strings.Contains(title, "Schematic") || strings.Contains(title, "Loops") {
			return fmt.Sprintf("To visualize the physical operation, examine the high-contrast vector circuit schematic below:\n\n%s",
				GenerateCircuitSVG(concept, plan.ActiveTrack))
		} else if strings.Contains(title, "Derivation") || strings.Contains(title, "Volt-Second") {
			return "Let us establish the exact governing equations from Faraday's Law over one complete switching cycle $T_s$:\n\n- **Interval 1: Switch $Q_1$ is ON ($0 < t \\le D T_s$):** Diode $D_1$ is reverse-biased. The inductor voltage is $v_L(t) = V_{in} - V_o$. Inductor current ramps up linearly:\n  $$ \\frac{di_L}{dt} = \\frac{V_{in} - V_o}{L} $$\n- **Interval 2: Switch $Q_1$ is OFF ($D T_s < t \\le T_s$):** Inductor current freewheels through diode $D_1$. The inductor voltage is $v_L(t) = -V_o$. Current ramps down linearly:\n  $$ \\frac{di_L}{dt} = -\\frac{V_o}{L} $$\n\nUnder periodic steady-state equilibrium, the net Volt-Second integral over period $T_s$ must strictly equal zero:\n$$ \\int_0^{T_s} v_L(t) dt = (V_{in} - V_o) D T_s + (-V_o) (1 - D) T_s = 0 \\implies V_o = D \\cdot V_{in} $$\n\nApplying Ampere-Second charge balance on filter capacitor $C$, the peak-to-peak output voltage ripple evaluates to:\n$$ \\Delta V_o = \\frac{\\Delta I_L}{8 f_s C} = \\frac{V_{in} D (1 - D)}{8 L C f_s^2} $$"
		} else if strings.Contains(title, "Sandbox") || strings.Contains(title, "Waveform") {
			return fmt.Sprintf("Interact with the live parameter micro-sandbox and dynamic waveforms below:\n\n%s\n\n%s",
				GenerateInteractiveSliderMicroSandbox(concept, plan.ActiveTrack),
				GenerateWaveformPlotSVG(concept, 0.40))
		} else if strings.Contains(title, "Checkpoint") || strings.Contains(title, "Socratic") {
			return "**🧠 Socratic Conceptual Checkpoint:**\n\n*Question:* If the input voltage is $V_{in} = 24\\text{ V}$ and you need a regulated output $V_o = 6\\text{ V}$ delivering $2\\text{ A}$ to load $R_L = 3\\ \\Omega$, what is the required duty ratio $D$ and what happens to $V_o$ if the switching frequency $f_s$ is doubled while keeping $D$ constant?\n\n*Diagnostic Analysis:*\n- The required duty ratio is $D = V_o / V_{in} = 6 / 24 = 0.25$ (or $25\\%$).\n- Doubling switching frequency $f_s$ does **not** change the average output voltage $V_o = D V_{in} = 6\\text{ V}$, but it cuts the inductor current ripple $\\Delta I_L$ and capacitor voltage ripple $\\Delta V_o$ in half, enabling smaller physical magnetics!"
		}
	}

	return fmt.Sprintf("Applying first-principles conservation laws to **%s** directly determines system stability and energy transfer efficiency.", concept)
}

func extractTargetConcept(query string) string {
	q := strings.TrimSpace(query)
	q = regexp.MustCompile(`[?!.]`).ReplaceAllString(q, "")
	lower := strings.ToLower(q)
	if strings.HasPrefix(lower, "explain ") {
		return strings.TrimSpace(q[8:])
	}
	if strings.HasPrefix(lower, "what is ") {
		return strings.TrimSpace(q[8:])
	}
	if strings.HasPrefix(lower, "how does ") {
		return strings.TrimSpace(q[9:])
	}
	if strings.HasPrefix(lower, "derive ") {
		return strings.TrimSpace(q[7:])
	}
	if strings.HasPrefix(lower, "calculate ") {
		return strings.TrimSpace(q[10:])
	}
	return q
}
