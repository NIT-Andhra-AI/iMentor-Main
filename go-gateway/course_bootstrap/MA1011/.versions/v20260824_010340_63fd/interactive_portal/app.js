// IIT / MIT Level Interactive Engineering Simulation Engine
const lecturesData = [{"module":"Unit I: Differential Calculus of functions of several variables","num":1,"title":"Review of Limit, continuity (sequential verification) and differentiability,","subtopics":"Review of Limit, continuity (sequential verification) and differentiability, Partial differentiation","bloom":"L2_UNDERSTAND","prereq":"None","is_lab":false},{"module":"Unit I: Differential Calculus of functions of several variables","num":2,"title":"Total differentiation","subtopics":"Total differentiation","bloom":"L2_UNDERSTAND","prereq":"L1","is_lab":false},{"module":"Unit I: Differential Calculus of functions of several variables","num":3,"title":"Euler’s theorem and generalization","subtopics":"Euler’s theorem and generalization","bloom":"L2_UNDERSTAND","prereq":"L2","is_lab":false},{"module":"Unit I: Differential Calculus of functions of several variables","num":4,"title":"Change of variables- Jacobians","subtopics":"Change of variables- Jacobians","bloom":"L2_UNDERSTAND","prereq":"L3","is_lab":false},{"module":"Unit I: Differential Calculus of functions of several variables","num":5,"title":"Maxima and minima of functions of several variables (2 and 3 variables)","subtopics":"Maxima and minima of functions of several variables (2 and 3 variables)","bloom":"L3_APPLY","prereq":"L4","is_lab":false},{"module":"Unit I: Differential Calculus of functions of several variables","num":6,"title":"Lagrange’s method of multipliers","subtopics":"Lagrange’s method of multipliers","bloom":"L3_APPLY","prereq":"L5","is_lab":false},{"module":"Unit I: Differential Calculus of functions of several variables","num":7,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 1)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L6","is_lab":false},{"module":"Unit I: Differential Calculus of functions of several variables","num":8,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 2)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L7","is_lab":false},{"module":"Unit I: Differential Calculus of functions of several variables","num":9,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 3)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L8","is_lab":false},{"module":"Unit I: Differential Calculus of functions of several variables","num":10,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 4)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L9","is_lab":false},{"module":"Unit I: Differential Calculus of functions of several variables","num":11,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 5)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L10","is_lab":false},{"module":"Unit I: Differential Calculus of functions of several variables","num":12,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 6)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L11","is_lab":false},{"module":"Unit II: Integral Calculus","num":13,"title":"Convergence of improper integrals","subtopics":"Convergence of improper integrals","bloom":"L3_APPLY","prereq":"L12","is_lab":false},{"module":"Unit II: Integral Calculus","num":14,"title":"Beta and Gamma integrals","subtopics":"Beta and Gamma integrals","bloom":"L3_APPLY","prereq":"L13","is_lab":false},{"module":"Unit II: Integral Calculus","num":15,"title":"Differentiation under integral sign","subtopics":"Differentiation under integral sign","bloom":"L3_APPLY","prereq":"L14","is_lab":false},{"module":"Unit II: Integral Calculus","num":16,"title":"Double and Triple integrals - computation of surface areas and volumes; change","subtopics":"Double and Triple integrals - computation of surface areas and volumes; change of variables in double and triple integrals","bloom":"L3_APPLY","prereq":"L15","is_lab":false},{"module":"Unit II: Integral Calculus","num":17,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 1)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L16","is_lab":false},{"module":"Unit II: Integral Calculus","num":18,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 2)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L17","is_lab":false},{"module":"Unit II: Integral Calculus","num":19,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 3)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L18","is_lab":false},{"module":"Unit II: Integral Calculus","num":20,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 4)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L19","is_lab":false},{"module":"Unit II: Integral Calculus","num":21,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 5)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L20","is_lab":false},{"module":"Unit II: Integral Calculus","num":22,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 6)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L21","is_lab":false},{"module":"Unit II: Integral Calculus","num":23,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 7)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L22","is_lab":false},{"module":"Unit II: Integral Calculus","num":24,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 8)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L23","is_lab":false},{"module":"Unit III: Vector Calculus","num":25,"title":"Scalar and vector fields; vector differentiation; level surfaces; directional","subtopics":"Scalar and vector fields; vector differentiation; level surfaces; directional derivative; gradient of a scalar field; divergence and curl of a vector field; Laplacian","bloom":"L4_ANALYZE","prereq":"L24","is_lab":false},{"module":"Unit III: Vector Calculus","num":26,"title":"Line and Surface integrals","subtopics":"Line and Surface integrals","bloom":"L4_ANALYZE","prereq":"L25","is_lab":false},{"module":"Unit III: Vector Calculus","num":27,"title":"Green’s theorem in a plane","subtopics":"Green’s theorem in a plane","bloom":"L4_ANALYZE","prereq":"L26","is_lab":false},{"module":"Unit III: Vector Calculus","num":28,"title":"Stokes’ theorem","subtopics":"Stokes’ theorem","bloom":"L4_ANALYZE","prereq":"L27","is_lab":false},{"module":"Unit III: Vector Calculus","num":29,"title":"Gauss Divergence theorem","subtopics":"Gauss Divergence theorem","bloom":"L4_ANALYZE","prereq":"L28","is_lab":false},{"module":"Unit III: Vector Calculus","num":30,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 1)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L29","is_lab":false},{"module":"Unit III: Vector Calculus","num":31,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 2)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L5_EVALUATE","prereq":"L30","is_lab":false},{"module":"Unit III: Vector Calculus","num":32,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 3)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L5_EVALUATE","prereq":"L31","is_lab":false},{"module":"Unit III: Vector Calculus","num":33,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 4)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L5_EVALUATE","prereq":"L32","is_lab":false},{"module":"Unit III: Vector Calculus","num":34,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 5)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L5_EVALUATE","prereq":"L33","is_lab":false},{"module":"Unit III: Vector Calculus","num":35,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 6)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L5_EVALUATE","prereq":"L34","is_lab":false},{"module":"Unit III: Vector Calculus","num":36,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 7)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L5_EVALUATE","prereq":"L35","is_lab":false}];
const courseCategory = "circuits";
const courseCode = "MA1011";
const correctIndex = 1;
const correctExpl = "Correct! At resonance, inductive and capacitive reactances cancel (X_L = X_C), leaving purely resistive minimum impedance Z = R at unity power factor.";
const wrongExpl = "Incorrect. At series resonance, X_L = X_C so the reactive part is zero, making Z = R (minimum) and power factor = 1.0.";

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
    ctx.fillText('Duty Cycle D: ' + D.toFixed(2) + ' (Ton: ' + (D*100).toFixed(0) + '%)', width - 260, 45);
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
    ctx.fillText('Peak Overshoot (%OS): ' + OS.toFixed(1) + '%', tStart + 200, 60);
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
