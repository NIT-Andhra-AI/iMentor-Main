package course_agents

import (
	"os"
	"path/filepath"
)

// FrontendHubAgent coordinates the generation of modern student & faculty web interfaces
type FrontendHubAgent struct {
	outputDir string
}

// NewFrontendHubAgent initializes the frontend hub generator
func NewFrontendHubAgent(outputDir string) *FrontendHubAgent {
	return &FrontendHubAgent{outputDir: outputDir}
}

// GenerateModernChatInterface creates a standalone, responsive student chat UI
func (f *FrontendHubAgent) GenerateModernChatInterface(filename string) (string, error) {
	if filename == "" {
		filename = "student_multimodal_chat.html"
	}
	targetPath := filepath.Join(f.outputDir, filename)
	os.MkdirAll(f.outputDir, 0755)

	htmlContent := `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>iMentor NextGen — Student Adaptive Scaffolding Chat</title>
  
  <!-- Modern Typography: EB Garamond (Serif), Inter (Sans), JetBrains Mono (Code) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..700;1,400..700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  
  <!-- KaTeX for High-Performance Equation Rendering -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body);"></script>

  <style>
    :root {
      --bg-base: #060913;
      --bg-surface: #0c1222;
      --bg-card: #111a30;
      --border-subtle: #1e2d4a;
      --border-focus: #3b82f6;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --accent-blue: #38bdf8;
      --accent-green: #34d399;
      --accent-amber: #fbbf24;
      --accent-rose: #f43f5e;
      --font-sans: 'Inter', sans-serif;
      --font-serif: 'EB Garamond', serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-base);
      color: var(--text-main);
      font-family: var(--font-sans);
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* Sidebar Navigation */
    .sidebar {
      width: 280px;
      background-color: var(--bg-surface);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      padding: 20px;
    }

    .brand-logo {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--accent-blue);
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 24px;
    }

    .focus-tracks-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 12px;
    }

    .track-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 8px;
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      margin-bottom: 6px;
      transition: all 0.15s ease;
      width: 100%;
      text-align: left;
    }

    .track-btn:hover {
      background: var(--bg-card);
      color: var(--text-main);
    }

    .track-btn.active {
      background: rgba(56, 189, 248, 0.1);
      border-color: var(--accent-blue);
      color: var(--accent-blue);
      font-weight: 600;
    }

    /* Main Chat Container */
    .chat-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background-color: var(--bg-base);
    }

    .chat-header {
      padding: 16px 28px;
      border-bottom: 1px solid var(--border-subtle);
      background-color: var(--bg-surface);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chat-title {
      font-size: 1rem;
      font-weight: 600;
    }

    .reasoning-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-family: var(--font-mono);
      background: rgba(52, 211, 153, 0.1);
      color: var(--accent-green);
      border: 1px solid rgba(52, 211, 153, 0.3);
    }

    .chat-feed {
      flex: 1;
      overflow-y: auto;
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .message-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 24px;
      max-width: 860px;
      line-height: 1.65;
    }

    .message-card h3 {
      font-size: 1.15rem;
      color: var(--accent-blue);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .message-card p {
      font-family: var(--font-serif);
      font-size: 1.1rem;
      color: #cbd5e1;
      margin-bottom: 14px;
    }

    /* Circuit SVG & Slider Widgets */
    .circuit-box {
      background: #040711;
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      text-align: center;
    }

    .slider-box {
      background: #0a1020;
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }

    .slider-control {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 8px;
    }

    .slider-control input[type="range"] {
      flex: 1;
      accent-color: var(--accent-blue);
    }

    /* Input Footer */
    .chat-footer {
      padding: 20px 28px;
      border-top: 1px solid var(--border-subtle);
      background-color: var(--bg-surface);
    }

    .input-box-wrapper {
      display: flex;
      gap: 12px;
      max-width: 860px;
    }

    .chat-input {
      flex: 1;
      padding: 14px 18px;
      border-radius: 8px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-subtle);
      color: var(--text-main);
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.15s ease;
    }

    .chat-input:focus {
      border-color: var(--border-focus);
    }

    .send-btn {
      padding: 0 24px;
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .send-btn:hover {
      background: #1d4ed8;
    }
  </style>
</head>
<body>

  <!-- Left Sidebar: 5 Mutually Exclusive Personas -->
  <aside class="sidebar">
    <div class="brand-logo">
      <span>⚡ iMentor</span>
      <span style="font-size: 0.75rem; background: #1e293b; padding: 2px 6px; border-radius: 4px; color: #94a3b8;">v3.0</span>
    </div>

    <div class="focus-tracks-label">Learner Focus Track (Exclusive)</div>
    <button class="track-btn active" onclick="setTrack('STANDARD_BTECH', this)">🎓 B.Tech Semester</button>
    <button class="track-btn" onclick="setTrack('GATE_ASPIRANT', this)">🎯 GATE Exam Prep</button>
    <button class="track-btn" onclick="setTrack('PLACEMENT_PREP', this)">🏭 Core Placements</button>
    <button class="track-btn" onclick="setTrack('ENTREPRENEURSHIP', this)">🚀 Startup & BOM</button>
    <button class="track-btn" onclick="setTrack('RESEARCHER', this)">🔬 Research & IEEE</button>
  </aside>

  <!-- Main Chat Section -->
  <main class="chat-container">
    <header class="chat-header">
      <div class="chat-title">Power Electronics: Buck Converter (EE3011)</div>
      <div class="reasoning-badge">
        <span>⚡ Karpathy Tier 2: System 2 Verified</span>
      </div>
    </header>

    <section class="chat-feed" id="chatFeed">
      <!-- Section 1: Physical Working Principle -->
      <article class="message-card">
        <h3>▶️ Section 1: Physical Principle & Working Modes</h3>
        <p>In step-down DC-DC power conversion, the buck converter regulates an unregulated input voltage \(V_{in}\) to a lower desired DC output \(V_o\) by applying controlled periodic switching across reactive storage elements.</p>
        
        <div class="circuit-box">
          <svg width="400" height="120" viewBox="0 0 400 120" style="max-width:100%;">
            <line x1="20" y1="40" x2="100" y2="40" stroke="#38bdf8" stroke-width="2"/>
            <rect x="100" y="25" width="40" height="30" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
            <text x="120" y="45" fill="#f8fafc" font-size="12" text-anchor="middle" font-family="sans-serif">Q1</text>
            <line x1="140" y1="40" x2="220" y2="40" stroke="#38bdf8" stroke-width="2"/>
            <path d="M 220,40 Q 235,20 250,40 Q 265,20 280,40 Q 295,20 310,40" fill="none" stroke="#34d399" stroke-width="2"/>
            <text x="265" y="15" fill="#34d399" font-size="12" text-anchor="middle" font-family="sans-serif">Inductor L</text>
            <line x1="310" y1="40" x2="380" y2="40" stroke="#38bdf8" stroke-width="2"/>
            <line x1="380" y1="40" x2="380" y2="100" stroke="#38bdf8" stroke-width="2"/>
            <rect x="370" y="55" width="20" height="30" fill="#1e293b" stroke="#f43f5e" stroke-width="2"/>
            <text x="360" y="75" fill="#f43f5e" font-size="12" text-anchor="end" font-family="sans-serif">R_L</text>
            <line x1="20" y1="100" x2="380" y2="100" stroke="#38bdf8" stroke-width="2"/>
          </svg>
        </div>

        <p>Applying the volt-second balance under steady-state continuous conduction mode (CCM):</p>
        <div style="font-family: var(--font-mono); background: #080d1a; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
          $$ \int_0^{T_s} v_L(t) dt = 0 \implies (V_{in} - V_o) D T_s - V_o (1 - D) T_s = 0 \implies V_o = D \cdot V_{in} $$
        </div>

        <!-- Interactive Micro-Sandbox Parameter Slider -->
        <div class="slider-box">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
            <span>Interactive Parameter: Duty Ratio \(D\)</span>
            <strong id="dutyVal" style="color: var(--accent-blue);">0.40 (40%)</strong>
          </div>
          <div class="slider-control">
            <input type="range" min="0.05" max="0.95" step="0.05" value="0.40" oninput="updateDuty(this.value)">
          </div>
          <div style="margin-top: 8px; font-size: 0.8rem; color: var(--text-muted);">
            Simulated Output Voltage: \(V_o = D \times 48\text{V} =\) <span id="simVo" style="color: var(--accent-green); font-weight: 600;">19.20 V</span>
          </div>
        </div>
      </article>
    </section>

    <footer class="chat-footer">
      <div class="input-box-wrapper">
        <input type="text" class="chat-input" placeholder="Ask an engineering question (e.g. Calculate critical inductance for CCM)...">
        <button class="send-btn">Send</button>
      </div>
    </footer>
  </main>

  <script>
    function setTrack(track, el) {
      document.querySelectorAll('.track-btn').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      console.log('Focus track updated to:', track);
    }

    function updateDuty(val) {
      const d = parseFloat(val);
      document.getElementById('dutyVal').textContent = d.toFixed(2) + ' (' + Math.round(d * 100) + '%)';
      document.getElementById('simVo').textContent = (d * 48).toFixed(2) + ' V';
    }
  </script>
</body>
</html>`

	if err := os.WriteFile(targetPath, []byte(htmlContent), 0644); err != nil {
		return "", err
	}
	return targetPath, nil
}
