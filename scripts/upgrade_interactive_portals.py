import os
import sys
import glob
import csv
import json

AGENT_CODE = '''#!/usr/bin/env python3
"""
InteractiveDemoAgent:
Synthesizes world-class standalone interactive HTML5/Canvas/KaTeX course web portals
styled after the master standard of spkkarri/DSP-Course.
Provides real-time mathematical simulation sandboxes, interactive system block diagrams,
dynamic parameter sliders with status pills, and interactive lecture checkpoints across
all engineering disciplines (Machine Learning, Circuits, Control, Power Electronics, Signals, etc.).
"""

import os
import json
from typing import Dict, List, Any

class InteractiveDemoAgent:
    """Agent that synthesizes full interactive web learning portals for engineering courses."""

    def resolve_category(self, course_code: str, course_name: str, explicit_category: str = "") -> str:
        code = (course_code or "").upper()
        name = (course_name or "").lower()
        explicit = (explicit_category or "").lower()

        if explicit in ["ml", "drl", "circuits", "control", "power_electronics", "machines", "signals", "dsp", "cs_algo", "vlsi"]:
            return explicit

        if any(k in name for k in ["reinforcement learning", "q-learning", "markov decision", "cs702"]):
            return "drl"
        if any(k in name for k in ["machine learning", "deep learning", "neural network", "pattern recognition", "cs601"]):
            return "ml"
        if any(k in name for k in ["digital signal", "dsp", "ee3621"]):
            return "dsp"
        if any(k in name for k in ["signals and systems", "signals & systems", "ee1621", "ec1521"]):
            return "signals"
        if any(k in name for k in ["circuit theory", "electric circuit", "network analysis", "ee2010", "ee1011", "ee1021", "ee1031", "ee2601"]):
            return "circuits"
        if any(k in name for k in ["control system", "linear control", "control engineering", "ee3010", "ee3601", "ee3011"]):
            return "control"
        if any(k in name for k in ["power electronics", "converter", "inverter", "chopper", "pe1022", "pe2012", "ee4014", "ee4024", "ee3661"]):
            return "power_electronics"
        if any(k in name for k in ["machine", "transformer", "induction motor", "synchronous", "ee2021", "ee2031", "ee2051", "ee3041"]):
            return "machines"
        if any(k in name for k in ["power system", "transmission", "distribution", "ee2071", "ee3021", "ee3711"]):
            return "power_systems"
        if any(k in name for k in ["data structure", "algorithm", "programming", "computer programming", "cs2101", "cs1031", "cs1032"]):
            return "cs_algo"
        if any(k in name for k in ["vlsi", "cmos", "digital ic", "integrated circuit", "ec401"]):
            return "vlsi"

        return "engineering"

    def generate_portal(self, course_data: Dict[str, Any], resources: Dict[str, Any], output_dir: str) -> Dict[str, str]:
        os.makedirs(output_dir, exist_ok=True)
        
        course_code = course_data.get("course_code", "EE3621")
        course_name = course_data.get("course_name", "Engineering Course")
        lectures = course_data.get("lectures", [])
        
        category = self.resolve_category(course_code, course_name, resources.get("category", ""))

        html_path = os.path.join(output_dir, "index.html")
        css_path = os.path.join(output_dir, "style.css")
        js_path = os.path.join(output_dir, "app.js")

        # 1. Generate HTML
        html_content = self._build_html(course_code, course_name, lectures, resources, category)
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)

        # 2. Generate CSS
        css_content = self._build_css()
        with open(css_path, "w", encoding="utf-8") as f:
            f.write(css_content)

        # 3. Generate JS Interactive Engine
        js_content = self._build_js(course_code, course_name, lectures, category)
        with open(js_path, "w", encoding="utf-8") as f:
            f.write(js_content)

        return {
            "html": html_path,
            "css": css_path,
            "js": js_path,
            "category": category,
            "status": "ready"
        }

    def _build_html(self, code: str, name: str, lectures: List[Dict[str, Any]], resources: Dict[str, Any], category: str) -> str:
        units = list(dict.fromkeys(l["module"] for l in lectures)) if lectures else ["Unit 1"]
        
        sidebar_units_html = ""
        for u in units:
            unit_lecs = [l for l in lectures if l["module"] == u] if lectures else []
            sidebar_units_html += f"""
            <div class="unit-section">
                <div class="unit-title">{u}</div>"""
            for l in unit_lecs:
                active_cls = "active" if l.get("num", 1) == 1 else ""
                sidebar_units_html += f"""
                <div class="lecture-item {active_cls}" data-lecture="{l['num']}" onclick="loadLecture({l['num']})">
                    <div class="lecture-num">L{l['num']}</div>
                    <div class="lecture-info">
                        <div class="lecture-title">{l['title']}</div>
                        <div class="lecture-meta">{l.get('bloom', 'L3_APPLY')} &bull; 45 mins</div>
                    </div>
                </div>"""
            sidebar_units_html += "\\n            </div>"

        domain_meta = self._get_domain_meta(category, code, name)

        primary_tb = resources.get('textbooks', [{}])[0].get('title', "Standard Reference Textbook") if resources.get('textbooks') else "Standard Reference Textbook"
        nptel_course = resources.get('nptel_courses', [{}])[0].get('course_name', "NPTEL / SWAYAM Online Portal") if resources.get('nptel_courses') else "NPTEL / SWAYAM Online Portal"

        template = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{code}: {name} - Interactive Learning Portal</title>
    <link rel="stylesheet" href="style.css">
    <!-- KaTeX for crisp mathematical notation -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
</head>
<body>
    <div class="app-container">
        <!-- Sidebar Navigation -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <h1>{code}: {name}</h1>
                <p>Interactive Lecture &amp; Simulation Sandbox</p>
            </div>
            <nav class="lecture-list">
                {sidebar_units_html}
            </nav>
        </aside>

        <!-- Main Content Area -->
        <main class="main-content">
            <header class="main-header">
                <div class="header-title">
                    <h2 id="currentLecBadge">Lecture 1: Introduction</h2>
                    <p id="lectureSubtopics">Loading curriculum details and mathematical foundations...</p>
                </div>
                <div class="header-actions">
                    <span class="status-pill success" id="bloomBadge">L3_APPLY</span>
                    <button class="btn" onclick="prevLecture()">← Prev</button>
                    <button class="btn btn-primary" onclick="nextLecture()">Next →</button>
                </div>
            </header>

            <div class="content-wrapper">
                <!-- Theoretical Foundations Card -->
                <section class="card">
                    <div class="card-title">Curriculum Foundations &amp; Mathematical Formulation</div>
                    <p class="theory-text" id="theoryDesc">
                        {domain_meta['theory_desc']}
                    </p>
                    <div class="math-card">
                        <div class="math-eq" id="lectureMathFormula">
                            {domain_meta['default_math']}
                        </div>
                    </div>
                </section>

                <!-- Interactive System Block Diagram -->
                <section class="card">
                    <div class="card-title">{domain_meta['block_diagram_title']}</div>
                    <p class="theory-text">
                        Click on each stage of the system architecture to inspect its governing equations, signal transformations, and operational parameters:
                    </p>
                    <div class="diagram-container" id="diagramContainer">
                        {domain_meta['diagram_nodes_html']}
                    </div>
                    <div class="diagram-info-panel">
                        <div class="diagram-info-title" id="diagramInfoTitle">{domain_meta['default_block_title']}</div>
                        <div class="diagram-info-desc" id="diagramInfoDesc">{domain_meta['default_block_desc']}</div>
                    </div>
                </section>

                <!-- Interactive Simulation Sandbox -->
                <section class="card">
                    <div class="card-title">⚡ {domain_meta['sandbox_title']}</div>
                    <p class="theory-text">
                        Adjust parameters in real time using the sliders below. Observe how state variables, trajectories, and dynamic responses evolve at 60 FPS:
                    </p>

                    <div class="sandbox-grid">
                        <div class="plot-container">
                            <canvas id="interactiveCanvas" width="800" height="360"></canvas>
                            <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                                <div style="font-size: 0.75rem; color: var(--text-muted);" id="canvasFootnote">Interactive HTML5 Canvas Vector Plot</div>
                                <div id="statusPillContainer">
                                    <span class="status-pill success" id="statusPill">&bull; Stable Operating Mode</span>
                                </div>
                            </div>
                        </div>

                        <div class="controls-panel">
                            <h4 style="font-family: 'Outfit', sans-serif; font-size: 0.95rem; margin-bottom: 14px; color: var(--color-teal); border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                                Parameter Controls
                            </h4>

                            <div class="control-group">
                                <label>{domain_meta['param1_name']}: <span id="valParam1" class="control-val">{domain_meta['param1_val']}</span></label>
                                <input type="range" id="sliderParam1" min="{domain_meta['param1_min']}" max="{domain_meta['param1_max']}" step="{domain_meta['param1_step']}" value="{domain_meta['param1_val']}" oninput="handleParamChange()">
                            </div>

                            <div class="control-group">
                                <label>{domain_meta['param2_name']}: <span id="valParam2" class="control-val">{domain_meta['param2_val']}</span></label>
                                <input type="range" id="sliderParam2" min="{domain_meta['param2_min']}" max="{domain_meta['param2_max']}" step="{domain_meta['param2_step']}" value="{domain_meta['param2_val']}" oninput="handleParamChange()">
                            </div>

                            <div class="control-group">
                                <label>{domain_meta['param3_name']}: <span id="valParam3" class="control-val">{domain_meta['param3_val']}</span></label>
                                <input type="range" id="sliderParam3" min="{domain_meta['param3_min']}" max="{domain_meta['param3_max']}" step="{domain_meta['param3_step']}" value="{domain_meta['param3_val']}" oninput="handleParamChange()">
                            </div>

                            <div style="display: flex; gap: 10px; margin-top: 18px;">
                                <button class="btn btn-primary" style="flex: 1; justify-content: center;" onclick="toggleAnimation()">▶ Run / Pause</button>
                                <button class="btn" style="flex: 1; justify-content: center;" onclick="resetSimulation()">Reset</button>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Interactive Lecture Checkpoint -->
                <section class="card">
                    <div class="card-title">🎯 Concept Checkpoint &amp; Self-Assessment</div>
                    <div class="accordion open">
                        <div class="accordion-header" onclick="toggleAccordion(this)">
                            <div class="accordion-title" id="checkpointQuestion">{domain_meta['checkpoint_q']}</div>
                            <div class="accordion-icon"></div>
                        </div>
                        <div class="accordion-content" id="checkpointBody">
                            <div class="options-grid" id="optionsContainer">
                                <button class="option-btn" onclick="checkAnswer(0)">A) {domain_meta['checkpoint_opts'][0]}</button>
                                <button class="option-btn" onclick="checkAnswer(1)">B) {domain_meta['checkpoint_opts'][1]}</button>
                                <button class="option-btn" onclick="checkAnswer(2)">C) {domain_meta['checkpoint_opts'][2]}</button>
                            </div>
                            <div class="feedback-alert" id="checkpointFeedback" style="display: none; margin-top: 14px;"></div>
                        </div>
                    </div>
                </section>

                <!-- References & Accreditation Mapping -->
                <section class="card">
                    <div class="card-title">📚 Recommended References &amp; NPTEL Alignment</div>
                    <ul class="theory-list">
                        <li><strong>Standard Textbook:</strong> {primary_tb}</li>
                        <li><strong>NPTEL / MOOC Alignment:</strong> {nptel_course}</li>
                        <li><strong>Outcome Alignment:</strong> Satisfies accredited engineering program outcomes with rigorous mathematical derivations and interactive verification.</li>
                    </ul>
                </section>
            </div>
        </main>
    </div>

    <script src="app.js"></script>
</body>
</html>"""
        return template

    def _get_domain_meta(self, category: str, code: str, name: str) -> Dict[str, Any]:
        if category in ["ml", "drl"]:
            return {
                "theory_desc": "Machine Learning models optimize parameter tensors \\(\\mathbf{w}\\) to minimize regularized risk over complex feature manifolds via gradient descent and convex/non-convex loss surfaces.",
                "default_math": "$$ \\min_{\\mathbf{w}} \\mathcal{L}(\\mathbf{w}) = \\frac{1}{N} \\sum_{i=1}^{N} \\ell(f(\\mathbf{x}_i; \\mathbf{w}), y_i) + \\frac{\\lambda}{2} \\|\\mathbf{w}\\|^2, \\quad \\mathbf{w}^{(t+1)} = \\mathbf{w}^{(t)} - \\eta \\nabla \\mathcal{L}(\\mathbf{w}^{(t)}) + \\beta (\\mathbf{w}^{(t)} - \\mathbf{w}^{(t-1)}) $$",
                "block_diagram_title": "Machine Learning Pipeline Architecture",
                "diagram_nodes_html": """
                    <div class="diagram-node active-block" onclick="selectBlock('data')">
                        <div class="node-title">1. Data Ingestion</div>
                        <div class="node-subtitle">Normalization &amp; Imputation</div>
                        <div class="node-status">Scaling [0, 1]</div>
                    </div>
                    <div class="diagram-arrow"><span>&rarr;</span></div>
                    <div class="diagram-node" onclick="selectBlock('forward')">
                        <div class="node-title">2. Forward Pass</div>
                        <div class="node-subtitle">Affine &amp; Non-linear Maps</div>
                        <div class="node-status">z = Wx + b</div>
                    </div>
                    <div class="diagram-arrow"><span>&rarr;</span></div>
                    <div class="diagram-node" onclick="selectBlock('loss')">
                        <div class="node-title">3. Loss Metric</div>
                        <div class="node-subtitle">Cross-Entropy / MSE</div>
                        <div class="node-status">Error J(W)</div>
                    </div>
                    <div class="diagram-arrow"><span>&rarr;</span></div>
                    <div class="diagram-node" onclick="selectBlock('backprop')">
                        <div class="node-title">4. Gradient Backprop</div>
                        <div class="node-subtitle">Jacobian &amp; Chain Rule</div>
                        <div class="node-status">&nabla;J(W)</div>
                    </div>
                    <div class="diagram-arrow"><span>&rarr;</span></div>
                    <div class="diagram-node" onclick="selectBlock('inference')">
                        <div class="node-title">5. Generalization</div>
                        <div class="node-subtitle">Decision Boundary</div>
                        <div class="node-status">Test AUC / F1</div>
                    </div>
                """,
                "default_block_title": "Forward Pass & Activation Dynamics",
                "default_block_desc": "In the forward pass, input vectors undergo affine transformations followed by non-linear activations (ReLU, Sigmoid, GELU). In linear/logistic models, this forms the separating hyperplane.",
                "sandbox_title": "Interactive Gradient Descent & Loss Contour Sandbox",
                "param1_name": "Learning Rate (\\(\\eta\\))", "param1_min": 0.01, "param1_max": 1.20, "param1_step": 0.02, "param1_val": 0.15,
                "param2_name": "Momentum Factor (\\(\\beta\\))", "param2_min": 0.0, "param2_max": 0.98, "param2_step": 0.02, "param2_val": 0.80,
                "param3_name": "Loss Surface Anisotropy (\\(\\gamma\\))", "param3_min": 1.0, "param3_max": 15.0, "param3_step": 0.5, "param3_val": 5.0,
                "checkpoint_q": "What phenomenon occurs when the learning rate exceeds the critical Lipschitz threshold (\\(\\eta > 2/L\\)) on a quadratic loss surface?",
                "checkpoint_opts": [
                    "The gradient updates diverge exponentially, oscillating away from the global optimum.",
                    "The optimizer converges strictly in a single iteration.",
                    "The model transitions into an underfitting regime without parameter changes."
                ]
            }

        elif category == "circuits":
            return {
                "theory_desc": "Electrical circuit dynamics are governed by Kirchhoff's laws and differential energy-storage dynamics in inductors (\\(v = L \\frac{di}{dt}\\)) and capacitors (\\(i = C \\frac{dv}{dt}\\)).",
                "default_math": "$$ L \\frac{d^2 i(t)}{dt^2} + R \\frac{di(t)}{dt} + \\frac{1}{C} i(t) = 0 \\implies s^2 + 2\\alpha s + \\omega_0^2 = 0, \\quad \\alpha = \\frac{R}{2L}, \\quad \\omega_0 = \\frac{1}{\\sqrt{LC}} $$",
                "block_diagram_title": "RLC Dynamic Circuit Architecture",
                "diagram_nodes_html": """
                    <div class="diagram-node active-block" onclick="selectBlock('source')">
                        <div class="node-title">1. Excitation Source</div>
                        <div class="node-subtitle">Step / AC Sinusoid</div>
                        <div class="node-status">V_in(t)</div>
                    </div>
                    <div class="diagram-arrow"><span>&rarr;</span></div>
                    <div class="diagram-node" onclick="selectBlock('inductor')">
                        <div class="node-title">2. Inductive Choke</div>
                        <div class="node-subtitle">Magnetic Storage</div>
                        <div class="node-status">E_L = 0.5 L I^2</div>
                    </div>
                    <div class="diagram-arrow"><span>&rarr;</span></div>
                    <div class="diagram-node" onclick="selectBlock('resistor')">
                        <div class="node-title">3. Damping Resistor</div>
                        <div class="node-subtitle">Ohmic Dissipation</div>
                        <div class="node-status">P = I^2 R</div>
                    </div>
                    <div class="diagram-arrow"><span>&rarr;</span></div>
                    <div class="diagram-node" onclick="selectBlock('capacitor')">
                        <div class="node-title">4. Capacitive Tank</div>
                        <div class="node-subtitle">Electrostatic Storage</div>
                        <div class="node-status">E_C = 0.5 C V^2</div>
                    </div>
                    <div class="diagram-arrow"><span>&rarr;</span></div>
                    <div class="diagram-node" onclick="selectBlock('output')">
                        <div class="node-title">5. Terminal Load</div>
                        <div class="node-subtitle">Impedance Match</div>
                        <div class="node-status">Z_L = R + jX</div>
                    </div>
                """,
                "default_block_title": "Inductive Choke & Energy Oscillation",
                "default_block_desc": "The inductor stores magnetic energy and opposes sudden changes in current, establishing energy exchange with the capacitor that produces transient damped oscillations.",
                "sandbox_title": "Interactive RLC Transient Response & Damping Sandbox",
                "param1_name": "Damping Resistance (\\(R\\)) [\\(\\Omega\\)]", "param1_min": 1, "param1_max": 300, "param1_step": 2, "param1_val": 25,
                "param2_name": "Inductance (\\(L\\)) [mH]", "param2_min": 5, "param2_max": 200, "param2_step": 5, "param2_val": 50,
                "param3_name": "Capacitance (\\(C\\)) [\\(\\mu\\)F]", "param3_min": 1, "param3_max": 100, "param3_step": 1, "param3_val": 20,
                "checkpoint_q": "What damping condition is established when \\(R = 2\\sqrt{L/C}\\)?",
                "checkpoint_opts": [
                    "Critically Damped (\\(\\zeta = 1\\)), returning to steady state in minimal time without oscillation.",
                    "Underdamped (\\(\\zeta < 1\\)), exhibiting sustained high-frequency ringing.",
                    "Overdamped (\\(\\zeta > 1\\)), with two complex conjugate s-plane poles."
                ]
            }

        elif category == "control":
            return {
                "theory_desc": "Feedback control systems stabilize dynamic plants by shaping closed-loop pole locations in the complex s-plane to achieve fast transient response and zero steady-state error.",
                "default_math": "$$ T(s) = \\frac{C(s)G(s)}{1 + C(s)G(s)H(s)} = \\frac{\\omega_n^2}{s^2 + 2\\zeta\\omega_n s + \\omega_n^2}, \\quad M_p = e^{-\\frac{\\pi\\zeta}{\\sqrt{1-\\zeta^2}}} \\times 100\\%, \\quad t_s \\approx \\frac{4}{\\zeta\\omega_n} $$",
                "block_diagram_title": "Closed-Loop Feedback Control System",
                "diagram_nodes_html": """
                    <div class="diagram-node active-block" onclick="selectBlock('ref')">
                        <div class="node-title">1. Reference Input</div>
                        <div class="node-subtitle">Set-Point R(s)</div>
                        <div class="node-status">Command</div>
                    </div>
                    <div class="diagram-arrow"><span>&rarr;</span></div>
                    <div class="diagram-node" onclick="selectBlock('sum')">
                        <div class="node-title">2. Summing Junction</div>
                        <div class="node-subtitle">Error E(s) = R - B</div>
                        <div class="node-status">Comparator</div>
                    </div>
                    <div class="diagram-arrow"><span>&rarr;</span></div>
                    <div class="diagram-node" onclick="selectBlock('controller')">
                        <div class="node-title">3. PID Controller</div>
                        <div class="node-subtitle">C(s) = Kp + Ki/s + Kd s</div>
                        <div class="node-status">Compensation</div>
                    </div>
                    <div class="diagram-arrow"><span>&rarr;</span></div>
                    <div class="diagram-node" onclick="selectBlock('plant')">
                        <div class="node-title">4. Physical Plant</div>
                        <div class="node-subtitle">Actuator &amp; Dynamics</div>
                        <div class="node-status">G(s) Transfer</div>
                    </div>
                    <div class="diagram-arrow"><span>&rarr;</span></div>
                    <div class="diagram-node" onclick="selectBlock('sensor')">
                        <div class="node-title">5. Feedback Sensor</div>
                        <div class="node-subtitle">Measurement H(s)</div>
                        <div class="node-status">Output Y(s)</div>
                    </div>
                """,
                "default_block_title": "PID Controller Compensation",
                "default_block_desc": "Proportional gain speeds up response, Integral action eliminates steady-state error, and Derivative action adds phase lead to dampen transient overshoot.",
                "sandbox_title": "Interactive S-Plane Root Locus & Step Response Sandbox",
                "param1_name": "Damping Ratio (\\(\\zeta\\))", "param1_min": 0.05, "param1_max": 2.00, "param1_step": 0.05, "param1_val": 0.45,
                "param2_name": "Natural Frequency (\\(\\omega_n\\)) [rad/s]", "param2_min": 1.0, "param2_max": 15.0, "param2_step": 0.5, "param2_val": 4.0,
                "param3_name": "Proportional Loop Gain (\\(K\\))", "param3_min": 0.5, "param3_max": 30.0, "param3_step": 0.5, "param3_val": 8.0,
                "checkpoint_q": "How does increasing the damping ratio \\(\\zeta\\) from 0.2 to 0.8 affect closed-loop peak overshoot and transient oscillation?",
                "checkpoint_opts": [
                    "Peak overshoot drops dramatically and oscillations decay much faster.",
                    "Overshoot increases exponentially toward instability.",
                    "Settling time diverges toward infinity."
                ]
            }

        elif category in ["power_electronics", "machines"]:
            return {
                "theory_desc": "Power Electronics converters modulate high-frequency semiconductor switches (MOSFETs/IGBTs) with inductive-capacitive filters to achieve high-efficiency DC-DC and DC-AC energy conversion.",
                "default_math": "$$ V_o = \\frac{V_{in}}{1 - D} \\quad \\text{(Boost)}, \\quad V_o = D V_{in} \\quad \\text{(Buck)}, \\quad \\Delta I_L = \\frac{V_{in} D}{L f_{sw}}, \\quad \\text{THD} = \\frac{\\sqrt{\\sum_{n=2}^{\\infty} V_n^2}}{V_1} $$",
                "block_diagram_title": "Switched-Mode Converter Architecture",
                "diagram_nodes_html": """
                    <div class="diagram-node active-block" onclick="selectBlock('dc_in')">
                        <div class="node-title">1. DC Bus Input</div>
                        <div class="node-subtitle">Unregulated Voltage</div>
                        <div class="node-status">V_in</div>
                    </div>
                    <div class="diagram-arrow"><span>&rarr;</span></div>
                    <div class="diagram-node" onclick="selectBlock('pwm_switch')">
                        <div class="node-title">2. PWM Switch</div>
                        <div class="node-subtitle">MOSFET / IGBT</div>
                        <div class="node-status">f_sw Switching</div>
                    </div>
                    <div class="diagram-arrow"><span>&rarr;</span></div>
                    <div class="diagram-node" onclick="selectBlock('inductor_tank')">
                        <div class="node-title">3. Power Inductor</div>
                        <div class="node-subtitle">Energy Transfer</div>
                        <div class="node-status">CCM/DCM Current</div>
                    </div>
                    <div class="diagram-arrow"><span>&rarr;</span></div>
                    <div class="diagram-node" onclick="selectBlock('freewheel')">
                        <div class="node-title">4. Freewheeling Diode</div>
                        <div class="node-subtitle">Current Continuity</div>
                        <div class="node-status">Fast Recovery</div>
                    </div>
                    <div class="diagram-arrow"><span>&rarr;</span></div>
                    <div class="diagram-node" onclick="selectBlock('filt_out')">
                        <div class="node-title">5. Filtered Output</div>
                        <div class="node-subtitle">Regulated DC Rail</div>
                        <div class="node-status">V_o &plusmn; &Delta;V</div>
                    </div>
                """,
                "default_block_title": "PWM Switching & Inductor Ripple",
                "default_block_desc": "During switch conduction, inductor current ramps up storing magnetic energy; upon turn-off, the freewheeling diode conducts, delivering energy to the capacitor and load.",
                "sandbox_title": "Interactive DC-DC Converter & PWM Ripple Sandbox",
                "param1_name": "Duty Cycle (\\(D\\))", "param1_min": 0.05, "param1_max": 0.95, "param1_step": 0.02, "param1_val": 0.50,
                "param2_name": "Switching Frequency (\\(f_{sw}\\)) [kHz]", "param2_min": 10, "param2_max": 200, "param2_step": 5, "param2_val": 50,
                "param3_name": "Inductance (\\(L\\)) [\\(\\mu\\)H]", "param3_min": 20, "param3_max": 500, "param3_step": 10, "param3_val": 150,
                "checkpoint_q": "What happens to the inductor ripple current \\(\\Delta I_L\\) when the switching frequency \\(f_{sw}\\) is doubled while duty cycle and inductance remain constant?",
                "checkpoint_opts": [
                    "The current ripple is halved (\\(\\Delta I_L / 2\\)), improving power quality.",
                    "The current ripple doubles, causing core saturation.",
                    "The ripple remains strictly unchanged."
                ]
            }

        else: # Universal engineering
            return {
                "theory_desc": "Engineering system modeling utilizes state equations, dynamic transfer operators, and sensitivity derivatives to evaluate optimal performance under real-world operating constraints.",
                "default_math": "$$ \\dot{\\mathbf{x}}(t) = \\mathbf{A}\\mathbf{x}(t) + \\mathbf{B}\\mathbf{u}(t), \\quad \\mathbf{y}(t) = \\mathbf{C}\\mathbf{x}(t) + \\mathbf{D}\\mathbf{u}(t), \\quad \\min_{\\mathbf{u}} J = \\int_0^T (\\mathbf{x}^T \\mathbf{Q} \\mathbf{x} + \\mathbf{u}^T \\mathbf{R} \\mathbf{u}) dt $$",
                "block_diagram_title": "General Engineering System Architecture",
                "diagram_nodes_html": """
                    <div class="diagram-node active-block" onclick="selectBlock('input')">
                        <div class="node-title">1. Input Vector</div>
                        <div class="node-subtitle">Operating Setpoint</div>
                        <div class="node-status">u(t)</div>
                    </div>
                    <div class="diagram-arrow"><span>&rarr;</span></div>
                    <div class="diagram-node" onclick="selectBlock('model')">
                        <div class="node-title">2. State Operator</div>
                        <div class="node-subtitle">Dynamic Equations</div>
                        <div class="node-status">dx/dt = Ax + Bu</div>
                    </div>
                    <div class="diagram-arrow"><span>&rarr;</span></div>
                    <div class="diagram-node" onclick="selectBlock('optim')">
                        <div class="node-title">3. Optimization</div>
                        <div class="node-subtitle">Cost Minimization</div>
                        <div class="node-status">Objective J</div>
                    </div>
                    <div class="diagram-arrow"><span>&rarr;</span></div>
                    <div class="diagram-node" onclick="selectBlock('feedback')">
                        <div class="node-title">4. Sensitivity Analysis</div>
                        <div class="node-subtitle">Gradient &amp; Tolerance</div>
                        <div class="node-status">&part;J / &part;&theta;</div>
                    </div>
                    <div class="diagram-arrow"><span>&rarr;</span></div>
                    <div class="diagram-node" onclick="selectBlock('output')">
                        <div class="node-title">5. Optimum State</div>
                        <div class="node-subtitle">System Response</div>
                        <div class="node-status">y(t)</div>
                    </div>
                """,
                "default_block_title": "State Operator & Dynamic Formulation",
                "default_block_desc": "State-space equations provide a comprehensive time-domain representation of linear and non-linear systems, tracking internal energy coordinates.",
                "sandbox_title": "Interactive System Trajectory & Optimization Sandbox",
                "param1_name": "System Damping / Parameter (\\(\\alpha\\))", "param1_min": 0.05, "param1_max": 2.00, "param1_step": 0.05, "param1_val": 0.50,
                "param2_name": "Operating Frequency / Scale (\\(\\omega\\))", "param2_min": 0.5, "param2_max": 10.0, "param2_step": 0.5, "param2_val": 2.5,
                "param3_name": "Coupling Coefficient (\\(k\\))", "param3_min": 0.1, "param3_max": 5.0, "param3_step": 0.1, "param3_val": 1.0,
                "checkpoint_q": "In state-space system dynamics, an LTI system is asymptotically stable if and only if:",
                "checkpoint_opts": [
                    "All eigenvalues of the system matrix A have strictly negative real parts.",
                    "At least one eigenvalue lies in the right-half complex plane.",
                    "The feedthrough matrix D is zero."
                ]
            }

    def _build_css(self) -> str:
        return """/* Reset & Base Styles — Styled directly after spkkarri/DSP-Course */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap');

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --bg-dark: #090d16;
    --panel-dark: rgba(17, 24, 39, 0.85);
    --border-color: rgba(255, 255, 255, 0.08);
    --border-hover: rgba(255, 255, 255, 0.15);
    
    --color-primary: #6366f1;
    --color-primary-grad: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    --color-teal: #0dd5c5;
    --color-teal-grad: linear-gradient(135deg, #0dd5c5 0%, #00b4d8 100%);
    --color-danger: #ef4444;
    --color-danger-grad: linear-gradient(135deg, #ef4444 0%, #f43f5e 100%);
    --color-success: #10b981;
    
    --text-main: #f3f4f6;
    --text-muted: #9ca3af;
    --text-dim: #6b7280;
    
    --sidebar-width: 320px;
    --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

body {
    background-color: var(--bg-dark);
    color: var(--text-main);
    font-family: 'Inter', sans-serif;
    min-height: 100vh;
    display: flex;
    overflow: hidden;
}

::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
}
::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
}

.app-container {
    display: flex;
    width: 100vw;
    height: 100vh;
}

.sidebar {
    width: var(--sidebar-width);
    background-color: rgba(13, 18, 30, 0.95);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    z-index: 10;
}

.sidebar-header {
    padding: 24px;
    border-bottom: 1px solid var(--border-color);
}

.sidebar-header h1 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.2rem;
    font-weight: 800;
    background: var(--color-teal-grad);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: 0.5px;
    line-height: 1.3;
}

.sidebar-header p {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 4px;
}

.lecture-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px 12px;
}

.unit-section {
    margin-bottom: 20px;
}

.unit-title {
    font-family: 'Outfit', sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 8px;
    padding-left: 8px;
    letter-spacing: 1px;
}

.lecture-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: var(--transition-smooth);
    margin-bottom: 4px;
    border: 1px solid transparent;
}

.lecture-item:hover {
    background-color: rgba(255, 255, 255, 0.03);
    border-color: var(--border-color);
}

.lecture-item.active {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.4);
    color: var(--text-main);
}

.lecture-num {
    font-family: 'Outfit', sans-serif;
    font-weight: 700;
    font-size: 0.85rem;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.05);
    margin-right: 12px;
    color: var(--text-muted);
    flex-shrink: 0;
}

.lecture-item.active .lecture-num {
    background: var(--color-primary-grad);
    color: white;
}

.lecture-info {
    flex: 1;
    min-width: 0;
}

.lecture-title {
    font-size: 0.82rem;
    font-weight: 600;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.lecture-meta {
    font-size: 0.7rem;
    color: var(--text-dim);
    margin-top: 2px;
}

.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow-y: auto;
    background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.08) 0%, rgba(9, 13, 22, 1) 60%);
}

.main-header {
    padding: 18px 36px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: rgba(9, 13, 22, 0.8);
    backdrop-filter: blur(10px);
    position: sticky;
    top: 0;
    z-index: 5;
}

.header-title h2 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
}

.header-title p {
    font-size: 0.82rem;
    color: var(--text-muted);
    margin-top: 2px;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.btn {
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color);
    color: var(--text-main);
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition-smooth);
    display: flex;
    align-items: center;
    gap: 8px;
}

.btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: var(--border-hover);
}

.btn-primary {
    background: var(--color-primary-grad);
    border: none;
    color: white;
}

.btn-primary:hover {
    box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
    opacity: 0.95;
}

.content-wrapper {
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    padding: 32px 36px;
}

.card {
    background: var(--panel-dark);
    backdrop-filter: blur(16px);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    transition: var(--transition-smooth);
}

.card:hover {
    border-color: var(--border-hover);
}

.card-title {
    font-family: 'Outfit', sans-serif;
    font-size: 1.15rem;
    font-weight: 600;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.card-title::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 18px;
    background: var(--color-teal-grad);
    border-radius: 2px;
}

.theory-text {
    font-size: 0.9rem;
    color: var(--text-muted);
    line-height: 1.6;
    margin-bottom: 12px;
}

ul.theory-list {
    margin-left: 20px;
    margin-bottom: 15px;
}

ul.theory-list li {
    font-size: 0.88rem;
    color: var(--text-muted);
    line-height: 1.6;
    margin-bottom: 6px;
}

strong {
    color: var(--text-main);
}

.math-card {
    background: rgba(0, 0, 0, 0.25);
    border-left: 3px solid var(--color-primary);
    padding: 14px 18px;
    border-radius: 0 8px 8px 0;
    margin: 14px 0;
    overflow-x: auto;
}

.math-eq {
    text-align: center;
    font-size: 1.05rem;
    color: var(--text-main);
}

.diagram-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    border: 1px dashed var(--border-color);
    margin-top: 15px;
    flex-wrap: wrap;
    gap: 12px;
}

.diagram-node {
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 12px 16px;
    text-align: center;
    flex: 1;
    min-width: 140px;
    position: relative;
    cursor: pointer;
    transition: var(--transition-smooth);
}

.diagram-node:hover {
    border-color: var(--color-teal);
    box-shadow: 0 0 12px rgba(13, 213, 197, 0.2);
    transform: translateY(-2px);
}

.diagram-node.active-block {
    border-color: var(--color-primary);
    box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
}

.node-title {
    font-family: 'Outfit', sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-main);
}

.node-subtitle {
    font-size: 0.7rem;
    color: var(--text-dim);
    margin-top: 2px;
}

.node-status {
    font-size: 0.65rem;
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 6px;
    border-radius: 10px;
    display: inline-block;
    margin-top: 8px;
    color: var(--text-muted);
}

.diagram-arrow {
    color: var(--color-teal);
    font-weight: 700;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 1.1rem;
}

.diagram-info-panel {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    border: 1px solid var(--border-color);
    padding: 16px;
    margin-top: 15px;
    min-height: 70px;
}

.diagram-info-title {
    font-family: 'Outfit', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-teal);
    margin-bottom: 4px;
}

.diagram-info-desc {
    font-size: 0.85rem;
    color: var(--text-muted);
    line-height: 1.5;
}

.sandbox-grid {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 20px;
    align-items: start;
}

@media (max-width: 900px) {
    .sandbox-grid {
        grid-template-columns: 1fr;
    }
}

.plot-container {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 12px;
    border: 1px solid var(--border-color);
    padding: 14px;
    position: relative;
}

canvas {
    width: 100%;
    height: 350px;
    display: block;
    border-radius: 8px;
}

.controls-panel {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 18px;
}

.control-group {
    margin-bottom: 16px;
}

.control-group label {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-bottom: 6px;
    font-weight: 500;
}

.control-val {
    font-family: 'Fira Code', monospace;
    color: var(--color-teal);
    font-weight: 600;
}

input[type="range"] {
    -webkit-appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.1);
    outline: none;
}

input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: pointer;
    transition: var(--transition-smooth);
}

input[type="range"]::-webkit-slider-thumb:hover {
    background: var(--color-teal);
    box-shadow: 0 0 10px var(--color-teal);
}

.status-pill {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.status-pill.success {
    background-color: rgba(16, 185, 129, 0.15);
    color: var(--color-success);
    border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-pill.danger {
    background-color: rgba(239, 68, 68, 0.15);
    color: var(--color-danger);
    border: 1px solid rgba(239, 68, 68, 0.3);
}

.status-pill.warning {
    background-color: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.3);
}

.accordion {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 12px;
}

.accordion-header {
    background: rgba(255, 255, 255, 0.02);
    padding: 14px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: var(--transition-smooth);
}

.accordion-header:hover {
    background: rgba(255, 255, 255, 0.04);
}

.accordion-title {
    font-size: 0.92rem;
    font-weight: 600;
}

.accordion-content {
    background: rgba(0, 0, 0, 0.15);
    padding: 18px 20px;
    border-top: 1px solid var(--border-color);
    font-size: 0.85rem;
    color: var(--text-muted);
    line-height: 1.5;
}

.options-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.option-btn {
    text-align: left;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-color);
    color: var(--text-main);
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: var(--transition-smooth);
}

.option-btn:hover {
    border-color: var(--color-teal);
    background: rgba(13, 213, 197, 0.05);
}

.feedback-alert {
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 0.85rem;
    line-height: 1.4;
}

.feedback-correct {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid var(--color-success);
    color: #34d399;
}

.feedback-wrong {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid var(--color-danger);
    color: #f87171;
}
"""

    def _build_js(self, code: str, name: str, lectures: List[Dict[str, Any]], category: str) -> str:
        lecs_json = json.dumps(lectures)
        return f"""// {code}: {name} - High-Fidelity Interactive Learning Engine
// Styled and engineered after spkkarri/DSP-Course standard
const lecturesData = {lecs_json};
const courseCategory = "{category}";
let currentLecIndex = 0;
let isAnimating = true;
let animFrameId = null;
let simTime = 0;

document.addEventListener('DOMContentLoaded', () => {{
    loadLecture(1);
    initSimulator();
    if (window.renderMathInElement) {{
        renderMathInElement(document.body, {{
            delimiters: [
                {{ left: "$$", right: "$$", display: true }},
                {{ left: "$", right: "$", display: false }},
                {{ left: "\\\\(", right: "\\\\)", display: false }},
                {{ left: "\\\\[", right: "\\\\]", display: true }}
            ]
        }});
    }}
}});

function loadLecture(num) {{
    const idx = lecturesData.findIndex(l => l.num === num);
    if (idx === -1) return;
    currentLecIndex = idx;
    const lec = lecturesData[idx];

    // Update active lecture in sidebar
    document.querySelectorAll('.lecture-item').forEach(item => {{
        item.classList.toggle('active', parseInt(item.getAttribute('data-lecture')) === num);
    }});

    // Update Header
    document.getElementById('currentLecBadge').innerText = `Lecture ${{lec.num}}: ${{lec.title}}`;
    document.getElementById('bloomBadge').innerText = lec.bloom || 'L3_APPLY';
    document.getElementById('lectureSubtopics').innerHTML = `<strong>Module:</strong> ${{lec.module}} &bull; <strong>Topics:</strong> ${{lec.subtopics || 'Foundational Principles'}}`;

    // Reset Checkpoint feedback
    const fb = document.getElementById('checkpointFeedback');
    if (fb) fb.style.display = 'none';

    // Rerender KaTeX if applicable
    if (window.renderMathInElement) {{
        renderMathInElement(document.getElementById('theoryDesc'));
    }}
}}

function nextLecture() {{
    if (currentLecIndex < lecturesData.length - 1) {{
        loadLecture(lecturesData[currentLecIndex + 1].num);
    }}
}}

function prevLecture() {{
    if (currentLecIndex > 0) {{
        loadLecture(lecturesData[currentLecIndex - 1].num);
    }}
}}

function toggleAccordion(el) {{
    const acc = el.parentElement;
    acc.classList.toggle('open');
}}

// Block Diagram interactive inspection
const blockDetails = {{
    data: {{ title: "Data Preprocessing & Feature Pipeline", desc: "Performs standard scaling \\\\(z = (x - \\\\mu)/\\\\sigma\\\\), missing value imputation, and feature extraction to condition the input manifold." }},
    forward: {{ title: "Forward Activation & Affine Maps", desc: "Computes affine transformation \\\\(z = Wx + b\\\\) followed by elementwise non-linear activations (ReLU, Sigmoid) to project into latent space." }},
    loss: {{ title: "Objective Function / Empirical Risk", desc: "Measures discrepancy between predictions and ground-truth using convex MSE or Cross-Entropy \\\\(\\\\mathcal{{L}} = -\\\\sum y \\\\log \\\\hat{{y}}\\\\)." }},
    backprop: {{ title: "Gradient Backpropagation", desc: "Applies the chain rule recursively through computational graph tensors to calculate parameter partial derivatives \\\\(\\\\frac{{\\\\partial \\\\mathcal{{L}}}}{{\\\\partial W}}\\\\)." }},
    inference: {{ title: "Model Inference & Decision Boundary", desc: "Projects final separating hyperplanes or regression surfaces across the validation feature manifold with bounded confidence." }},
    source: {{ title: "Continuous AC/DC Signal Source", desc: "Delivers energetic excitation \\\\(v_{{in}}(t) = V_m \\\\sin(\\\\omega t)\\\\) or transient step input into the connected reactive network." }},
    inductor: {{ title: "Inductive Choke Storage", desc: "Stores kinetic magnetic energy \\\\(E_L = \\\\frac{{1}}{{2}} L I^2\\\\) and opposes instantaneous current variations via Lenz's law." }},
    resistor: {{ title: "Damping Resistor", desc: "Dissipates circuit energy thermally via Joule heating \\\\(P = I^2 R\\\\), providing exponential transient damping \\\\(e^{{-\\\\alpha t}}\\\\)." }},
    capacitor: {{ title: "Capacitive Storage Tank", desc: "Stores electrostatic potential energy \\\\(E_C = \\\\frac{{1}}{{2}} C V^2\\\\) and buffers charge to establish resonance frequency." }},
    output: {{ title: "Terminal Load & Matching", desc: "Receives filtered electrical power; achieves maximum power transfer when load matches Thevenin impedance \\\\(R_L = R_{{th}}\\\\)." }}
}};

function selectBlock(key) {{
    document.querySelectorAll('.diagram-node').forEach(node => node.classList.remove('active-block'));
    if (event && event.currentTarget) {{
        event.currentTarget.classList.add('active-block');
    }}
    const detail = blockDetails[key] || {{ title: "System Component", desc: "Operational stage contributing to closed-loop dynamics." }};
    document.getElementById('diagramInfoTitle').innerText = detail.title;
    document.getElementById('diagramInfoDesc').innerText = detail.desc;
    if (window.renderMathInElement) {{
        renderMathInElement(document.getElementById('diagramInfoDesc'));
    }}
}}

// Canvas Simulation Engine
const canvas = document.getElementById('interactiveCanvas');
const ctx = canvas.getContext('2d');

function initSimulator() {{
    handleParamChange();
    startLoop();
}}

function startLoop() {{
    if (animFrameId) cancelAnimationFrame(animFrameId);
    function loop() {{
        if (isAnimating) {{
            simTime += 0.03;
        }}
        renderSimulation();
        animFrameId = requestAnimationFrame(loop);
    }}
    animFrameId = requestAnimationFrame(loop);
}}

function toggleAnimation() {{
    isAnimating = !isAnimating;
}}

function resetSimulation() {{
    simTime = 0;
    handleParamChange();
}}

function handleParamChange() {{
    const p1 = parseFloat(document.getElementById('sliderParam1').value);
    const p2 = parseFloat(document.getElementById('sliderParam2').value);
    const p3 = parseFloat(document.getElementById('sliderParam3').value);

    document.getElementById('valParam1').innerText = p1.toFixed(2);
    document.getElementById('valParam2').innerText = p2.toFixed(2);
    document.getElementById('valParam3').innerText = p3.toFixed(2);

    updateStatusPill(p1, p2, p3);
}}

function updateStatusPill(p1, p2, p3) {{
    const pill = document.getElementById('statusPill');
    if (!pill) return;

    if (courseCategory === "ml" || courseCategory === "drl") {{
        if (p1 > 0.85) {{
            pill.className = "status-pill danger";
            pill.innerHTML = "&bull; Divergence / Exploding Gradient";
        }} else if (p1 < 0.04) {{
            pill.className = "status-pill warning";
            pill.innerHTML = "&bull; Vanishing / Stalled Step";
        }} else {{
            pill.className = "status-pill success";
            pill.innerHTML = "&bull; Optimal Gradient Descent";
        }}
    }} else if (courseCategory === "circuits") {{
        const R = p1, L = p2 * 1e-3, C = p3 * 1e-6;
        const alpha = R / (2 * L);
        const w0 = 1 / Math.sqrt(L * C);
        const zeta = alpha / w0;
        if (zeta < 0.95) {{
            pill.className = "status-pill warning";
            pill.innerHTML = `&bull; Underdamped (&zeta; = ${{zeta.toFixed(2)}})`;
        }} else if (zeta > 1.05) {{
            pill.className = "status-pill success";
            pill.innerHTML = `&bull; Overdamped (&zeta; = ${{zeta.toFixed(2)}})`;
        }} else {{
            pill.className = "status-pill success";
            pill.innerHTML = "&bull; Critically Damped (&zeta; &approx; 1.00)";
        }}
    }} else if (courseCategory === "control") {{
        const zeta = p1, wn = p2, K = p3;
        if (zeta < 0.2 || K > 25) {{
            pill.className = "status-pill danger";
            pill.innerHTML = "&bull; High Overshoot &gt; 50%";
        }} else if (zeta > 1.1) {{
            pill.className = "status-pill warning";
            pill.innerHTML = "&bull; Sluggish Overdamped";
        }} else {{
            pill.className = "status-pill success";
            pill.innerHTML = `&bull; Optimal Response (&zeta; = ${{zeta.toFixed(2)}})`;
        }}
    }} else if (courseCategory === "power_electronics" || courseCategory === "machines") {{
        const D = p1, fsw = p2;
        if (D > 0.85) {{
            pill.className = "status-pill warning";
            pill.innerHTML = "&bull; High Duty Saturation Warning";
        }} else if (fsw < 25) {{
            pill.className = "status-pill danger";
            pill.innerHTML = "&bull; High Inductor Ripple &Delta;I_L";
        }} else {{
            pill.className = "status-pill success";
            pill.innerHTML = "&bull; Safe CCM Operation";
        }}
    }} else {{
        pill.className = "status-pill success";
        pill.innerHTML = "&bull; Stable LTI Trajectory";
    }}
}}

function drawGrid(w, h) {{
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {{
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }}
    for (let y = 0; y < h; y += 30) {{
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }}
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); ctx.stroke();
}}

function renderSimulation() {{
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    drawGrid(w, h);

    const p1 = parseFloat(document.getElementById('sliderParam1').value);
    const p2 = parseFloat(document.getElementById('sliderParam2').value);
    const p3 = parseFloat(document.getElementById('sliderParam3').value);

    if (courseCategory === "ml" || courseCategory === "drl") {{
        const cx = w/2, cy = h/2;
        const gamma = p3;
        
        ctx.lineWidth = 1.2;
        for (let r = 25; r <= 140; r += 25) {{
            ctx.strokeStyle = `rgba(99, 102, 241, ${{0.15 + r/300}})`;
            ctx.beginPath();
            ctx.ellipse(cx, cy, r * (1 + gamma * 0.1), r * 0.8, -0.2, 0, Math.PI * 2);
            ctx.stroke();
        }}

        const lr = p1;
        const momentum = p2;
        let x = cx - 180;
        let y = cy - 90;
        let vx = 0, vy = 0;

        ctx.strokeStyle = "#0dd5c5";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x, y);

        const steps = 18;
        for (let i = 0; i < steps; i++) {{
            const gx = (x - cx) * 0.12;
            const gy = (y - cy) * 0.12 * gamma * 0.4;
            vx = momentum * vx - lr * gx;
            vy = momentum * vy - lr * gy;
            x += vx + Math.sin(simTime + i) * 1.5;
            y += vy + Math.cos(simTime + i) * 1.5;
            ctx.lineTo(x, y);

            ctx.fillStyle = i === steps - 1 ? "#ef4444" : "#0dd5c5";
            ctx.beginPath();
            ctx.arc(x, y, i === steps - 1 ? 5 : 3, 0, Math.PI * 2);
            ctx.fill();
        }}
        ctx.stroke();

        ctx.fillStyle = "#f3f4f6";
        ctx.font = "12px 'Fira Code', monospace";
        ctx.fillText(`Global Optimum W*=(0,0)  |  Loss J = ${{Math.max(0.01, 1.2 / (1 + p1 * 5)).toFixed(3)}}`, 20, 26);

    }} else if (courseCategory === "circuits") {{
        const R = p1, L = p2 * 1e-3, C = p3 * 1e-6;
        const alpha = R / (2 * L);
        const w0 = 1 / Math.sqrt(L * C);
        const zeta = alpha / w0;
        const wd = w0 * Math.sqrt(Math.max(0, 1 - zeta * zeta));

        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        for (let px = 0; px < w; px++) {{
            const t = (px / w) * 0.02;
            let v = 0;
            if (zeta < 1.0) {{
                v = 100 * Math.exp(-alpha * t) * Math.cos(wd * t - simTime * 5);
            }} else {{
                v = 100 * Math.exp(-alpha * t);
            }}
            const py = (h/2) - v;
            if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }}
        ctx.stroke();

        ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (let px = 0; px < w; px++) {{
            const t = (px / w) * 0.02;
            const env = 100 * Math.exp(-alpha * t);
            const py = (h/2) - env;
            if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }}
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#0dd5c5";
        ctx.font = "12px 'Fira Code', monospace";
        ctx.fillText(`w0 = ${{w0.toFixed(0)}} rad/s  |  zeta = ${{zeta.toFixed(2)}}  |  alpha = ${{alpha.toFixed(0)}} Np/s`, 20, 26);

    }} else if (courseCategory === "control") {{
        const zeta = p1, wn = p2;
        const wd = wn * Math.sqrt(Math.max(0, 1 - zeta * zeta));
        const phi = Math.atan2(Math.sqrt(Math.max(0, 1 - zeta * zeta)), zeta);

        ctx.strokeStyle = "#0dd5c5";
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        for (let px = 0; px < w; px++) {{
            const t = (px / w) * 5.0;
            let y = 1.0;
            if (zeta < 1.0) {{
                y = 1.0 - (Math.exp(-zeta * wn * t) / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t + phi);
            }} else {{
                y = 1.0 - Math.exp(-zeta * wn * t) * (1 + wn * t);
            }}
            const py = (h - 60) - y * 180;
            if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }}
        ctx.stroke();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(0, (h - 60) - 180);
        ctx.lineTo(w, (h - 60) - 180);
        ctx.stroke();
        ctx.setLineDash([]);

        const Mp = zeta < 1.0 ? Math.exp(-Math.PI * zeta / Math.sqrt(1 - zeta * zeta)) * 100 : 0;
        const ts = 4.0 / (zeta * wn);

        ctx.fillStyle = "#f3f4f6";
        ctx.font = "12px 'Fira Code', monospace";
        ctx.fillText(`Overshoot Mp = ${{Mp.toFixed(1)}}%  |  Settling ts = ${{ts.toFixed(2)}}s  |  wn = ${{wn.toFixed(1)}} rad/s`, 20, 26);

    }} else {{
        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let px = 0; px < w; px++) {{
            const t = (px / w) * 6 * Math.PI;
            const yVal = (h/2) + Math.sin(t * p2 * 0.2 + simTime) * 80 * Math.exp(-p1 * 0.1 * (px / w * 5));
            if (px === 0) ctx.moveTo(px, yVal); else ctx.lineTo(px, yVal);
        }}
        ctx.stroke();

        ctx.fillStyle = "#0dd5c5";
        ctx.font = "12px 'Fira Code', monospace";
        ctx.fillText(`State Vector Dynamic x(t)  |  Damping = ${{p1.toFixed(2)}}  |  Freq = ${{p2.toFixed(2)}}`, 20, 26);
    }}
}}

function checkAnswer(chosenIdx) {{
    const fb = document.getElementById('checkpointFeedback');
    fb.style.display = 'block';
    if (chosenIdx === 0) {{
        fb.className = 'feedback-alert feedback-correct';
        fb.innerHTML = '<strong>✓ Correct!</strong> Outstanding analysis. Your answer perfectly matches the foundational engineering criterion.';
    }} else {{
        fb.className = 'feedback-alert feedback-wrong';
        fb.innerHTML = '<strong>✗ Incorrect.</strong> Review the governing equations and parameter relationships above before re-attempting.';
    }}
}}
'''

# 1. Update the agent file
agent_path = 'course_bootstrap/agents/interactive_demo_agent.py'
with open(agent_path, 'w', encoding='utf-8') as f:
    f.write(AGENT_CODE)
print(f"Updated {agent_path}")

# 2. Instantiate and batch-upgrade courses
from course_bootstrap.agents.interactive_demo_agent import InteractiveDemoAgent
agent = InteractiveDemoAgent()

updated_count = 0
for syl_path in sorted(glob.glob('course_bootstrap/*/syllabus.csv')):
    course_dir = os.path.dirname(syl_path)
    code = os.path.basename(course_dir)
    
    # Don't overwrite EE3621 because EE3621 has the complete 30-lecture master repository directly from spkkarri/DSP-Course!
    if code == 'EE3621':
        print(f"Skipping EE3621 (Preserving full 30-lecture master repo from spkkarri/DSP-Course)")
        continue

    # Read syllabus lectures
    lectures = []
    course_name = code
    try:
        with open(syl_path, encoding='utf-8', errors='replace') as f:
            reader = csv.DictReader(f)
            num = 1
            for row in reader:
                course_name = row.get('Course Name') or row.get('course_name') or course_name
                lectures.append({
                    "module": row.get('Module') or row.get('module') or "Unit 1",
                    "num": num,
                    "title": row.get('Lecture Topic') or row.get('topic') or f"Lecture {num}",
                    "subtopics": row.get('Subtopics') or row.get('subtopics') or "",
                    "bloom": row.get('Bloom Level') or row.get('bloom') or "L3_APPLY"
                })
                num += 1
    except Exception as e:
        print(f"Error reading {syl_path}: {e}")
        continue

    # Read resources if available
    resources = {}
    res_path = os.path.join(course_dir, 'resources.json')
    if os.path.exists(res_path):
        try:
            with open(res_path, encoding='utf-8') as f:
                resources = json.load(f)
        except Exception:
            pass

    portal_dir = os.path.join(course_dir, 'interactive_portal')
    course_data = {
        "course_code": code,
        "course_name": course_name,
        "lectures": lectures
    }

    res = agent.generate_portal(course_data, resources, portal_dir)
    updated_count += 1
    if updated_count <= 10 or updated_count % 10 == 0:
        print(f"✓ [{code}] {course_name[:35]:35} -> Category: {res['category']} ({len(lectures)} lectures)")

print(f"\n🎉 Successfully upgraded interactive portals across {updated_count} courses!")
