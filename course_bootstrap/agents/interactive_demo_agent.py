#!/usr/bin/env python3
"""
InteractiveDemoAgent:
Generates complete standalone interactive HTML5/Canvas course web portals
styled after https://ee3621.netlify.app/ and incorporating ML visualizers from /home/sri/interactive learning.
"""

import os
import json
from typing import Dict, List, Any

class InteractiveDemoAgent:
    """Agent that synthesizes full interactive web learning portals for engineering courses."""

    def generate_portal(self, course_data: Dict[str, Any], resources: Dict[str, Any], output_dir: str) -> Dict[str, str]:
        os.makedirs(output_dir, exist_ok=True)
        
        course_code = course_data.get("course_code", "EE3621")
        course_name = course_data.get("course_name", "Digital Signal Processing")
        lectures = course_data.get("lectures", [])
        category = resources.get("category", "dsp")

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
        js_content = self._build_js(course_code, lectures, category)
        with open(js_path, "w", encoding="utf-8") as f:
            f.write(js_content)

        return {
            "html": html_path,
            "css": css_path,
            "js": js_path,
            "status": "ready"
        }

    def _build_html(self, code: str, name: str, lectures: List[Dict[str, Any]], resources: Dict[str, Any], category: str) -> str:
        units = list(dict.fromkeys(l["module"] for l in lectures))
        
        sidebar_units_html = ""
        for u in units:
            unit_lecs = [l for l in lectures if l["module"] == u]
            sidebar_units_html += f"""
            <div class="unit-section">
                <div class="unit-title">{u}</div>"""
            for l in unit_lecs:
                active_cls = "active" if l["num"] == 1 else ""
                sidebar_units_html += f"""
                <div class="lecture-item {active_cls}" data-lecture="{l['num']}" onclick="loadLecture({l['num']})">
                    <div class="lecture-num">L{l['num']}</div>
                    <div class="lecture-info">
                        <div class="lecture-title">{l['title']}</div>
                        <div class="lecture-meta">{l.get('bloom', 'L2')} &bull; 40 mins</div>
                    </div>
                </div>"""
            sidebar_units_html += "\n            </div>"

        viz_title = "Interactive Signal & Convolution Sandbox"
        if category == "ml":
            viz_title = "Interactive Decision Boundary & Loss Surface Visualizer"
        elif category == "control":
            viz_title = "Interactive Root Locus & Step Response Sandbox"
        elif category == "circuits":
            viz_title = "Interactive RLC Resonance & Phasor Visualizer"

        primary_tb = resources['textbooks'][0]['title'] if resources.get('textbooks') else "Standard Engineering Textbook"
        nptel_course = resources['nptel_courses'][0]['course_name'] if resources.get('nptel_courses') else "NPTEL Online Course"

        template = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>__CODE__: __NAME__ - Interactive Learning Portal</title>
    <link rel="stylesheet" href="style.css">
    <!-- KaTeX for beautiful math equations -->
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
                <p>B.Tech R24 Curriculum &bull; Interactive Lectures</p>
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
                        $$ y(t) = \\int_{-\\infty}^{\\infty} x(\\tau) h(t-\\tau) d\\tau \\iff Y(s) = X(s) H(s) $$
                    </div>
                </div>

                <!-- Mathematical & Intuitive Insights Card -->
                <div class="card" id="optimizationInsights" style="display: none;">
                    <div class="card-title">🧠 Optimization Insights: Intuition & Mathematics</div>
                    <div class="card-desc" id="insightContent">
                        <strong>Intuition:</strong> Optimizing the transition band or filter coefficients significantly reduces computational overhead and minimizes ringing artifacts (Gibbs phenomenon).<br><br>
                        <strong>Mathematical Basis:</strong> The minimax optimization (Parks-McClellan) minimizes the maximum error bounds using the Alternation Theorem:
                        <div class="math-box">
                            $$ \min_h \max_{\omega \in \text{bands}} |E(\omega)| $$
                        </div>
                        This equiripple behavior distributes the error evenly across the band, producing the optimal filter of the lowest possible order for a given specification.
                    </div>
                </div>

                <!-- Interactive Simulation Canvas Card -->
                <div class="card">
                    <div class="card-title">⚡ __VIZ_TITLE__</div>
                    <p class="card-desc">Adjust parameters in real time to observe mathematical transformations, dynamic waveforms, and stability trajectories.</p>
                    
                    <!-- Controls Bar -->
                    <div class="controls-bar">
                        <div class="control-group">
                            <label>Damping / Parameter &alpha;: <span id="paramValAlpha">0.50</span></label>
                            <input type="range" id="sliderAlpha" min="0.05" max="1.50" step="0.05" value="0.50" oninput="updateSimulation()">
                        </div>
                        <div class="control-group">
                            <label>Frequency &omega; / Scale: <span id="paramValOmega">2.00</span></label>
                            <input type="range" id="sliderOmega" min="0.5" max="10.0" step="0.5" value="2.0" oninput="updateSimulation()">
                        </div>
                        <div class="control-group">
                            <button class="btn btn-accent" onclick="toggleAnimation()">▶ Run Simulation</button>
                            <button class="btn btn-secondary" onclick="resetSimulation()">Reset</button>
                        </div>
                    </div>

                    <!-- Live Canvas -->
                    <div class="canvas-container">
                        <canvas id="interactiveCanvas" width="900" height="320"></canvas>
                    </div>
                    <div class="canvas-caption" id="canvasCaption">Real-time simulation rendered at 60 FPS using HTML5 Canvas & Vector Math.</div>
                </div>

                <!-- Diagnostic Checkpoint Quiz Card -->
                <div class="card">
                    <div class="card-title">🎯 Concept Checkpoint & Self-Assessment</div>
                    <div id="checkpointQuestion" class="checkpoint-question">Which criterion guarantees that an LTI system is strictly BIBO stable?</div>
                    <div class="options-grid" id="optionsContainer">
                        <button class="option-btn" onclick="checkAnswer(0)">A) All poles lie outside |z| &gt; 1</button>
                        <button class="option-btn" onclick="checkAnswer(1)">B) All poles lie strictly inside the unit circle |z| &lt; 1</button>
                        <button class="option-btn" onclick="checkAnswer(2)">C) The impulse response is growing exponentially</button>
                    </div>
                    <div class="feedback-alert" id="checkpointFeedback" style="display:none;"></div>
                </div>

                <!-- References & Textbooks Card -->
                <div class="card">
                    <div class="card-title">📚 Recommended References & NPTEL Mapping</div>
                    <ul class="references-list" id="referencesList">
                        <li><strong>Primary Textbook:</strong> __PRIMARY_TB__</li>
                        <li><strong>NPTEL Course:</strong> __NPTEL_COURSE__</li>
                    </ul>
                </div>
            </div>
        </main>
    </div>

    <script src="app.js"></script>
</body>
</html>"""
        return (
            template.replace("__CODE__", code)
            .replace("__NAME__", name)
            .replace("__SIDEBAR_UNITS__", sidebar_units_html)
            .replace("__VIZ_TITLE__", viz_title)
            .replace("__PRIMARY_TB__", primary_tb)
            .replace("__NPTEL_COURSE__", nptel_course)
        )

    def _build_css(self) -> str:
        return """/* DSP / Engineering Interactive Learning Portal Style */
:root {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --bg-card: #1e293b;
    --border-color: #334155;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --accent-blue: #38bdf8;
    --accent-emerald: #10b981;
    --accent-indigo: #6366f1;
    --accent-rose: #f43f5e;
}

* { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
body { background: var(--bg-primary); color: var(--text-primary); height: 100vh; overflow: hidden; }

.app-container { display: flex; height: 100vh; }

/* Sidebar */
.sidebar { width: 340px; background: #0b1120; border-right: 1px solid var(--border-color); display: flex; flex-direction: column; }
.sidebar-header { padding: 20px; border-bottom: 1px solid var(--border-color); background: rgba(30, 41, 59, 0.5); }
.sidebar-header h1 { font-size: 1.15rem; font-weight: 700; color: var(--accent-blue); line-height: 1.3; }
.sidebar-header p { font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px; }

.lecture-list { flex: 1; overflow-y: auto; padding: 12px; }
.unit-section { margin-bottom: 16px; }
.unit-title { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); padding: 8px 12px; font-weight: 600; }

.lecture-item { display: flex; align-items: center; padding: 10px 12px; border-radius: 8px; cursor: pointer; margin-bottom: 4px; transition: all 0.2s ease; border: 1px solid transparent; }
.lecture-item:hover { background: rgba(56, 189, 248, 0.1); border-color: rgba(56, 189, 248, 0.3); }
.lecture-item.active { background: #1e293b; border-color: var(--accent-blue); }

.lecture-num { width: 36px; height: 36px; border-radius: 6px; background: rgba(56, 189, 248, 0.15); color: var(--accent-blue); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; margin-right: 12px; flex-shrink: 0; }
.lecture-info { flex: 1; min-width: 0; }
.lecture-title { font-size: 0.88rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary); }
.lecture-meta { font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px; }

/* Main Content Area */
.main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.top-nav { height: 64px; border-bottom: 1px solid var(--border-color); background: #0b1120; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; }
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

.content-body { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 24px; }
.card-title { font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
.card-desc { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px; }

.math-box { background: #0b1120; padding: 16px; border-radius: 8px; border-left: 4px solid var(--accent-blue); overflow-x: auto; margin: 12px 0; }

/* Interactive Canvas */
.controls-bar { display: flex; flex-wrap: wrap; gap: 20px; align-items: center; background: #0b1120; padding: 12px 16px; border-radius: 8px; margin-bottom: 12px; border: 1px solid var(--border-color); }
.control-group { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: var(--text-primary); }
.control-group input[type="range"] { accent-color: var(--accent-blue); cursor: pointer; }

.canvas-container { background: #070b14; border-radius: 8px; border: 1px solid var(--border-color); overflow: hidden; display: flex; justify-content: center; }
.canvas-caption { font-size: 0.8rem; color: var(--text-secondary); margin-top: 8px; text-align: center; }

/* Checkpoint Quiz */
.checkpoint-question { font-size: 0.95rem; font-weight: 600; margin-bottom: 12px; color: #e2e8f0; }
.options-grid { display: flex; flex-direction: column; gap: 8px; }
.option-btn { text-align: left; background: #0b1120; border: 1px solid var(--border-color); color: var(--text-primary); padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; cursor: pointer; transition: 0.2s; }
.option-btn:hover { border-color: var(--accent-blue); background: rgba(56, 189, 248, 0.05); }

.feedback-alert { padding: 12px; border-radius: 8px; margin-top: 12px; font-size: 0.9rem; }
.feedback-correct { background: rgba(16, 185, 129, 0.15); border: 1px solid var(--accent-emerald); color: var(--accent-emerald); }
.feedback-wrong { background: rgba(244, 63, 94, 0.15); border: 1px solid var(--accent-rose); color: var(--accent-rose); }

.references-list { padding-left: 20px; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.8; }
.references-list strong { color: var(--text-primary); }
"""

    def _build_js(self, code: str, lectures: List[Dict[str, Any]], category: str) -> str:
        lecs_json = json.dumps(lectures)
        return f"""// DSP / Engineering Interactive Learning Engine
const lecturesData = {lecs_json};
let currentLecIndex = 0;
let isAnimating = false;
let animFrameId = null;
let timeStep = 0;

document.addEventListener('DOMContentLoaded', () => {{
    loadLecture(1);
    initCanvas();
    if (window.renderMathInElement) {{
        renderMathInElement(document.body);
    }}
}});

function loadLecture(num) {{
    const idx = lecturesData.findIndex(l => l.num === num);
    if (idx === -1) return;
    currentLecIndex = idx;
    const lec = lecturesData[idx];

    // Update active class in sidebar
    document.querySelectorAll('.lecture-item').forEach(item => {{
        item.classList.toggle('active', parseInt(item.getAttribute('data-lecture')) === num);
    }});

    // Update header & badges
    document.getElementById('currentLecBadge').innerText = `L${{lec.num}}: ${{lec.title}}`;
    document.getElementById('bloomBadge').innerText = lec.bloom || 'L3_APPLY';
    document.getElementById('lectureHeaderTitle').innerText = `Lecture ${{lec.num}}: ${{lec.title}}`;
    document.getElementById('lectureSubtopics').innerHTML = `<strong>Module:</strong> ${{lec.module}} &bull; <strong>Topics:</strong> ${{lec.subtopics}}`;

    // Reset Quiz
    document.getElementById('checkpointFeedback').style.display = 'none';
    
    // Update Math box
    const mathBox = document.getElementById('lectureMathFormula');
    mathBox.innerHTML = `$$ H(z) = \\\\frac{{\\\\sum_{{k=0}}^{{M}} b_k z^{{-k}}}}{{1 + \\\\sum_{{k=1}}^{{N}} a_k z^{{-k}}}} \\\\quad \\\\iff \\\\quad y[n] = \\\\sum_{{k=0}}^{{M}} b_k x[n-k] - \\\\sum_{{k=1}}^{{N}} a_k y[n-k] $$`;
    
    if (window.renderMathInElement) {{
        renderMathInElement(mathBox);
    }}

    // Show optimization insights if applicable
    const insightsCard = document.getElementById('optimizationInsights');
    if (lec.title.toLowerCase().includes('optim') || lec.title.toLowerCase().includes('filter') || lec.title.toLowerCase().includes('multirate')) {
        if(insightsCard) insightsCard.style.display = 'block';
    } else {
        if(insightsCard) insightsCard.style.display = 'none';
    }

    drawSimulation();
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

// Interactive Simulation Engine
const canvas = document.getElementById('interactiveCanvas');
const ctx = canvas.getContext('2d');

function initCanvas() {{
    // Show optimization insights if applicable
    const insightsCard = document.getElementById('optimizationInsights');
    if (lec.title.toLowerCase().includes('optim') || lec.title.toLowerCase().includes('filter') || lec.title.toLowerCase().includes('multirate')) {
        if(insightsCard) insightsCard.style.display = 'block';
    } else {
        if(insightsCard) insightsCard.style.display = 'none';
    }

    drawSimulation();
}}

function updateSimulation() {{
    const alpha = parseFloat(document.getElementById('sliderAlpha').value);
    const omega = parseFloat(document.getElementById('sliderOmega').value);
    document.getElementById('paramValAlpha').innerText = alpha.toFixed(2);
    document.getElementById('paramValOmega').innerText = omega.toFixed(2);
    // Show optimization insights if applicable
    const insightsCard = document.getElementById('optimizationInsights');
    if (lec.title.toLowerCase().includes('optim') || lec.title.toLowerCase().includes('filter') || lec.title.toLowerCase().includes('multirate')) {
        if(insightsCard) insightsCard.style.display = 'block';
    } else {
        if(insightsCard) insightsCard.style.display = 'none';
    }

    drawSimulation();
}}

function drawSimulation() {{
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const alpha = parseFloat(document.getElementById('sliderAlpha').value);
    const omega = parseFloat(document.getElementById('sliderOmega').value);

    // Draw Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {{
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }}
    for (let y = 0; y < height; y += 40) {{
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }}

    // Center Axes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(width / 3, 0); ctx.lineTo(width / 3, height); ctx.stroke();

    // Plot 1: Dynamic Time Waveform / Impulse Response (Left / Middle)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < 40; i++) {{
        const x = (width / 3) + i * 14;
        const decay = Math.pow(Math.abs(alpha), i * 0.1);
        const yVal = (height / 2) - Math.sin(i * omega * 0.2 + timeStep) * 90 * decay;
        if (i === 0) ctx.moveTo(x, yVal);
        else ctx.lineTo(x, yVal);
        
        // Draw stem markers
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(x, yVal, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }}
    ctx.stroke();

    // Plot 2: Z-Plane Unit Circle / Pole-Zero Map (Left Box)
    const centerX = 120;
    const centerY = height / 2;
    const radius = 70;

    ctx.strokeStyle = '#64748b';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Pole
    const poleX = centerX + alpha * radius * Math.cos(timeStep * 0.5);
    const poleY = centerY - alpha * radius * Math.sin(timeStep * 0.5);

    ctx.fillStyle = alpha <= 1.0 ? '#10b981' : '#f43f5e';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('x', poleX - 5, poleY + 5);

    // Legend / Metrics
    ctx.fillStyle = '#f8fafc';
    ctx.font = '13px sans-serif';
    ctx.fillText(`Pole Magnitude |p|: ${{alpha.toFixed(2)}}`, 20, 30);
    ctx.fillText(alpha < 1.0 ? 'System: Stable (BIBO check)' : 'System: Unstable (Poles outside ROC)', 20, 50);
}}

function toggleAnimation() {{
    isAnimating = !isAnimating;
    if (isAnimating) animate();
    else cancelAnimationFrame(animFrameId);
}}

function animate() {{
    timeStep += 0.05;
    // Show optimization insights if applicable
    const insightsCard = document.getElementById('optimizationInsights');
    if (lec.title.toLowerCase().includes('optim') || lec.title.toLowerCase().includes('filter') || lec.title.toLowerCase().includes('multirate')) {
        if(insightsCard) insightsCard.style.display = 'block';
    } else {
        if(insightsCard) insightsCard.style.display = 'none';
    }

    drawSimulation();
    animFrameId = requestAnimationFrame(animate);
}}

function resetSimulation() {{
    isAnimating = false;
    cancelAnimationFrame(animFrameId);
    timeStep = 0;
    document.getElementById('sliderAlpha').value = 0.50;
    document.getElementById('sliderOmega').value = 2.00;
    updateSimulation();
}}

function checkAnswer(idx) {{
    const feedback = document.getElementById('checkpointFeedback');
    feedback.style.display = 'block';
    if (idx === 1) {{
        feedback.className = 'feedback-alert feedback-correct';
        feedback.innerHTML = '<strong>check Correct!</strong> For a causal LTI system, all poles must lie strictly inside the unit circle |z| &lt; 1 for the unit circle to be within the ROC.';
    }} else {{
        feedback.className = 'feedback-alert feedback-wrong';
        feedback.innerHTML = '<strong>Incorrect.</strong> Recall that BIBO stability requires sum |h[n]| &lt; infinity, which means the Fourier Transform exists and the unit circle |z|=1 lies inside the ROC.';
    }}
}}
"""
