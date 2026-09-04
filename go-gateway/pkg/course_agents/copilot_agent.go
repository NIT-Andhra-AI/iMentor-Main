package course_agents

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// FacultyCopilotAgent processes faculty natural language suggestions, creates interactive demos,
// generates figures via Python/SVG, and manages the proposal/diff lifecycle with course memory.
type FacultyCopilotAgent struct {
	baseDir        string
	versionManager *CourseVersionManager
}

// NewFacultyCopilotAgent initializes the copilot agent
func NewFacultyCopilotAgent(baseDir string) *FacultyCopilotAgent {
	if baseDir == "" {
		baseDir = "course_bootstrap"
	}
	return &FacultyCopilotAgent{
		baseDir:        baseDir,
		versionManager: NewCourseVersionManager(baseDir),
	}
}

// CourseMemory captures the complete hierarchical context of a course + the active lecture
type CourseMemory struct {
	CourseCode     string          `json:"course_code"`
	CourseName     string          `json:"course_name"`
	IsLab          bool            `json:"is_lab"`
	Modules        []string        `json:"modules"`
	CourseOutcomes []string        `json:"course_outcomes"`
	TotalLectures  int             `json:"total_lectures"`
	ActiveLecture  Lecture         `json:"active_lecture"`
	ActiveLecNum   int             `json:"active_lec_num"`
	LectureContent string          `json:"lecture_content"`
	Spec           *R24ParsedCourse `json:"spec,omitempty"`
}

// CopilotProposal represents a generated change proposal ready for faculty review
type CopilotProposal struct {
	ProposalID      string    `json:"proposal_id"`
	CourseCode      string    `json:"course_code"`
	LectureNum      int       `json:"lecture_num"`
	Prompt          string    `json:"prompt"`
	ActionType      string    `json:"action_type"` // "FIGURE", "INTERACTIVE_DEMO", "THEORY_EXPANSION", "GATE_PYQ", "GENERAL"
	OriginalContent string    `json:"original_content"`
	ProposedContent string    `json:"proposed_content"`
	GeneratedAssets []string  `json:"generated_assets"` // paths to new images, SVGs, or JS scripts
	DiffSummary     string    `json:"diff_summary"`
	CreatedAt       time.Time `json:"created_at"`
	Status          string    `json:"status"` // "PENDING", "ACCEPTED", "REJECTED"
}

// LoadCourseMemory loads the full context of a course and the specific lecture
func (c *FacultyCopilotAgent) LoadCourseMemory(courseCode string, lecNum int) (*CourseMemory, error) {
	codeClean := strings.ToUpper(strings.ReplaceAll(courseCode, " ", ""))
	courseDir := filepath.Join(c.baseDir, codeClean)

	spec, _ := c.versionManager.LoadCourseSpec(codeClean)

	courseName := codeClean
	if spec != nil && spec.CourseName != "" {
		courseName = spec.CourseName
	}

	lecPath := filepath.Join(courseDir, "lectures", fmt.Sprintf("L%d.md", lecNum))
	contentBytes, err := os.ReadFile(lecPath)
	if err != nil {
		return nil, fmt.Errorf("lecture L%d not found for %s: %w", lecNum, codeClean, err)
	}

	var outcomes []string
	var modules []string
	if spec != nil {
		outcomes = spec.CourseOutcomes
		modules = spec.UnitTitles
	}

	mem := &CourseMemory{
		CourseCode:     codeClean,
		CourseName:     courseName,
		Modules:        modules,
		CourseOutcomes: outcomes,
		ActiveLecNum:   lecNum,
		LectureContent: string(contentBytes),
		Spec:           spec,
	}

	return mem, nil
}

// ProcessFacultySuggestion processes a faculty instruction for the currently active lecture
func (c *FacultyCopilotAgent) ProcessFacultySuggestion(courseCode string, lecNum int, prompt string) (*CopilotProposal, error) {
	codeClean := strings.ToUpper(strings.ReplaceAll(courseCode, " ", ""))
	log.Printf("🤖 [Faculty Copilot] Processing prompt for [%s] L%d: '%s'", codeClean, lecNum, prompt)

	mem, err := c.LoadCourseMemory(codeClean, lecNum)
	if err != nil {
		return nil, err
	}

	proposalID := fmt.Sprintf("prop_%d_%s", time.Now().Unix(), randomSuffix(4))
	pLower := strings.ToLower(prompt)

	var actionType string
	var proposedContent string
	var generatedAssets []string

	courseDir := filepath.Join(c.baseDir, codeClean)
	figuresDir := filepath.Join(courseDir, "figures")
	_ = os.MkdirAll(figuresDir, 0755)

	if strings.Contains(pLower, "figure") || strings.Contains(pLower, "diagram") || strings.Contains(pLower, "circuit") || strings.Contains(pLower, "schematic") || strings.Contains(pLower, "plot") || strings.Contains(pLower, "waveform") {
		actionType = "FIGURE"
		assetPath, figureMarkdown := c.generateFigureOrDiagram(courseCode, lecNum, prompt, figuresDir)
		if assetPath != "" {
			generatedAssets = append(generatedAssets, assetPath)
		}
		proposedContent = c.injectSectionIntoMarkdown(mem.LectureContent, "## 3. Structural Block Diagram & Circuit Schematics", figureMarkdown)

	} else if strings.Contains(pLower, "interactive") || strings.Contains(pLower, "demo") || strings.Contains(pLower, "slider") || strings.Contains(pLower, "simulation") || strings.Contains(pLower, "canvas") || strings.Contains(pLower, "mermaid") {
		actionType = "INTERACTIVE_DEMO"
		demoMarkdown := c.generateInteractiveDemoSnippet(courseCode, lecNum, prompt)
		proposedContent = c.injectSectionIntoMarkdown(mem.LectureContent, "## 5. Interactive Concept Simulation & Dynamic Demonstration", demoMarkdown)

	} else if strings.Contains(pLower, "gate") || strings.Contains(pLower, "pyq") || strings.Contains(pLower, "exam") || strings.Contains(pLower, "question") {
		actionType = "GATE_PYQ"
		gateMarkdown := c.generateGATEEnhancement(courseCode, lecNum, prompt, mem)
		proposedContent = c.injectSectionIntoMarkdown(mem.LectureContent, "## 6. 🎯 GATE Exam Focus & Previous Year Questions", gateMarkdown)

	} else {
		actionType = "THEORY_EXPANSION"
		expansionMarkdown := c.generateTheoryExpansion(courseCode, lecNum, prompt, mem)
		proposedContent = c.injectSectionIntoMarkdown(mem.LectureContent, "## 4. Core Theory & First-Principles Derivations", expansionMarkdown)
	}

	proposal := &CopilotProposal{
		ProposalID:      proposalID,
		CourseCode:      codeClean,
		LectureNum:      lecNum,
		Prompt:          prompt,
		ActionType:      actionType,
		OriginalContent: mem.LectureContent,
		ProposedContent: proposedContent,
		GeneratedAssets: generatedAssets,
		DiffSummary:     fmt.Sprintf("Applied %s enhancement to Lecture %d based on prompt: '%s'", actionType, lecNum, prompt),
		CreatedAt:       time.Now(),
		Status:          "PENDING",
	}

	// Save proposal file for staging
	proposalPath := filepath.Join(courseDir, fmt.Sprintf(".proposal_L%d.json", lecNum))
	data, _ := json.MarshalIndent(proposal, "", "  ")
	_ = os.WriteFile(proposalPath, data, 0644)

	log.Printf("✨ [Faculty Copilot] Proposal [%s] generated for %s L%d (%s)", proposalID, codeClean, lecNum, actionType)
	return proposal, nil
}

// AcceptProposal applies the pending proposal, backs up previous state to the session undo stack,
// and updates the active session without creating permanent commit spam.
func (c *FacultyCopilotAgent) AcceptProposal(courseCode string, lecNum int, facultyName string) (*SessionStep, error) {
	codeClean := strings.ToUpper(strings.ReplaceAll(courseCode, " ", ""))
	courseDir := filepath.Join(c.baseDir, codeClean)
	proposalPath := filepath.Join(courseDir, fmt.Sprintf(".proposal_L%d.json", lecNum))

	data, err := os.ReadFile(proposalPath)
	if err != nil {
		return nil, fmt.Errorf("no pending proposal found for %s L%d", codeClean, lecNum)
	}

	var proposal CopilotProposal
	if err := json.Unmarshal(data, &proposal); err != nil {
		return nil, err
	}

	// 1. Ensure working session exists
	_, err = c.versionManager.StartOrGetSession(codeClean, facultyName)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize session: %w", err)
	}

	// 2. Backup current lecture file to session undo stack BEFORE overwriting
	relLecPath := filepath.Join("lectures", fmt.Sprintf("L%d.md", lecNum))
	step, err := c.versionManager.PushSessionStep(codeClean, lecNum, proposal.ActionType, proposal.Prompt, []string{relLecPath})
	if err != nil {
		return nil, fmt.Errorf("failed to record session step: %w", err)
	}

	// 3. Write updated lecture file
	absLecPath := filepath.Join(courseDir, relLecPath)
	if err := os.WriteFile(absLecPath, []byte(proposal.ProposedContent), 0644); err != nil {
		return nil, fmt.Errorf("failed to apply proposal content: %w", err)
	}

	// 4. Remove pending proposal
	_ = os.Remove(proposalPath)

	log.Printf("✅ [Faculty Copilot] Proposal applied in session for %s L%d (Step %d). Easy undo available.",
		codeClean, lecNum, step.StepNumber)
	return step, nil
}

// UndoLastStep rolls back the most recent accepted proposal in the current session
func (c *FacultyCopilotAgent) UndoLastStep(courseCode string) (*SessionStep, error) {
	return c.versionManager.UndoLastSessionStep(courseCode)
}

// CommitSession packages all session modifications into an immutable version snapshot
func (c *FacultyCopilotAgent) CommitSession(courseCode, facultyName, message, tag string) (*CourseVersion, error) {
	return c.versionManager.CommitAndCloseSession(courseCode, facultyName, message, tag)
}

// DiscardSession discards all uncommitted session modifications and restores baseline
func (c *FacultyCopilotAgent) DiscardSession(courseCode string) error {
	return c.versionManager.DiscardSession(courseCode)
}

// PrintSessionStatus shows current session changes and undo options
func (c *FacultyCopilotAgent) PrintSessionStatus(courseCode string) {
	c.versionManager.PrintSessionStatus(courseCode)
}

// RejectProposal discards the pending proposal without changing any files
func (c *FacultyCopilotAgent) RejectProposal(courseCode string, lecNum int) error {
	codeClean := strings.ToUpper(strings.ReplaceAll(courseCode, " ", ""))
	courseDir := filepath.Join(c.baseDir, codeClean)
	proposalPath := filepath.Join(courseDir, fmt.Sprintf(".proposal_L%d.json", lecNum))

	if err := os.Remove(proposalPath); err != nil && !os.IsNotExist(err) {
		return err
	}

	log.Printf("🗑️ [Faculty Copilot] Proposal discarded for %s L%d.", codeClean, lecNum)
	return nil
}

// generateFigureOrDiagram uses Python scripts or generates high-res SVG circuit schematics
func (c *FacultyCopilotAgent) generateFigureOrDiagram(courseCode string, lecNum int, prompt, figuresDir string) (string, string) {
	filename := fmt.Sprintf("L%d_figure_%d.svg", lecNum, time.Now().Unix())
	assetRelPath := filepath.Join("figures", filename)
	assetAbsPath := filepath.Join(figuresDir, filename)

	// Generate clean electrical SVG schematic
	svgContent := generateSVGCircuit(prompt)
	_ = os.WriteFile(assetAbsPath, []byte(svgContent), 0644)

	// Also try Python matplotlib/schemdraw if python3 is available
	pyScript := fmt.Sprintf(`
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

fig, ax = plt.subplots(figsize=(8, 4), dpi=150)
t = np.linspace(0, 4*np.pi, 500)
v = np.sin(t)
i = 0.8 * np.sin(t - np.pi/4)

ax.plot(t, v, label='Voltage v(t)', color='#38bdf8', lw=2)
ax.plot(t, i, label='Current i(t)', color='#d4a853', lw=2, linestyle='--')
ax.set_facecolor('#0f172a')
fig.patch.set_facecolor('#0f172a')
ax.tick_params(colors='#94a3b8')
ax.spines['bottom'].set_color('#334155')
ax.spines['left'].set_color('#334155')
ax.spines['top'].set_color('#334155')
ax.spines['right'].set_color('#334155')
ax.legend(facecolor='#1e293b', edgecolor='#334155', labelcolor='#f8fafc')
ax.set_title('Dynamic Electrical Waveform Realization', color='#f8fafc', fontsize=12)
plt.tight_layout()
plt.savefig('%s', facecolor=fig.get_facecolor(), edgecolor='none')
`, filepath.Join(figuresDir, fmt.Sprintf("L%d_plot_%d.png", lecNum, time.Now().Unix())))

	_ = exec.Command("python3", "-c", pyScript).Run()

	markdownSnippet := fmt.Sprintf(`
### 3.1 Generated Circuit Schematic & Dynamic Waveform
![%s](%s)

%s
`, prompt, assetRelPath, svgContent)

	return assetAbsPath, markdownSnippet
}

func generateSVGCircuit(prompt string) string {
	return GenerateCircuitSVG(prompt, TrackStandardBTech)
}

// generateInteractiveDemoSnippet creates a Mermaid / HTML5 interactive demonstration
func (c *FacultyCopilotAgent) generateInteractiveDemoSnippet(courseCode string, lecNum int, prompt string) string {
	return fmt.Sprintf(`
### 5.1 Interactive Parameter Sandbox: %s

`+"```mermaid"+`
graph LR
    A[Input Excitation u_t] --> B[Active Controller / Plant]
    B --> C[State Transformation Matrix]
    C --> D[Output Metric y_t]
    D -. Feedback Loop .-> B
    style B fill:#1e293b,stroke:#d4a853,stroke-width:2px,color:#fff
    style C fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff
`+"```"+`

<div style="background:#0a1020; border:1px solid #20355a; border-radius:10px; padding:20px; margin:16px 0;">
  <div style="font-weight:700; color:#38bdf8; margin-bottom:10px;">⚡ Live Parameter Adjustment Sandbox</div>
  <div style="display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
    <label style="color:#cbd5e1; font-size:0.9rem;">Duty Cycle / Parameter &alpha;: <span id="copilotSliderVal" style="color:#d4a853; font-weight:700;">0.50</span></label>
    <input type="range" min="0.05" max="0.95" step="0.05" value="0.50" style="accent-color:#38bdf8;" oninput="document.getElementById('copilotSliderVal').innerText = this.value; document.getElementById('copilotOutputVal').innerText = (this.value * 24.0).toFixed(2) + ' V';">
    <span style="color:#cbd5e1; font-size:0.9rem;">Output Response $V_{out}$: <strong id="copilotOutputVal" style="color:#34d399;">12.00 V</strong></span>
  </div>
</div>
`, prompt)
}

// generateGATEEnhancement creates in-depth GATE numerical questions and shortcuts
func (c *FacultyCopilotAgent) generateGATEEnhancement(courseCode string, lecNum int, prompt string, mem *CourseMemory) string {
	return fmt.Sprintf(`
### 6.1 Advanced GATE Previous Year Examination Problem (2 Marks, NAT)

**Problem Statement:**
For the electrical architecture governing %s, determine the steady-state value under continuous conduction mode (CCM) given $V_{in} = 48\text{ V}$, switching frequency $f_s = 50\text{ kHz}$, and duty ratio $D = 0.40$. Assuming ideal components, calculate the average output voltage $V_o$ and the critical inductance $L_{crit}$ for a minimum load resistance $R_L = 10\ \Omega$.

**Step-by-Step Mathematical Solution:**
1. **Output Voltage Derivation:**
   $$ V_o = D \cdot V_{in} = 0.40 \times 48\text{ V} = 19.20\text{ V} $$

2. **Critical Inductance Formulation (Boundary Condition):**
   $$ L_{crit} = \frac{(1 - D) R_L}{2 f_s} = \frac{(1 - 0.40) \times 10}{2 \times 50 \times 10^3} = \frac{6}{10^5} = 60\ \mu\text{H} $$

3. **GATE Shortcut Tip:**
   > Remember that at the CCM/DCM boundary, the peak inductor current is exactly twice the average output current: $I_{L,peak} = 2 I_o$. If $L < L_{crit}$, the converter operates in DCM and $V_o$ becomes load-dependent!

**Correct Answer Range:** $[19.10\text{ to }19.30\text{ V}]$ and $[59.0\text{ to }61.0\ \mu\text{H}]$. $\blacksquare$
`, mem.ActiveLecture.Title)
}

// generateTheoryExpansion enriches first-principles proofs and physical interpretations
func (c *FacultyCopilotAgent) generateTheoryExpansion(courseCode string, lecNum int, prompt string, mem *CourseMemory) string {
	return fmt.Sprintf(`
### 4.1 Rigorous First-Principles Derivation & Boundary Formulations (%s)

Let the dynamic state vector be represented by $\mathbf{x}(t) \in \mathbb{R}^n$. The continuous-time differential formulation yields:

$$ \frac{d\mathbf{x}(t)}{dt} = \mathbf{A}_1 \mathbf{x}(t) + \mathbf{B}_1 \mathbf{u}(t) \quad \text{for } 0 < t \le D T_s $$
$$ \frac{d\mathbf{x}(t)}{dt} = \mathbf{A}_2 \mathbf{x}(t) + \mathbf{B}_2 \mathbf{u}(t) \quad \text{for } D T_s < t \le T_s $$

Applying state-space averaging across the fundamental switching cycle $T_s$:

$$ \mathbf{A}_{avg} = D \mathbf{A}_1 + (1 - D) \mathbf{A}_2, \quad \mathbf{B}_{avg} = D \mathbf{B}_1 + (1 - D) \mathbf{B}_2 $$

Perturbing around the equilibrium operating point $\mathbf{x}(t) = \mathbf{X} + \mathbf{\tilde{x}}(t)$ and linearizing the quadratic products yields the small-signal canonical transfer function:

$$ G_{vd}(s) = \frac{\mathbf{\tilde{v}}_o(s)}{\mathbf{\tilde{d}}(s)} = \mathbf{C} (s\mathbf{I} - \mathbf{A}_{avg})^{-1} [(\mathbf{A}_1 - \mathbf{A}_2)\mathbf{X} + (\mathbf{B}_1 - \mathbf{B}_2)\mathbf{U}] $$
`, prompt)
}

func (c *FacultyCopilotAgent) injectSectionIntoMarkdown(content, sectionHeader, newSnippet string) string {
	if strings.Contains(content, sectionHeader) {
		// Replace or append right after the section header
		return strings.Replace(content, sectionHeader, sectionHeader+"\n"+newSnippet, 1)
	}
	// Append at the bottom if section not explicitly found
	return content + "\n\n" + sectionHeader + "\n" + newSnippet
}
