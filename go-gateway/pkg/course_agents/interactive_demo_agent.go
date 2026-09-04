package course_agents

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// InteractiveDemoAgent generates standalone HTML5/Canvas/KaTeX interactive portals
// with specialized visual physics engines calibrated for GATE engineering disciplines.
type InteractiveDemoAgent struct{}

// NewInteractiveDemoAgent initializes the agent
func NewInteractiveDemoAgent() *InteractiveDemoAgent {
	return &InteractiveDemoAgent{}
}

// GeneratePortal creates index.html, style.css, and app.js with subject-specific interactive demos
func (a *InteractiveDemoAgent) GeneratePortal(course CourseStructure, resources ResourceBundle, outputDir string) (string, error) {
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return "", err
	}

	htmlPath := filepath.Join(outputDir, "index.html")
	cssPath := filepath.Join(outputDir, "style.css")
	jsPath := filepath.Join(outputDir, "app.js")

	htmlContent := a.buildHTML(course, resources)
	if err := os.WriteFile(htmlPath, []byte(htmlContent), 0644); err != nil {
		return "", err
	}

	cssContent := a.buildCSS()
	if err := os.WriteFile(cssPath, []byte(cssContent), 0644); err != nil {
		return "", err
	}

	jsContent := a.buildJS(course, resources)
	if err := os.WriteFile(jsPath, []byte(jsContent), 0644); err != nil {
		return "", err
	}

	return htmlPath, nil
}

func (a *InteractiveDemoAgent) getCategoryConfig(category, courseCode string) (vizTitle, label1, label2 string, min1, max1, step1, val1, min2, max2, step2, val2 float64, defaultMath, qText string, options [3]string, correctIdx int, correctExpl, wrongExpl string) {
	cat := strings.ToLower(strings.TrimSpace(category))
	code := strings.ToUpper(strings.TrimSpace(courseCode))

	if strings.Contains(code, "EE3011") || strings.Contains(code, "EE3661") || strings.Contains(code, "EE3741") || cat == "power_electronics" {
		return "⚡ Interactive DC-DC Converter PWM & Inductor Current Ripple Sandbox",
			"Duty Cycle D (0.05 - 0.95)", "Switching Freq fs (kHz)",
			0.05, 0.95, 0.05, 0.50, 10.0, 200.0, 10.0, 50.0,
			`$$ V_{out} = \frac{V_{in}}{1 - D} \quad \text{(Boost)} \quad \text{or} \quad V_{out} = D V_{in} \quad \text{(Buck)}, \quad \Delta I_L = \frac{V_{in} D}{L f_s} $$`,
			"In a Buck converter operating in Continuous Conduction Mode (CCM), what happens to the inductor current ripple ΔI_L when the switching frequency is doubled?",
			[3]string{
				"A) The ripple ΔI_L doubles proportionally",
				"B) The ripple ΔI_L is halved, reducing output voltage ripple",
				"C) The ripple ΔI_L remains unchanged",
			},
			1,
			"Correct! Inductor current ripple is inversely proportional to switching frequency (ΔI_L = V_in * D / (L * f_s)). Doubling f_s cuts ripple in half.",
			"Incorrect. Recall that ΔI_L = (V_in - V_out)*D / (L * f_s). Higher switching frequency reduces inductor ripple."
	}

	if strings.Contains(code, "EE2061") || strings.Contains(code, "EE3601") || cat == "control" {
		return "🎯 Interactive 2nd-Order Step Response & s-Plane Pole Trajectory Sandbox",
			"Damping Ratio ζ (0.05 - 2.00)", "Natural Freq ω_n (rad/s)",
			0.05, 2.00, 0.05, 0.50, 1.0, 20.0, 0.5, 4.0,
			`$$ T(s) = \frac{\omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2}, \quad \%OS = e^{-\frac{\pi\zeta}{\sqrt{1-\zeta^2}}} \times 100\%, \quad T_s \approx \frac{4}{\zeta\omega_n} $$`,
			"For a second-order underdamped control system (0 < ζ < 1), what effect does increasing the damping ratio ζ have on percentage overshoot and settling time?",
			[3]string{
				"A) Overshoot decreases and settling time generally decreases",
				"B) Overshoot increases and settling time increases",
				"C) Overshoot is unaffected by damping ratio",
			},
			0,
			"Correct! Increasing ζ increases the exponential decay rate e^(-ζ ω_n t), dampening oscillations and reducing overshoot %OS.",
			"Incorrect. The percentage overshoot is %OS = 100 * exp(-pi*zeta / sqrt(1 - zeta^2)). Higher zeta monotonically decreases overshoot."
	}

	if strings.Contains(code, "EE2031") || strings.Contains(code, "EE2051") || strings.Contains(code, "EE3041") || strings.Contains(code, "EE4631") || cat == "machines" {
		return "⚙️ Interactive 3-Phase Induction Motor Torque-Speed & Slip Characteristic Sandbox",
			"Rotor Resistance R2 (Ω)", "Stator Voltage Vs (% nominal)",
			0.1, 2.0, 0.1, 0.4, 50.0, 120.0, 5.0, 100.0,
			`$$ T = \frac{3}{\omega_s} \frac{V_s^2 (R_2'/s)}{(R_1 + R_2'/s)^2 + (X_1 + X_2')^2}, \quad s_{max} = \frac{R_2'}{\sqrt{R_1^2 + (X_1 + X_2')^2}} $$`,
			"What is the effect of inserting external resistance into the rotor circuit of a wound-rotor induction motor?",
			[3]string{
				"A) Increases maximum breakdown torque T_max",
				"B) Shifts the slip at which maximum torque occurs (s_max) towards higher slip without altering T_max",
				"C) Reduces the starting torque",
			},
			1,
			"Correct! Maximum torque T_max is independent of rotor resistance R_2, but the slip at maximum torque s_max is directly proportional to R_2.",
			"Incorrect. In induction machines, T_max depends on V_s and leakage reactances, while R_2 determines the slip location s_max."
	}

	if strings.Contains(code, "EE2071") || strings.Contains(code, "EE3021") || strings.Contains(code, "EE3711") || cat == "power_systems" {
		return "🌐 Interactive Power-Angle Curve & Equal Area Transient Stability Sandbox",
			"Mechanical Power Pm (p.u.)", "Fault Clearing Angle δ_cr (deg)",
			0.1, 1.0, 0.05, 0.60, 20.0, 90.0, 2.0, 55.0,
			`$$ P_e = \frac{E V}{X} \sin\delta, \quad M \frac{d^2\delta}{dt^2} = P_m - P_e, \quad A_1 (\text{Accel}) = A_2 (\text{Decel}) $$`,
			"According to the Equal Area Criterion for transient stability, an electrical power system remains stable following a fault if:",
			[3]string{
				"A) The accelerating kinetic energy area A1 is strictly less than or equal to the maximum available decelerating area A2",
				"B) The fault clearing angle exceeds the critical clearing angle",
				"C) The rotor angle δ reaches 180 degrees",
			},
			0,
			"Correct! Stability is maintained if the decelerating area A2 can absorb all transient kinetic energy accumulated during the accelerating fault interval A1.",
			"Incorrect. Equal Area Criterion dictates that A1 <= A2 for the rotor swing to turn around before reaching the instability threshold."
	}

	if strings.Contains(code, "EE1011") || strings.Contains(code, "EE1021") || strings.Contains(code, "EE2601") || cat == "circuits" {
		return "⚡ Interactive Series RLC Resonance, Bandwidth & Dynamic Phasor Visualizer",
			"Quality Factor Q / Damping", "Normalized Freq ω / ω0",
			0.2, 10.0, 0.2, 2.5, 0.2, 3.0, 0.05, 1.0,
			`$$ Z(j\omega) = R + j\left(\omega L - \frac{1}{\omega C}\right), \quad \omega_0 = \frac{1}{\sqrt{LC}}, \quad Q = \frac{\omega_0 L}{R} = \frac{1}{\omega_0 C R} $$`,
			"In a series RLC circuit at resonance (ω = ω0), what is the total input impedance and the phase difference between input voltage and total current?",
			[3]string{
				"A) Impedance is maximum and purely reactive with 90° phase shift",
				"B) Impedance is minimum (purely resistive Z = R) and current is in-phase (0° phase shift) with voltage",
				"C) Impedance is zero and current leads by 45°",
			},
			1,
			"Correct! At resonance, inductive and capacitive reactances cancel (X_L = X_C), leaving purely resistive minimum impedance Z = R at unity power factor.",
			"Incorrect. At series resonance, X_L = X_C so the reactive part is zero, making Z = R (minimum) and power factor = 1.0."
	}

	if strings.Contains(code, "CS1031") || strings.Contains(code, "CS2101") || strings.Contains(code, "CS2102") || cat == "cs" {
		return "💻 Interactive Data Structure Binary Search & Tree Balancing Sandbox",
			"Array Size / Nodes N", "Search Key / Pivot Ratio",
			8.0, 64.0, 4.0, 24.0, 0.1, 0.9, 0.05, 0.50,
			`$$ T(N) = T(N/2) + O(1) \implies T(N) = O(\log_2 N) \quad \text{(Binary Search / Balanced BST)} $$`,
			"What is the tight worst-case time complexity of searching in a self-balancing AVL Tree versus an unbalanced Binary Search Tree?",
			[3]string{
				"A) O(log N) for AVL Tree, O(N) for degenerate unbalanced BST",
				"B) O(1) for AVL Tree, O(log N) for BST",
				"C) O(N log N) for both structures",
			},
			0,
			"Correct! AVL trees maintain strict height balance (|h_L - h_R| <= 1), guaranteeing O(log N) worst-case height, while an unconstrained BST can degrade to an O(N) linked list.",
			"Incorrect. Unbalanced BSTs can degenerate into O(N) linear chains. Self-balancing trees guarantee O(log N) through rotations."
	}

	if strings.Contains(code, "MA1011") || strings.Contains(code, "MA1021") || strings.Contains(code, "MA2051") || cat == "math" {
		return "📐 Interactive 2D Vector Field Matrix Transformation & Eigenspace Visualizer",
			"Eigenvalue Scale λ1", "Eigenvector Rotation θ (rad)",
			-2.0, 3.0, 0.1, 1.5, 0.0, 3.14, 0.05, 0.78,
			`$$ \mathbf{A}\mathbf{v} = \lambda\mathbf{v}, \quad \det(\mathbf{A} - \lambda\mathbf{I}) = 0, \quad \mathbf{x}(t) = c_1 e^{\lambda_1 t}\mathbf{v}_1 + c_2 e^{\lambda_2 t}\mathbf{v}_2 $$`,
			"If a 2x2 state matrix A has distinct real eigenvalues λ1 < 0 and λ2 > 0, the equilibrium origin (0,0) is classified as:",
			[3]string{
				"A) A stable node attractor",
				"B) An unstable saddle point with stable and unstable manifolds",
				"C) A marginal center orbit",
			},
			1,
			"Correct! One negative and one positive eigenvalue produce a saddle point: trajectories contract along the stable eigenvector and expand along the unstable eigenvector.",
			"Incorrect. Opposite signs of real eigenvalues (one positive, one negative) define a saddle point topology."
	}

	// Default fallback: Digital Signal Processing & Signals
	return "📊 Interactive Z-Plane Pole-Zero Constellation & DTFT Frequency Response",
		"Pole Magnitude |p| (0.1 - 1.5)", "Pole Angle θ (× π rad)",
		0.1, 1.5, 0.05, 0.70, 0.0, 1.0, 0.05, 0.35,
		`$$ H(z) = \frac{1}{1 - 2r\cos(\theta)z^{-1} + r^2 z^{-2}} \iff |H(e^{j\omega})| = \frac{1}{|(e^{j\omega} - p_1)(e^{j\omega} - p_2)|} $$`,
		"Which criterion guarantees that a causal discrete-time LTI filter is strictly Bounded-Input Bounded-Output (BIBO) stable?",
		[3]string{
			"A) All poles lie strictly inside the unit circle |z| < 1",
			"B) All poles lie on or outside the unit circle |z| >= 1",
			"C) The filter has at least one pole at z = infinity",
		},
		0,
		"Correct! For a causal discrete-time filter, BIBO stability requires the Region of Convergence (ROC) to include the unit circle |z| = 1, meaning all system poles must lie inside |z| < 1.",
		"Incorrect. Recall that BIBO stability requires sum |h[n]| < infinity, which is satisfied if and only if all poles reside strictly within the open unit disk |z| < 1."
}

func (a *InteractiveDemoAgent) buildHTML(course CourseStructure, resources ResourceBundle) string {
	var sidebarBuilder strings.Builder
	for _, m := range course.Modules {
		sidebarBuilder.WriteString(fmt.Sprintf(`
            <div class="unit-section">
                <div class="unit-title">%s</div>`, m))

		for _, l := range course.Lectures {
			if l.Module == m {
				activeCls := ""
				if l.Num == 1 {
					activeCls = "active"
				}
				sidebarBuilder.WriteString(fmt.Sprintf(`
                <div class="lecture-item %s" data-lecture="%d" onclick="loadLecture(%d)">
                    <div class="lecture-num">L%d</div>
                    <div class="lecture-info">
                        <div class="lecture-title">%s</div>
                        <div class="lecture-meta">%s &bull; 40 mins</div>
                    </div>
                </div>`, activeCls, l.Num, l.Num, l.Num, l.Title, l.Bloom))
			}
		}
		sidebarBuilder.WriteString("\n            </div>")
	}

	vizTitle, label1, label2, min1, max1, step1, val1, min2, max2, step2, val2, defaultMath, qText, options, _, _, _ := a.getCategoryConfig(resources.Category, course.CourseCode)

	primaryTB := "Standard Higher-Education Engineering Textbook"
	if len(resources.Textbooks) > 0 {
		primaryTB = resources.Textbooks[0].Title + " (" + resources.Textbooks[0].Authors + ")"
	}
	nptelCourse := "NPTEL / SWAYAM / MIT OpenCourseWare Core Curriculum"
	if len(resources.NPTELCourses) > 0 {
		nptelCourse = resources.NPTELCourses[0].CourseName
	}

	htmlTemplate := `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>__CODE__: __NAME__ - Interactive GATE & B.Tech Learning Portal</title>
    <link rel="stylesheet" href="style.css">
    <!-- KaTeX for high-performance LaTeX rendering -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
</head>
<body>
    <div class="app-container">
        <!-- Sidebar Navigation -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <h1>__CODE__: __NAME__</h1>
                <p>IIT / B.Tech R24 Curriculum &bull; Interactive Lectures</p>
            </div>
            <nav class="lecture-list">
                __SIDEBAR_UNITS__
            </nav>
        </aside>

        <!-- Main Content Area -->
        <main class="main-content">
            <!-- Top Navigation Banner -->
            <header class="top-nav">
                <div class="current-lecture-badge" id="currentLecBadge">Lecture 1: Introduction</div>
                <div class="nav-actions">
                    <span class="badge badge-accent" id="bloomBadge">L2_UNDERSTAND</span>
                    <button class="btn btn-secondary" onclick="prevLecture()">← Prev</button>
                    <button class="btn btn-primary" onclick="nextLecture()">Next →</button>
                </div>
            </header>

            <!-- Lecture View Container -->
            <div class="content-body" id="lectureContentArea">
                <!-- Overview Card -->
                <div class="card">
                    <div class="card-title" id="lectureHeaderTitle">Lecture 1: Theoretical Foundations</div>
                    <div class="card-desc" id="lectureSubtopics">Loading lecture subtopics and engineering concepts...</div>
                    <div class="math-box" id="lectureMathFormula">
                        __DEFAULT_MATH__
                    </div>
                </div>

                <!-- Interactive Simulation Canvas Card -->
                <div class="card">
                    <div class="card-title">__VIZ_TITLE__</div>
                    <p class="card-desc">Adjust governing physical parameters in real time to observe mathematical transformations, dynamic waveforms, frequency responses, and stability trajectories.</p>
                    
                    <!-- Controls Bar -->
                    <div class="controls-bar">
                        <div class="control-group">
                            <label>__LABEL1__: <span id="paramValAlpha">__VAL1__</span></label>
                            <input type="range" id="sliderAlpha" min="__MIN1__" max="__MAX1__" step="__STEP1__" value="__VAL1__" oninput="updateSimulation()">
                        </div>
                        <div class="control-group">
                            <label>__LABEL2__: <span id="paramValOmega">__VAL2__</span></label>
                            <input type="range" id="sliderOmega" min="__MIN2__" max="__MAX2__" step="__STEP2__" value="__VAL2__" oninput="updateSimulation()">
                        </div>
                        <div class="control-group">
                            <button class="btn btn-accent" onclick="toggleAnimation()">▶ Run Simulation</button>
                            <button class="btn btn-secondary" onclick="resetSimulation()">Reset</button>
                        </div>
                    </div>

                    <!-- Live Canvas -->
                    <div class="canvas-container">
                        <canvas id="interactiveCanvas" width="900" height="340"></canvas>
                    </div>
                    <div class="canvas-caption" id="canvasCaption">Real-time simulation rendered at 60 FPS using HTML5 Canvas vector graphics & mathematical models.</div>
                </div>

                <!-- Diagnostic Checkpoint Quiz Card -->
                <div class="card">
                    <div class="card-title">🎯 GATE / Higher Education Concept Checkpoint</div>
                    <div id="checkpointQuestion" class="checkpoint-question">__Q_TEXT__</div>
                    <div class="options-grid" id="optionsContainer">
                        <button class="option-btn" onclick="checkAnswer(0)">__OPT0__</button>
                        <button class="option-btn" onclick="checkAnswer(1)">__OPT1__</button>
                        <button class="option-btn" onclick="checkAnswer(2)">__OPT2__</button>
                    </div>
                    <div class="feedback-alert" id="checkpointFeedback" style="display:none;"></div>
                </div>

                <!-- References & Textbooks Card -->
                <div class="card">
                    <div class="card-title">📚 Recommended Authoritative References & NPTEL Mapping</div>
                    <ul class="references-list" id="referencesList">
                        <li><strong>Canonical Reference:</strong> __PRIMARY_TB__</li>
                        <li><strong>National Curricular Link:</strong> __NPTEL_COURSE__</li>
                    </ul>
                </div>
            </div>
        </main>
    </div>

    <script src="app.js"></script>
</body>
</html>`

	res := strings.ReplaceAll(htmlTemplate, "__CODE__", course.CourseCode)
	res = strings.ReplaceAll(res, "__NAME__", course.CourseName)
	res = strings.ReplaceAll(res, "__SIDEBAR_UNITS__", sidebarBuilder.String())
	res = strings.ReplaceAll(res, "__VIZ_TITLE__", vizTitle)
	res = strings.ReplaceAll(res, "__LABEL1__", label1)
	res = strings.ReplaceAll(res, "__LABEL2__", label2)
	res = strings.ReplaceAll(res, "__MIN1__", fmt.Sprintf("%.2f", min1))
	res = strings.ReplaceAll(res, "__MAX1__", fmt.Sprintf("%.2f", max1))
	res = strings.ReplaceAll(res, "__STEP1__", fmt.Sprintf("%.2f", step1))
	res = strings.ReplaceAll(res, "__VAL1__", fmt.Sprintf("%.2f", val1))
	res = strings.ReplaceAll(res, "__MIN2__", fmt.Sprintf("%.2f", min2))
	res = strings.ReplaceAll(res, "__MAX2__", fmt.Sprintf("%.2f", max2))
	res = strings.ReplaceAll(res, "__STEP2__", fmt.Sprintf("%.2f", step2))
	res = strings.ReplaceAll(res, "__VAL2__", fmt.Sprintf("%.2f", val2))
	res = strings.ReplaceAll(res, "__DEFAULT_MATH__", defaultMath)
	res = strings.ReplaceAll(res, "__Q_TEXT__", qText)
	res = strings.ReplaceAll(res, "__OPT0__", options[0])
	res = strings.ReplaceAll(res, "__OPT1__", options[1])
	res = strings.ReplaceAll(res, "__OPT2__", options[2])
	res = strings.ReplaceAll(res, "__PRIMARY_TB__", primaryTB)
	res = strings.ReplaceAll(res, "__NPTEL_COURSE__", nptelCourse)
	return res
}

func (a *InteractiveDemoAgent) buildCSS() string {
	return `/* IIT / MIT Caliber Engineering Interactive Learning Portal Style */
:root {
    --bg-primary: #0a0f1d;
    --bg-secondary: #111827;
    --bg-card: #1e293b;
    --border-color: #334155;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --accent-blue: #38bdf8;
    --accent-emerald: #10b981;
    --accent-indigo: #818cf8;
    --accent-rose: #f43f5e;
    --accent-amber: #f59e0b;
}

* { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
body { background: var(--bg-primary); color: var(--text-primary); height: 100vh; overflow: hidden; }

.app-container { display: flex; height: 100vh; }

/* Sidebar */
.sidebar { width: 340px; background: #070c18; border-right: 1px solid var(--border-color); display: flex; flex-direction: column; }
.sidebar-header { padding: 20px; border-bottom: 1px solid var(--border-color); background: rgba(17, 24, 39, 0.8); }
.sidebar-header h1 { font-size: 1.15rem; font-weight: 700; color: var(--accent-blue); line-height: 1.3; }
.sidebar-header p { font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px; }

.lecture-list { flex: 1; overflow-y: auto; padding: 12px; }
.unit-section { margin-bottom: 16px; }
.unit-title { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); padding: 8px 12px; font-weight: 600; }

.lecture-item { display: flex; align-items: center; padding: 10px 12px; border-radius: 8px; cursor: pointer; margin-bottom: 4px; transition: all 0.2s ease; border: 1px solid transparent; }
.lecture-item:hover { background: rgba(56, 189, 248, 0.1); border-color: rgba(56, 189, 248, 0.3); }
.lecture-item.active { background: #1e293b; border-color: var(--accent-blue); box-shadow: 0 4px 12px rgba(56, 189, 248, 0.15); }

.lecture-num { width: 36px; height: 36px; border-radius: 6px; background: rgba(56, 189, 248, 0.15); color: var(--accent-blue); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; margin-right: 12px; flex-shrink: 0; }
.lecture-info { flex: 1; min-width: 0; }
.lecture-title { font-size: 0.88rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary); }
.lecture-meta { font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px; }

/* Main Content Area */
.main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.top-nav { height: 64px; border-bottom: 1px solid var(--border-color); background: #070c18; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; }
.current-lecture-badge { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); }
.nav-actions { display: flex; align-items: center; gap: 10px; }

.badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
.badge-accent { background: rgba(56, 189, 248, 0.15); color: var(--accent-blue); border: 1px solid var(--accent-blue); }

.btn { padding: 8px 16px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; transition: 0.2s; }
.btn-primary { background: var(--accent-blue); color: #0f172a; }
.btn-primary:hover { background: #7dd3fc; }
.btn-secondary { background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); }
.btn-secondary:hover { background: #334155; }
.btn-accent { background: var(--accent-emerald); color: #0f172a; }
.btn-accent:hover { background: #34d399; }

.content-body { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 24px; }
.card-title { font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
.card-desc { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px; }

.math-box { background: #070c18; padding: 16px; border-radius: 8px; border-left: 4px solid var(--accent-blue); overflow-x: auto; margin: 12px 0; font-size: 1.05rem; }

/* Interactive Canvas */
.controls-bar { display: flex; flex-wrap: wrap; gap: 20px; align-items: center; background: #070c18; padding: 14px 18px; border-radius: 8px; margin-bottom: 14px; border: 1px solid var(--border-color); }
.control-group { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: var(--text-primary); }
.control-group input[type="range"] { accent-color: var(--accent-blue); cursor: pointer; width: 140px; }

.canvas-container { background: #030712; border-radius: 8px; border: 1px solid var(--border-color); overflow: hidden; display: flex; justify-content: center; box-shadow: inset 0 2px 8px rgba(0,0,0,0.5); }
.canvas-caption { font-size: 0.8rem; color: var(--text-secondary); margin-top: 8px; text-align: center; }

/* Checkpoint Quiz */
.checkpoint-question { font-size: 0.95rem; font-weight: 600; margin-bottom: 12px; color: #e2e8f0; line-height: 1.4; }
.options-grid { display: flex; flex-direction: column; gap: 8px; }
.option-btn { text-align: left; background: #070c18; border: 1px solid var(--border-color); color: var(--text-primary); padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; cursor: pointer; transition: 0.2s; }
.option-btn:hover { border-color: var(--accent-blue); background: rgba(56, 189, 248, 0.08); }

.feedback-alert { padding: 14px; border-radius: 8px; margin-top: 12px; font-size: 0.9rem; line-height: 1.5; }
.feedback-correct { background: rgba(16, 185, 129, 0.15); border: 1px solid var(--accent-emerald); color: #34d399; }
.feedback-wrong { background: rgba(244, 63, 94, 0.15); border: 1px solid var(--accent-rose); color: #fb7185; }

.references-list { padding-left: 20px; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.8; }
.references-list strong { color: var(--text-primary); }`
}

func (a *InteractiveDemoAgent) buildJS(course CourseStructure, resources ResourceBundle) string {
	lecsJSON, _ := json.Marshal(course.Lectures)
	_, _, _, _, _, _, _, _, _, _, _, _, _, _, correctIdx, correctExpl, wrongExpl := a.getCategoryConfig(resources.Category, course.CourseCode)
	cat := strings.ToLower(strings.TrimSpace(resources.Category))
	code := strings.ToUpper(strings.TrimSpace(course.CourseCode))

	return fmt.Sprintf(`// IIT / MIT Level Interactive Engineering Simulation Engine
const lecturesData = %s;
const courseCategory = "%s";
const courseCode = "%s";
const correctIndex = %d;
const correctExpl = %q;
const wrongExpl = %q;

let currentLecIndex = 0;
let isAnimating = false;
let animFrameId = null;
let timeStep = 0;

document.addEventListener('DOMContentLoaded', () => {
    loadLecture(1);
    initCanvas();
    if (window.renderMathInElement) {
        renderMathInElement(document.body);
    }
});

function loadLecture(num) {
    const idx = lecturesData.findIndex(l => l.num === num);
    if (idx === -1) return;
    currentLecIndex = idx;
    const lec = lecturesData[idx];

    // Update active class in sidebar
    document.querySelectorAll('.lecture-item').forEach(item => {
        item.classList.toggle('active', parseInt(item.getAttribute('data-lecture')) === num);
    });

    // Update header & badges
    document.getElementById('currentLecBadge').innerText = 'L' + lec.num + ': ' + lec.title;
    document.getElementById('bloomBadge').innerText = lec.bloom || 'L3_APPLY';
    document.getElementById('lectureHeaderTitle').innerText = 'Lecture ' + lec.num + ': ' + lec.title;
    document.getElementById('lectureSubtopics').innerHTML = '<strong>Module:</strong> ' + lec.module + ' &bull; <strong>Topics:</strong> ' + (lec.subtopics || 'Comprehensive analysis.');

    // Reset Quiz Feedback
    document.getElementById('checkpointFeedback').style.display = 'none';

    drawSimulation();
}

function nextLecture() {
    if (currentLecIndex < lecturesData.length - 1) {
        loadLecture(lecturesData[currentLecIndex + 1].num);
    }
}

function prevLecture() {
    if (currentLecIndex > 0) {
        loadLecture(lecturesData[currentLecIndex - 1].num);
    }
}

// Canvas Visual Simulation Framework
const canvas = document.getElementById('interactiveCanvas');
const ctx = canvas.getContext('2d');

function initCanvas() {
    drawSimulation();
}

function updateSimulation() {
    const val1 = parseFloat(document.getElementById('sliderAlpha').value);
    const val2 = parseFloat(document.getElementById('sliderOmega').value);
    document.getElementById('paramValAlpha').innerText = val1.toFixed(2);
    document.getElementById('paramValOmega').innerText = val2.toFixed(2);
    drawSimulation();
}

function drawSimulation() {
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const val1 = parseFloat(document.getElementById('sliderAlpha').value);
    const val2 = parseFloat(document.getElementById('sliderOmega').value);

    // Draw Grid Background
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    if (courseCategory === 'power_electronics' || courseCode.includes('EE3011') || courseCode.includes('EE3741')) {
        drawPowerElectronicsSimulation(width, height, val1, val2);
    } else if (courseCategory === 'control' || courseCode.includes('EE2061')) {
        drawControlSimulation(width, height, val1, val2);
    } else if (courseCategory === 'machines' || courseCode.includes('EE2031') || courseCode.includes('EE2051')) {
        drawMachinesSimulation(width, height, val1, val2);
    } else if (courseCategory === 'power_systems' || courseCode.includes('EE2071') || courseCode.includes('EE3021')) {
        drawPowerSystemsSimulation(width, height, val1, val2);
    } else if (courseCategory === 'circuits' || courseCode.includes('EE1011') || courseCode.includes('EE2601')) {
        drawCircuitsSimulation(width, height, val1, val2);
    } else if (courseCategory === 'cs' || courseCode.includes('CS1031') || courseCode.includes('CS2101')) {
        drawCSSimulation(width, height, val1, val2);
    } else if (courseCategory === 'math' || courseCode.includes('MA1011') || courseCode.includes('MA1021')) {
        drawMathSimulation(width, height, val1, val2);
    } else {
        drawDSPSimulation(width, height, val1, val2);
    }
}

// 1. Power Electronics: PWM & Inductor Current Ripple (CCM/DCM)
function drawPowerElectronicsSimulation(width, height, D, fs) {
    const periodPx = 160;
    const tonPx = periodPx * D;
    const vIn = 24.0;
    const vOut = vIn / (1 - D); // Boost converter equation

    // Subplot 1: PWM Gate Pulses (Top)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 60; x < width - 40; x += periodPx) {
        ctx.moveTo(x, 100);
        ctx.lineTo(x, 40);
        ctx.lineTo(x + tonPx, 40);
        ctx.lineTo(x + tonPx, 100);
        ctx.lineTo(x + periodPx, 100);
    }
    ctx.stroke();

    // Subplot 2: Inductor Current i_L(t) (Bottom)
    const iAvg = 3.5;
    const deltaI = (vIn * D) / (0.001 * fs * 10);
    const iMax = iAvg + deltaI / 2;
    const iMin = Math.max(0.1, iAvg - deltaI / 2);

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = 60; x < width - 40; x += periodPx) {
        const yMin = 280 - (iMin * 20);
        const yMax = 280 - (iMax * 20);
        ctx.moveTo(x, yMin);
        ctx.lineTo(x + tonPx, yMax);
        ctx.lineTo(x + periodPx, yMin);
    }
    ctx.stroke();

    // Labels & Metrics
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('⚡ PWM Gate Drive Voltage v_gs(t)', 60, 25);
    ctx.fillText('📈 Inductor Current i_L(t) [CCM Mode]', 60, 160);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '13px sans-serif';
    ctx.fillText('Duty Cycle D: ' + D.toFixed(2) + ' (Ton: ' + (D*100).toFixed(0) + '%%)', width - 260, 45);
    ctx.fillText('Output Voltage V_out: ' + vOut.toFixed(1) + ' V', width - 260, 70);
    ctx.fillText('Inductor Ripple ΔI_L: ' + deltaI.toFixed(2) + ' A', width - 260, 95);
    ctx.fillText('Conduction Mode: ' + (iMin > 0.2 ? 'STABLE CCM' : 'CRITICAL BOUNDARY'), width - 260, 120);
}

// 2. Control Systems: 2nd-Order Step Response & s-Plane Poles
function drawControlSimulation(width, height, zeta, wn) {
    const centerX = 160;
    const centerY = height / 2;

    // Left Subplot: s-Plane Complex Axis
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(centerX - 120, centerY); ctx.lineTo(centerX + 120, centerY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(centerX, 20); ctx.lineTo(centerX, height - 20); ctx.stroke();

    // Poles
    const sigma = zeta * wn;
    const wd = zeta <= 1.0 ? wn * Math.sqrt(1 - zeta * zeta) : 0;

    const scale = 14;
    const pole1X = centerX - sigma * scale;
    const pole1Y = centerY - wd * scale;
    const pole2X = centerX - sigma * scale;
    const pole2Y = centerY + wd * scale;

    ctx.fillStyle = zeta < 1.0 ? '#38bdf8' : '#10b981';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('×', pole1X - 6, pole1Y + 6);
    ctx.fillText('×', pole2X - 6, pole2Y + 6);

    // Right Subplot: Time Domain Step Response y(t)
    const tStart = 340;
    const tWidth = width - tStart - 40;
    const baseLineY = 260;
    const targetY = 140;

    // Steady State Line (y=1)
    ctx.strokeStyle = '#64748b';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(tStart, targetY); ctx.lineTo(width - 40, targetY); ctx.stroke();
    ctx.setLineDash([]);

    // Step Response Waveform
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < tWidth; i++) {
        const t = (i / tWidth) * (8 / wn);
        let yVal = 0;
        if (zeta < 1.0) {
            const phi = Math.acos(zeta);
            yVal = 1 - (Math.exp(-zeta * wn * t) / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t + phi);
        } else {
            yVal = 1 - Math.exp(-wn * t) * (1 + wn * t);
        }
        const py = baseLineY - yVal * (baseLineY - targetY);
        if (i === 0) ctx.moveTo(tStart + i, py);
        else ctx.lineTo(tStart + i, py);
    }
    ctx.stroke();

    // Overshoot & Specs
    const OS = zeta < 1.0 ? Math.exp(-Math.PI * zeta / Math.sqrt(1 - zeta * zeta)) * 100 : 0;
    const Ts = (4 / (zeta * wn)).toFixed(2);
    const Tp = zeta < 1.0 ? (Math.PI / wd).toFixed(2) : 'N/A';

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('s-Plane Pole Constellation', 50, 35);
    ctx.fillText('Step Response y(t)', tStart, 35);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '13px sans-serif';
    ctx.fillText('Peak Overshoot (%%OS): ' + OS.toFixed(1) + '%%', tStart + 200, 60);
    ctx.fillText('Settling Time (Ts): ' + Ts + ' s', tStart + 200, 85);
    ctx.fillText('Peak Time (Tp): ' + Tp + ' s', tStart + 200, 110);
    ctx.fillText('System Damping: ' + (zeta < 1.0 ? 'Underdamped (ζ < 1)' : 'Overdamped (ζ >= 1)'), tStart + 200, 135);
}

// 3. Electric Machines: Induction Motor Torque-Speed & Slip Curve
function drawMachinesSimulation(width, height, R2, VsPercent) {
    const vsFactor = VsPercent / 100.0;
    const vsSq = vsFactor * vsFactor;
    const sMax = Math.min(1.0, R2 / 0.8);
    const tMax = 100 * vsSq;

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();

    const tStart = 100;
    const tWidth = width - 200;
    for (let i = 0; i <= tWidth; i++) {
        const s = 1.0 - (i / tWidth); // Slip from 1.0 (start) down to 0.0 (sync speed)
        const tVal = (2 * tMax) / ((s / sMax) + (sMax / Math.max(0.01, s)));
        const py = 280 - (tVal * 1.8);
        const px = tStart + i;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Draw Synchronous Speed & Stall Line
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(tStart, 40); ctx.lineTo(tStart, 280); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tStart + tWidth, 40); ctx.lineTo(tStart + tWidth, 280); ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('3-Phase Induction Motor Torque-Speed Characteristic (Kloss Equation)', 60, 30);
    ctx.fillText('Standstill (s=1.0, N=0)', tStart - 40, 305);
    ctx.fillText('Sync Speed (s=0, N=Ns)', tStart + tWidth - 80, 305);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '13px sans-serif';
    ctx.fillText('Breakdown Torque T_max: ' + tMax.toFixed(1) + ' Nm (∝ Vs²)', width - 280, 70);
    ctx.fillText('Slip at Max Torque s_max: ' + sMax.toFixed(2) + ' (∝ R2)', width - 280, 95);
    ctx.fillText('Starting Torque T_st: ' + ((2*tMax)/((1/sMax)+sMax)).toFixed(1) + ' Nm', width - 280, 120);
}

// 4. Power Systems: Power-Angle Curve & Equal Area Criterion
function drawPowerSystemsSimulation(width, height, Pm, deltaCrDeg) {
    const deltaCr = (deltaCrDeg * Math.PI) / 180.0;
    const Pmax = 1.2;

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const tStart = 100;
    const tWidth = width - 200;

    for (let i = 0; i <= tWidth; i++) {
        const delta = (i / tWidth) * Math.PI;
        const Pe = Pmax * Math.sin(delta);
        const px = tStart + i;
        const py = 270 - (Pe / 1.5) * 200;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Mechanical Power Line Pm
    const pmY = 270 - (Pm / 1.5) * 200;
    ctx.strokeStyle = '#f43f5e';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(tStart, pmY); ctx.lineTo(tStart + tWidth, pmY); ctx.stroke();
    ctx.setLineDash([]);

    // Critical Clearing Line
    const crX = tStart + (deltaCr / Math.PI) * tWidth;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(crX, 60); ctx.lineTo(crX, 270); ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Equal Area Criterion & Power-Angle Curve Pe = (EV/X)sin(δ)', 60, 30);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '13px sans-serif';
    ctx.fillText('Mechanical Input Pm: ' + Pm.toFixed(2) + ' p.u.', width - 280, 60);
    ctx.fillText('Clearing Angle δ_cr: ' + deltaCrDeg.toFixed(1) + '°', width - 280, 85);
    ctx.fillText('Stability Status: ' + (deltaCrDeg < 65 ? 'TRANSIENTLY STABLE (A1 < A2)' : 'UNSTABLE (A1 > A2)'), width - 280, 110);
}

// 5. Circuits: RLC Resonance & Phasor Diagram
function drawCircuitsSimulation(width, height, Q, freqRatio) {
    const tStart = 320;
    const tWidth = width - tStart - 40;

    // Subplot 1: Dynamic Rotating Phasors (Left)
    const centerX = 160;
    const centerY = height / 2;
    const vrLen = 70;
    const vlLen = 70 * Q * freqRatio;
    const vcLen = 70 * (Q / Math.max(0.1, freqRatio));

    ctx.strokeStyle = '#10b981'; // VR (in phase with I)
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(centerX + vrLen, centerY); ctx.stroke();

    ctx.strokeStyle = '#38bdf8'; // VL (leads by 90)
    ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(centerX, centerY - vlLen * 0.4); ctx.stroke();

    ctx.strokeStyle = '#f43f5e'; // VC (lags by 90)
    ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(centerX, centerY + vcLen * 0.4); ctx.stroke();

    // Subplot 2: Series Resonance Current Response I(w)
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < tWidth; i++) {
        const w = (i / tWidth) * 3.0;
        const denom = Math.sqrt(1 + Q * Q * Math.pow(w - (1 / Math.max(0.01, w)), 2));
        const resp = 1.0 / denom;
        const px = tStart + i;
        const py = 270 - resp * 180;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Dynamic Phasor Diagram (VR, VL, VC)', 30, 30);
    ctx.fillText('Current Response |I(ω)| vs Frequency', tStart, 30);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '13px sans-serif';
    ctx.fillText('Quality Factor Q: ' + Q.toFixed(2), tStart + 220, 60);
    ctx.fillText('Bandwidth BW: ' + (1.0 / Q).toFixed(3) + ' ω0', tStart + 220, 85);
    ctx.fillText('Phase Status: ' + (Math.abs(freqRatio - 1.0) < 0.05 ? 'RESONANT (Unity PF)' : freqRatio > 1.0 ? 'Inductive (Lagging)' : 'Capacitive (Leading)'), tStart + 220, 110);
}

// 6. Computer Science: Binary Search & Tree Partitioning
function drawCSSimulation(width, height, N, pivotRatio) {
    const arrSize = Math.round(N);
    const boxW = Math.min(30, (width - 120) / arrSize);
    const startX = 60;
    const targetIdx = Math.floor(arrSize * pivotRatio);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Binary Search & O(log N) Divide-and-Conquer Interval Partitioning', 60, 30);

    for (let i = 0; i < arrSize; i++) {
        const px = startX + i * (boxW + 4);
        ctx.fillStyle = (i === targetIdx) ? '#10b981' : (i < targetIdx) ? '#1e293b' : '#334155';
        ctx.fillRect(px, 100, boxW, 50);
        ctx.strokeStyle = (i === targetIdx) ? '#34d399' : '#475569';
        ctx.strokeRect(px, 100, boxW, 50);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '11px sans-serif';
        ctx.fillText(i.toString(), px + boxW/4, 130);
    }

    ctx.fillStyle = '#38bdf8';
    ctx.font = '13px sans-serif';
    ctx.fillText('Total Elements N: ' + arrSize, 60, 200);
    ctx.fillText('Worst-Case Comparisons: ceil(log2(N)) = ' + Math.ceil(Math.log2(arrSize)) + ' steps', 60, 225);
    ctx.fillText('Target Element Index: ' + targetIdx + ' [Found in O(log N) Time]', 60, 250);
}

// 7. Mathematics: 2D Eigenspace Transformation
function drawMathSimulation(width, height, lambda1, theta) {
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(centerX - 180, centerY); ctx.lineTo(centerX + 180, centerY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(centerX, centerY - 120); ctx.lineTo(centerX, centerY + 120); ctx.stroke();

    // Transformed Ellipse
    const rX = 70 * Math.abs(lambda1);
    const rY = 50;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(theta);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, rX, rY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Principal Eigenvector v1
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(rX, 0); ctx.stroke();

    // Principal Eigenvector v2
    ctx.strokeStyle = '#f43f5e';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, rY); ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('2D Matrix Eigenspace & Ellipsoidal Spectral Deformation: Av = λv', 60, 30);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '13px sans-serif';
    ctx.fillText('Eigenvalue λ1: ' + lambda1.toFixed(2), width - 260, 60);
    ctx.fillText('Eigenvector Angle θ: ' + (theta * 180 / Math.PI).toFixed(0) + '°', width - 260, 85);
    ctx.fillText('Equilibrium Class: ' + (lambda1 < 0 ? 'Saddle / Stable' : 'Unstable Expanding Node'), width - 260, 110);
}

// 8. DSP: Z-Plane & DTFT Response
function drawDSPSimulation(width, height, r, thetaRatio) {
    const centerX = 160;
    const centerY = height / 2;
    const radius = 80;
    const theta = thetaRatio * Math.PI;

    // Unit Circle
    ctx.strokeStyle = '#64748b';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    // Poles
    const px1 = centerX + r * radius * Math.cos(theta);
    const py1 = centerY - r * radius * Math.sin(theta);
    const px2 = centerX + r * radius * Math.cos(theta);
    const py2 = centerY + r * radius * Math.sin(theta);

    ctx.fillStyle = r < 1.0 ? '#10b981' : '#f43f5e';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('×', px1 - 6, py1 + 6);
    ctx.fillText('×', px2 - 6, py2 + 6);

    // Right Subplot: DTFT Frequency Response
    const tStart = 360;
    const tWidth = width - tStart - 40;

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < tWidth; i++) {
        const w = (i / tWidth) * Math.PI;
        const d1 = Math.sqrt(Math.pow(Math.cos(w) - r*Math.cos(theta), 2) + Math.pow(Math.sin(w) - r*Math.sin(theta), 2));
        const d2 = Math.sqrt(Math.pow(Math.cos(w) - r*Math.cos(theta), 2) + Math.pow(Math.sin(w) + r*Math.sin(theta), 2));
        const mag = 1.0 / Math.max(0.05, d1 * d2);
        const py = 270 - Math.min(200, mag * 25);
        const px = tStart + i;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Z-Plane Unit Circle & Poles', 60, 30);
    ctx.fillText('DTFT Magnitude Response |H(e^jω)|', tStart, 30);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '13px sans-serif';
    ctx.fillText('Pole Radius |p|: ' + r.toFixed(2), tStart + 220, 60);
    ctx.fillText('Resonance Freq: ' + (thetaRatio).toFixed(2) + ' π rad', tStart + 220, 85);
    ctx.fillText('BIBO Stability: ' + (r < 1.0 ? 'STABLE (|p| < 1)' : 'UNSTABLE (|p| >= 1)'), tStart + 220, 110);
}

function toggleAnimation() {
    isAnimating = !isAnimating;
    if (isAnimating) animate();
    else cancelAnimationFrame(animFrameId);
}

function animate() {
    timeStep += 0.05;
    drawSimulation();
    animFrameId = requestAnimationFrame(animate);
}

function resetSimulation() {
    isAnimating = false;
    cancelAnimationFrame(animFrameId);
    timeStep = 0;
    updateSimulation();
}

function checkAnswer(idx) {
    const feedback = document.getElementById('checkpointFeedback');
    feedback.style.display = 'block';
    if (idx === correctIndex) {
        feedback.className = 'feedback-alert feedback-correct';
        feedback.innerHTML = '<strong>✓ Correct! (GATE Benchmark Standard)</strong><br>' + correctExpl;
    } else {
        feedback.className = 'feedback-alert feedback-wrong';
        feedback.innerHTML = '<strong>✗ Incorrect.</strong><br>' + wrongExpl;
    }
}
`, string(lecsJSON), cat, code, correctIdx, correctExpl, wrongExpl)
}
