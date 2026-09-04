// DSP / Engineering Interactive Learning Engine
const lecturesData = [{"module": "Unit I", "num": 1, "title": "MOS Transistor Physics & Submicron Transport Models", "subtopics": "Drift, diffusion, threshold voltage equation, body effect, velocity saturation, channel length modulation", "bloom": "L2_UNDERSTAND", "prereq": "None"}, {"module": "Unit I", "num": 2, "title": "Subthreshold Conduction & Leakage Current Mechanisms", "subtopics": "Subthreshold swing S, drain-induced barrier lowering (DIBL), gate-induced drain leakage (GIDL)", "bloom": "L3_APPLY", "prereq": "1"}, {"module": "Unit I", "num": 3, "title": "CMOS Inverter Static Characteristics & VTC Derivation", "subtopics": "Operating regions, switching threshold V_M, noise margins NM_H and NM_L, beta ratio sizing", "bloom": "L3_APPLY", "prereq": "1"}, {"module": "Unit I", "num": 4, "title": "CMOS Inverter Dynamic Behavior & Switching Transients", "subtopics": "Parasitic capacitances, Miller effect, average current model, t_pHL and t_pLH analytical equations", "bloom": "L4_ANALYZE", "prereq": "3"}, {"module": "Unit I", "num": 5, "title": "RC Delay Models & Elmore Delay Formulation", "subtopics": "Lumped vs distributed RC models, Elmore delay tree formula, buffer insertion in long lines", "bloom": "L4_ANALYZE", "prereq": "4"}, {"module": "Unit I", "num": 6, "title": "Method of Logical Effort & Single-Stage Gate Sizing", "subtopics": "Definition of logical effort g, electrical effort h, parasitic delay p, stage delay optimization", "bloom": "L4_ANALYZE", "prereq": "5"}, {"module": "Unit I", "num": 7, "title": "Multi-Stage Path Sizing & Branching Effort Optimization", "subtopics": "Path logical effort G, branching effort B, path electrical effort H, minimum delay sizing", "bloom": "L4_ANALYZE", "prereq": "6"}, {"module": "Unit II", "num": 8, "title": "Static CMOS Complex Combinational Logic Design", "subtopics": "Series-parallel networks, PUN/PDN duality, transistor sizing for equal rise/fall times", "bloom": "L3_APPLY", "prereq": "3"}, {"module": "Unit II", "num": 9, "title": "Euler Path Optimization & Standard Cell Stick Layouts", "subtopics": "Euler graph traversal, shared diffusion routing, line of diffusion layout strategy", "bloom": "L4_ANALYZE", "prereq": "8"}, {"module": "Unit II", "num": 10, "title": "Ratioed Logic Topologies & Pseudo-NMOS Gate Design", "subtopics": "Pull-up load sizing, static power dissipation trade-offs, asymmetric noise margins", "bloom": "L4_ANALYZE", "prereq": "8"}, {"module": "Unit II", "num": 11, "title": "Pass-Transistor Logic & Full Rail Transmission Gates", "subtopics": "Threshold voltage drop degradation, complementary transmission gates, XOR/MUX implementations", "bloom": "L4_ANALYZE", "prereq": "8"}, {"module": "Unit II", "num": 12, "title": "Dynamic CMOS Logic: Precharge-Evaluate Phase Analysis", "subtopics": "Footed vs unfooted dynamic gates, evaluation speed advantages, single-phase clocking", "bloom": "L4_ANALYZE", "prereq": "8"}, {"module": "Unit II", "num": 13, "title": "Dynamic Logic Vulnerabilities: Charge Sharing & Leakage", "subtopics": "Internal node charge redistribution, capacitive cross-talk coupling, weak PMOS keeper sizing", "bloom": "L5_EVALUATE", "prereq": "12"}, {"module": "Unit II", "num": 14, "title": "High-Speed Domino CMOS & Dual-Rail Differential Topologies", "subtopics": "Domino inverter insertion rule, monotonicity constraints, dual-rail differential dynamic logic", "bloom": "L5_EVALUATE", "prereq": "13"}, {"module": "Unit III", "num": 15, "title": "Power Dissipation in VLSI: Dynamic Switching Mechanisms", "subtopics": "Switching activity factor alpha, load capacitance estimation, dynamic power P = alpha C Vdd^2 f", "bloom": "L4_ANALYZE", "prereq": "4"}, {"module": "Unit III", "num": 16, "title": "Short-Circuit & Static Leakage Power Formulations", "subtopics": "Direct-path current during switching, subthreshold leakage, temperature sensitivity of leakage", "bloom": "L4_ANALYZE", "prereq": "15"}, {"module": "Unit III", "num": 17, "title": "Low-Power Methodologies: Clock Gating & MTCMOS Power Switches", "subtopics": "Integrated clock gating (ICG) cells, Multi-Threshold CMOS, sleep transistors, retention latches", "bloom": "L5_EVALUATE", "prereq": "16"}, {"module": "Unit III", "num": 18, "title": "Sequential Logic Fundamentals: Static Latches & Bistability", "subtopics": "Cross-coupled inverter pairs, multiplexer-based latches, transparent vs opaque states", "bloom": "L3_APPLY", "prereq": "8"}, {"module": "Unit III", "num": 19, "title": "Master-Slave Edge-Triggered Register Topologies", "subtopics": "Transmission-gate master-slave D flip-flop, C2MOS registers, True Single-Phase Clock (TSPC) logic", "bloom": "L4_ANALYZE", "prereq": "18"}, {"module": "Unit III", "num": 20, "title": "Sequential Timing Parameters: Setup, Hold & Clock-to-Q", "subtopics": "Definition of t_setup, t_hold, t_pcq, t_ccq, contamination delays, metastability window & MTBF", "bloom": "L4_ANALYZE", "prereq": "19"}, {"module": "Unit III", "num": 21, "title": "Static Timing Analysis (STA): Setup (Max-Delay) Constraints", "subtopics": "Data path delay, launch/capture clock paths, setup timing constraint: T_clk >= t_pcq + t_comb + t_setup + t_skew", "bloom": "L5_EVALUATE", "prereq": "20"}, {"module": "Unit III", "num": 22, "title": "Static Timing Analysis (STA): Hold (Min-Delay) Constraints", "subtopics": "Hold time verification: t_ccq + t_comb_min >= t_hold + t_skew, race condition elimination", "bloom": "L5_EVALUATE", "prereq": "21"}, {"module": "Unit IV", "num": 23, "title": "Clock Distribution Architectures: Skew, Jitter & H-Tree Topologies", "subtopics": "Positive vs negative skew impact, clock uncertainty budget, balanced H-trees and clock mesh grids", "bloom": "L5_EVALUATE", "prereq": "21"}, {"module": "Unit IV", "num": 24, "title": "Clock Tree Synthesis (CTS) & Buffer Insertion Algorithms", "subtopics": "Skew minimization algorithms, slew control, clock domain crossing (CDC) synchronizers", "bloom": "L5_EVALUATE", "prereq": "23"}, {"module": "Unit IV", "num": 25, "title": "Semiconductor Memory: 6T SRAM Cell Read/Write Operation", "subtopics": "Cross-coupled storage node sizing, read stability criteria, write margin analysis", "bloom": "L4_ANALYZE", "prereq": "3"}, {"module": "Unit IV", "num": 26, "title": "SRAM Static Noise Margin (SNM) & Peripheral Circuitry", "subtopics": "Butterfly curve SNM extraction, precharge circuits, differential regenerative sense amplifiers", "bloom": "L5_EVALUATE", "prereq": "25"}, {"module": "Unit IV", "num": 27, "title": "DRAM 1T1C Cell Dynamics, Refresh Cycles & Charge Sensing", "subtopics": "Trench vs stacked capacitor architectures, bitline charge sharing delta V, periodic refresh", "bloom": "L4_ANALYZE", "prereq": "25"}, {"module": "Unit IV", "num": 28, "title": "High-Speed Arithmetic Datapaths: Adders & Fast Carry Chains", "subtopics": "Ripple Carry, Carry-Lookahead (CLA), Kogge-Stone and Brent-Kung parallel prefix adders", "bloom": "L5_EVALUATE", "prereq": "8"}, {"module": "Unit IV", "num": 29, "title": "High-Performance Multipliers: Booth Encoding & Wallace Trees", "subtopics": "Modified Booth Radix-4 encoding, carry-save reduction, Wallace / Dadda tree reduction matrices", "bloom": "L5_EVALUATE", "prereq": "28"}, {"module": "Unit V", "num": 30, "title": "Digital ASIC Physical Design Flow (RTL-to-GDSII)", "subtopics": "Logic synthesis, technology mapping, floorplanning, power grid planning, placement, routing", "bloom": "L5_EVALUATE", "prereq": "21"}, {"module": "Unit V", "num": 31, "title": "Signal Integrity, Cross-Talk & Power Grid IR Drop Analysis", "subtopics": "Interconnect coupling capacitance, cross-talk noise glitching, power supply droop & decaps", "bloom": "L5_EVALUATE", "prereq": "30"}, {"module": "Unit V", "num": 32, "title": "Design for Testability (DFT): Fault Models & Scan Chains", "subtopics": "Stuck-at fault model, scan cell insertion, scan shift/capture modes, scan chain stitching", "bloom": "L5_EVALUATE", "prereq": "19"}, {"module": "Unit V", "num": 33, "title": "Automatic Test Pattern Generation (ATPG) & Built-In Self-Test (BIST)", "subtopics": "D-algorithm, PODEM, memory BIST (MBIST), pseudo-random test pattern generators (LFSR)", "bloom": "L5_EVALUATE", "prereq": "32"}, {"module": "Unit V", "num": 34, "title": "IC Packaging, Thermal Management & Signal/Power Integrity", "subtopics": "Wire bonding vs flip-chip BGA, thermal resistance junction-to-ambient, package parasitics", "bloom": "L5_EVALUATE", "prereq": "30"}, {"module": "Unit V", "num": 35, "title": "FinFET, Gate-All-Around (GAA) & Nanoscale Emerging Technologies", "subtopics": "Multi-gate FinFETs, nanosheet GAA transistors, High-K Metal Gate (HKMG), extreme sub-3nm scaling", "bloom": "L5_EVALUATE", "prereq": "1"}, {"module": "Unit V", "num": 36, "title": "Comprehensive VLSI System Verification & Capstone Architecture Defense", "subtopics": "Full-chip timing closure, design rule checking (DRC), layout vs schematic (LVS), synthesis defense", "bloom": "L6_CREATE", "prereq": "30"}];
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
    document.getElementById('currentLecBadge').innerText = `L${lec.num}: ${lec.title}`;
    document.getElementById('bloomBadge').innerText = lec.bloom || 'L3_APPLY';
    document.getElementById('lectureHeaderTitle').innerText = `Lecture ${lec.num}: ${lec.title}`;
    document.getElementById('lectureSubtopics').innerHTML = `<strong>Module:</strong> ${lec.module} &bull; <strong>Topics:</strong> ${lec.subtopics}`;

    // Reset Quiz
    document.getElementById('checkpointFeedback').style.display = 'none';
    
    // Update Math box
    const mathBox = document.getElementById('lectureMathFormula');
    mathBox.innerHTML = `$$ H(z) = \\frac{\\sum_{k=0}^{M} b_k z^{-k}}{1 + \\sum_{k=1}^{N} a_k z^{-k}} \\quad \\iff \\quad y[n] = \\sum_{k=0}^{M} b_k x[n-k] - \\sum_{k=1}^{N} a_k y[n-k] $$`;
    
    if (window.renderMathInElement) {
        renderMathInElement(mathBox);
    }

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

// Interactive Simulation Engine
const canvas = document.getElementById('interactiveCanvas');
const ctx = canvas.getContext('2d');

function initCanvas() {
    drawSimulation();
}

function updateSimulation() {
    const alpha = parseFloat(document.getElementById('sliderAlpha').value);
    const omega = parseFloat(document.getElementById('sliderOmega').value);
    document.getElementById('paramValAlpha').innerText = alpha.toFixed(2);
    document.getElementById('paramValOmega').innerText = omega.toFixed(2);
    drawSimulation();
}

function drawSimulation() {
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const alpha = parseFloat(document.getElementById('sliderAlpha').value);
    const omega = parseFloat(document.getElementById('sliderOmega').value);

    // Draw Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Center Axes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(width / 3, 0); ctx.lineTo(width / 3, height); ctx.stroke();

    // Plot 1: Dynamic Time Waveform / Impulse Response (Left / Middle)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < 40; i++) {
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
    }
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
    ctx.fillText(`Pole Magnitude |p|: ${alpha.toFixed(2)}`, 20, 30);
    ctx.fillText(alpha < 1.0 ? 'System: Stable (BIBO check)' : 'System: Unstable (Poles outside ROC)', 20, 50);
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
    document.getElementById('sliderAlpha').value = 0.50;
    document.getElementById('sliderOmega').value = 2.00;
    updateSimulation();
}

function checkAnswer(idx) {
    const feedback = document.getElementById('checkpointFeedback');
    feedback.style.display = 'block';
    if (idx === 1) {
        feedback.className = 'feedback-alert feedback-correct';
        feedback.innerHTML = '<strong>check Correct!</strong> For a causal LTI system, all poles must lie strictly inside the unit circle |z| &lt; 1 for the unit circle to be within the ROC.';
    } else {
        feedback.className = 'feedback-alert feedback-wrong';
        feedback.innerHTML = '<strong>Incorrect.</strong> Recall that BIBO stability requires sum |h[n]| &lt; infinity, which means the Fourier Transform exists and the unit circle |z|=1 lies inside the ROC.';
    }
}
