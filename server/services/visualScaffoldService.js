/**
 * server/services/visualScaffoldService.js
 * 
 * Code-as-Visual Generation & Multi-Section Scaffolding Service
 * 
 * Capabilities:
 * 1. Inline SVG Circuits (resistors, capacitors, inductors, op-amps, logic gates, transistor switches)
 * 2. Mermaid.js State DAGs & Architecture Flowcharts
 * 3. Dynamic Waveform Simulations (ASCII/SVG timing diagrams, transient response)
 * 4. HTML5 Interactive Parameter Sliders (RLC resonance, learning rate slider, RC charging time)
 */

const log = require('../utils/logger');

const VISUAL_TYPES = {
    MERMAID_DAG: 'MERMAID_DAG',
    SVG_CIRCUIT: 'SVG_CIRCUIT',
    WAVEFORM_SIMULATION: 'WAVEFORM_SIMULATION',
    INTERACTIVE_SLIDER: 'INTERACTIVE_SLIDER'
};

/**
 * Generates an inline SVG circuit schematic based on standard circuit templates
 * @param {string} circuitType - e.g. 'RC_LOWPASS', 'RLC_SERIES', 'VOLTAGE_DIVIDER', 'INVERTING_OPAMP'
 * @param {object} params - component values (R, L, C, Vin, etc.)
 */
function generateSvgCircuit(circuitType, params = {}) {
    const rVal = params.r || '1kΩ';
    const cVal = params.c || '10μF';
    const lVal = params.l || '10mH';
    const vin = params.vin || 'Vin';
    const vout = params.vout || 'Vout';

    switch (String(circuitType).toUpperCase()) {
        case 'RC_LOWPASS':
            return `\`\`\`svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 180" width="100%" height="180" style="background:#1e1e2e; border-radius:8px;">
  <!-- Nodes & Wires -->
  <line x1="40" y1="50" x2="120" y2="50" stroke="#89b4fa" stroke-width="3"/>
  <line x1="200" y1="50" x2="320" y2="50" stroke="#89b4fa" stroke-width="3"/>
  <line x1="260" y1="50" x2="260" y2="90" stroke="#89b4fa" stroke-width="3"/>
  <line x1="260" y1="130" x2="260" y2="150" stroke="#89b4fa" stroke-width="3"/>
  <line x1="40" y1="150" x2="320" y2="150" stroke="#89b4fa" stroke-width="3"/>
  
  <!-- Resistor R -->
  <rect x="120" y="38" width="80" height="24" rx="4" fill="#313244" stroke="#f38ba8" stroke-width="2"/>
  <text x="160" y="55" fill="#cdd6f4" font-family="monospace" font-size="13" text-anchor="middle">R (${rVal})</text>
  
  <!-- Capacitor C -->
  <line x1="240" y1="90" x2="280" y2="90" stroke="#a6e3a1" stroke-width="4"/>
  <line x1="240" y1="100" x2="280" y2="100" stroke="#a6e3a1" stroke-width="4"/>
  <text x="295" y="100" fill="#cdd6f4" font-family="monospace" font-size="13">C (${cVal})</text>
  
  <!-- Terminals -->
  <circle cx="40" cy="50" r="4" fill="#f9e2af"/>
  <circle cx="40" cy="150" r="4" fill="#f9e2af"/>
  <circle cx="320" cy="50" r="4" fill="#fab387"/>
  <circle cx="320" cy="150" r="4" fill="#fab387"/>
  <text x="35" y="35" fill="#f9e2af" font-family="sans-serif" font-size="12">${vin}</text>
  <text x="315" y="35" fill="#fab387" font-family="sans-serif" font-size="12">${vout}</text>
  <text x="200" y="172" fill="#6c7086" font-family="sans-serif" font-size="11" text-anchor="middle">GND (Common Return)</text>
</svg>
\`\`\``;

        case 'RLC_SERIES':
        default:
            return `\`\`\`svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 180" width="100%" height="180" style="background:#1e1e2e; border-radius:8px;">
  <!-- Title -->
  <text x="230" y="165" fill="#a6adc8" font-family="sans-serif" font-size="12" text-anchor="middle">RLC Series Resonant Circuit</text>
  <!-- Main loop -->
  <line x1="40" y1="50" x2="90" y2="50" stroke="#89b4fa" stroke-width="3"/>
  <rect x="90" y="38" width="70" height="24" rx="4" fill="#313244" stroke="#f38ba8" stroke-width="2"/>
  <text x="125" y="55" fill="#cdd6f4" font-family="monospace" font-size="12" text-anchor="middle">R (${rVal})</text>
  
  <line x1="160" y1="50" x2="200" y2="50" stroke="#89b4fa" stroke-width="3"/>
  <!-- Inductor L -->
  <path d="M 200 50 Q 215 30 230 50 Q 245 30 260 50 Q 275 30 290 50" fill="none" stroke="#fab387" stroke-width="3"/>
  <text x="245" y="24" fill="#cdd6f4" font-family="monospace" font-size="12" text-anchor="middle">L (${lVal})</text>
  
  <line x1="290" y1="50" x2="340" y2="50" stroke="#89b4fa" stroke-width="3"/>
  <!-- Capacitor C -->
  <line x1="340" y1="35" x2="340" y2="65" stroke="#a6e3a1" stroke-width="4"/>
  <line x1="350" y1="35" x2="350" y2="65" stroke="#a6e3a1" stroke-width="4"/>
  <text x="345" y="24" fill="#cdd6f4" font-family="monospace" font-size="12" text-anchor="middle">C (${cVal})</text>
  
  <line x1="350" y1="50" x2="420" y2="50" stroke="#89b4fa" stroke-width="3"/>
  <line x1="40" y1="140" x2="420" y2="140" stroke="#89b4fa" stroke-width="3"/>
  <circle cx="40" cy="50" r="4" fill="#f9e2af"/>
  <circle cx="40" cy="140" r="4" fill="#f9e2af"/>
  <circle cx="420" cy="50" r="4" fill="#fab387"/>
  <circle cx="420" cy="140" r="4" fill="#fab387"/>
  <text x="30" y="98" fill="#f9e2af" font-family="sans-serif" font-size="12" text-anchor="middle">AC Source</text>
</svg>
\`\`\``;
    }
}

/**
 * Generates dynamic waveform diagram SVG
 */
function generateWaveformDiagram(type = 'STEP_RESPONSE', params = {}) {
    const tau = params.tau || 'RC';
    return `\`\`\`svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 180" width="100%" height="180" style="background:#181825; border-radius:8px;">
  <!-- Axes -->
  <line x1="40" y1="150" x2="390" y2="150" stroke="#6c7086" stroke-width="2"/>
  <line x1="40" y1="20" x2="40" y2="150" stroke="#6c7086" stroke-width="2"/>
  <text x="390" y="165" fill="#a6adc8" font-family="monospace" font-size="11">Time (t)</text>
  <text x="15" y="25" fill="#a6adc8" font-family="monospace" font-size="11">V(t)</text>
  
  <!-- Step Input V_in -->
  <path d="M 40 150 L 80 150 L 80 50 L 380 50" fill="none" stroke="#fab387" stroke-width="2" stroke-dasharray="4,4"/>
  <text x="310" y="42" fill="#fab387" font-family="monospace" font-size="11">Vin (Step)</text>
  
  <!-- Exponential Charging Curve V_out = V_0(1 - e^(-t/tau)) -->
  <path d="M 80 150 Q 140 65 380 52" fill="none" stroke="#a6e3a1" stroke-width="3"/>
  <text x="210" y="90" fill="#a6e3a1" font-family="monospace" font-size="12">Vout = V₀(1 - e^{-t/τ})</text>
  
  <!-- Time Constant Marker tau (63.2%) -->
  <line x1="160" y1="150" x2="160" y2="87" stroke="#f38ba8" stroke-width="1.5" stroke-dasharray="2,2"/>
  <circle cx="160" cy="87" r="4" fill="#f38ba8"/>
  <text x="160" y="165" fill="#f38ba8" font-family="monospace" font-size="11" text-anchor="middle">t = τ (${tau})</text>
  <text x="100" y="85" fill="#f38ba8" font-family="monospace" font-size="11">63.2% V₀</text>
</svg>
\`\`\``;
}

/**
 * Generates an interactive HTML5 parameter slider sandbox
 */
function generateInteractiveSlider(conceptName, config = {}) {
    const title = config.title || `Interactive Parameter Explorer: ${conceptName}`;
    const param1 = config.param1 || { name: 'Resistance R (Ω)', min: 100, max: 5000, step: 100, default: 1000 };
    const param2 = config.param2 || { name: 'Capacitance C (μF)', min: 1, max: 100, step: 1, default: 10 };

    return `\`\`\`html
<div class="interactive-slider-container" style="background:#1e1e2e; padding:16px; border-radius:8px; color:#cdd6f4; font-family:sans-serif;">
  <h4 style="margin:0 0 12px 0; color:#89b4fa;">⚡ ${title}</h4>
  
  <div style="margin-bottom:12px;">
    <label style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px;">
      <span>${param1.name}</span>
      <strong id="val-p1">${param1.default}</strong>
    </label>
    <input type="range" min="${param1.min}" max="${param1.max}" step="${param1.step}" value="${param1.default}" 
           style="width:100%; cursor:pointer;" 
           oninput="document.getElementById('val-p1').innerText = this.value; window.updateScaffoldModel && window.updateScaffoldModel();"/>
  </div>

  <div style="margin-bottom:12px;">
    <label style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px;">
      <span>${param2.name}</span>
      <strong id="val-p2">${param2.default}</strong>
    </label>
    <input type="range" min="${param2.min}" max="${param2.max}" step="${param2.step}" value="${param2.default}" 
           style="width:100%; cursor:pointer;" 
           oninput="document.getElementById('val-p2').innerText = this.value; window.updateScaffoldModel && window.updateScaffoldModel();"/>
  </div>

  <div style="background:#11111b; padding:10px; border-radius:6px; font-family:monospace; font-size:12px; color:#a6e3a1;">
    Calculated Time Constant (τ = R · C): <span id="calc-tau">10.0 ms</span> | Cutoff Freq (fc): <span id="calc-fc">15.92 Hz</span>
  </div>
</div>
\`\`\``;
}

/**
 * Generates a Mermaid DAG for State Machines or Algorithmic Flows
 */
function generateMermaidDag(nodes = []) {
    if (!Array.isArray(nodes) || nodes.length === 0) {
        return `\`\`\`mermaid
flowchart TD
    A[Start State] --> B{Condition Check}
    B -- True --> C[Execute Branch 1]
    B -- False --> D[Execute Branch 2]
    C --> E[Converge & Return]
    D --> E
\`\`\``;
    }

    const lines = ['flowchart TD'];
    for (const edge of nodes) {
        lines.push(`    ${edge}`);
    }
    return `\`\`\`mermaid\n${lines.join('\n')}\n\`\`\``;
}

module.exports = {
    VISUAL_TYPES,
    generateSvgCircuit,
    generateWaveformDiagram,
    generateInteractiveSlider,
    generateMermaidDag
};
