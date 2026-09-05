// EE3731: Power System Security and Reliability - High-Fidelity Interactive Learning Engine
// Styled and engineered after spkkarri/DSP-Course standard
const lecturesData = [{"module": "Unit I", "num": 1, "title": "Preliminaries for Power System Security Problems", "subtopics": "Per unit quantities - modeling of", "bloom": "L2_UNDERSTAND"}, {"module": "Unit I", "num": 2, "title": "generators, transformers, off-nominal tap setting and phase shifting transformers,", "subtopics": "generators, transformers, off-nominal tap setting and phase shifting transformers,", "bloom": "L3_APPLY"}, {"module": "Unit I", "num": 3, "title": "transmission lines and loads. Primitive parameters - bus admittance matrix - bus impedance", "subtopics": "transmission lines and loads. Primitive parameters - bus admittance matrix - bus impedance", "bloom": "L2_UNDERSTAND"}, {"module": "Unit I", "num": 4, "title": "matrix - reduction due to zero bus currents and zero bus voltages - solution through factored", "subtopics": "matrix - reduction due to zero bus currents and zero bus voltages - solution through factored", "bloom": "L3_APPLY"}, {"module": "Unit I", "num": 5, "title": "matrices - solution of non-linear algebraic equation and non-linear differential equations.", "subtopics": "matrices - solution of non-linear algebraic equation and non-linear differential equations.", "bloom": "L2_UNDERSTAND"}, {"module": "Unit I", "num": 6, "title": "Power System Security Assessment & Security Constrained Optimization", "subtopics": "Network", "bloom": "L3_APPLY"}, {"module": "Unit I", "num": 7, "title": "sensitivity factors, contingency selection, contingency ranking, performance indices and", "subtopics": "sensitivity factors, contingency selection, contingency ranking, performance indices and", "bloom": "L2_UNDERSTAND"}, {"module": "Unit I", "num": 8, "title": "methods, direct methods, indirect methods, sensitivity factors, generation shift factors, line", "subtopics": "methods, direct methods, indirect methods, sensitivity factors, generation shift factors, line", "bloom": "L3_APPLY"}, {"module": "Unit I", "num": 9, "title": "outage distribution factors, basis of evolutionary optimization techniques, preventive,", "subtopics": "outage distribution factors, basis of evolutionary optimization techniques, preventive,", "bloom": "L2_UNDERSTAND"}, {"module": "Unit I", "num": 10, "title": "emergency and restorative controls though non-linear programming and linear programming", "subtopics": "emergency and restorative controls though non-linear programming and linear programming", "bloom": "L3_APPLY"}, {"module": "Unit I", "num": 11, "title": "methods", "subtopics": "methods", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 12, "title": "Basic Reliability Concepts", "subtopics": "The general reliability function, exponential distribution \u2013 mean", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 13, "title": "time to failures \u2013 series and parallel systems. Markov process \u2013 continuous markov process", "subtopics": "time to failures \u2013 series and parallel systems. Markov process \u2013 continuous markov process", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 14, "title": "\u2013 recursive techniques \u2013 simple series and parallel system models.", "subtopics": "\u2013 recursive techniques \u2013 simple series and parallel system models.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 15, "title": "Generating Capacity \u2013 Basic Probability Methods", "subtopics": "The generation system model \u2013 loss of", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 16, "title": "load indices \u2013 capacity expansion analysis \u2013 scheduled outages. Load forecast uncertainty", "subtopics": "load indices \u2013 capacity expansion analysis \u2013 scheduled outages. Load forecast uncertainty", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 17, "title": "loss of energy indices. The frequency and duration method.", "subtopics": "loss of energy indices. The frequency and duration method.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 18, "title": "Transmission Systems Reliability Evaluation", "subtopics": "Radial configuration \u2013 conditional probability", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 19, "title": "approach \u2013 network configurations \u2013 state selection.", "subtopics": "approach \u2013 network configurations \u2013 state selection.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 20, "title": "Text Books", "subtopics": "", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 21, "title": "1. Roy Billinton and Ronald Allan Pitam", "subtopics": "Reliability Evaluation of Power Systems,1996.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 22, "title": "2. J. Endremyl", "subtopics": "Reliability Modelling in Electric Power Systems, John Wiley, 2005.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 23, "title": "3. G W Stagg and A H El Abiad, \u201cComputer Methods in Power System Analysis\u201d, McGraw", "subtopics": "3. G W Stagg and A H El Abiad, \u201cComputer Methods in Power System Analysis\u201d, McGraw", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 24, "title": "Hill, 1968.", "subtopics": "Hill, 1968.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 25, "title": "Reference Books", "subtopics": "", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 26, "title": "1. J J Grainger and W D Stevension, \u201cPower System Analysis\u201d, McGraw-Hill, Inc., 1994.", "subtopics": "1. J J Grainger and W D Stevension, \u201cPower System Analysis\u201d, McGraw-Hill, Inc., 1994.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 27, "title": "2. D P Kothori and I J Nagrath, \u201cModern Power System Analysis\u201d, Tata McGraw Hill", "subtopics": "2. D P Kothori and I J Nagrath, \u201cModern Power System Analysis\u201d, Tata McGraw Hill", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 28, "title": "Education Private Limited, 2011.", "subtopics": "Education Private Limited, 2011.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 29, "title": "3. Hadi Saadat, \u201cPower System Analysis\u201d McGraw-Hill, 2004. 6. M A Pai,\u201d Computer", "subtopics": "3. Hadi Saadat, \u201cPower System Analysis\u201d McGraw-Hill, 2004. 6. M A Pai,\u201d Computer", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 30, "title": "Techniques in Power System Analysis\u201d, Tata McGraw Publishing Company Limited,", "subtopics": "Techniques in Power System Analysis\u201d, Tata McGraw Publishing Company Limited,", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 31, "title": "2006.", "subtopics": "2006.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 32, "title": "4. K.R.PADIYAR , Power System Dynamics", "subtopics": "Stability and Control, II Edition,", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 33, "title": "B.S.Publications.", "subtopics": "B.S.Publications.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 34, "title": "5. P.M. Anderson and A.A. Fouad, Power system control and stability, John Wiley & sons.", "subtopics": "5. P.M. Anderson and A.A. Fouad, Power system control and stability, John Wiley & sons.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 35, "title": "Scheme and Syllabi 75 | Page", "subtopics": "Scheme and Syllabi 75 | Page", "bloom": "L4_ANALYZE"}, {"module": "Unit V", "num": 36, "title": "End-to-End System Design Verification, Synthesis Defense & Capstone Review in Power System Security And Reliability", "subtopics": "Complete system verification, performance validation against specs, synthesis review", "bloom": "L6_CREATE"}];
const courseCategory = "power_systems";
let currentLecIndex = 0;
let isAnimating = true;
let animFrameId = null;
let simTime = 0;

document.addEventListener('DOMContentLoaded', () => {
    loadLecture(1);
    initSimulator();
    if (window.renderMathInElement) {
        renderMathInElement(document.body, {
            delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false },
                { left: "\(", right: "\)", display: false },
                { left: "\[", right: "\]", display: true }
            ]
        });
    }
});

function loadLecture(num) {
    const idx = lecturesData.findIndex(l => l.num === num);
    if (idx === -1) return;
    currentLecIndex = idx;
    const lec = lecturesData[idx];

    // Update active lecture in sidebar
    document.querySelectorAll('.lecture-item').forEach(item => {
        item.classList.toggle('active', parseInt(item.getAttribute('data-lecture')) === num);
    });

    // Update Header
    document.getElementById('currentLecBadge').innerText = `Lecture ${lec.num}: ${lec.title}`;
    document.getElementById('bloomBadge').innerText = lec.bloom || 'L3_APPLY';
    document.getElementById('lectureSubtopics').innerHTML = `<strong>Module:</strong> ${lec.module} &bull; <strong>Topics:</strong> ${lec.subtopics || 'Foundational Principles'}`;

    // Reset Checkpoint feedback
    const fb = document.getElementById('checkpointFeedback');
    if (fb) fb.style.display = 'none';

    // Rerender KaTeX if applicable
    if (window.renderMathInElement) {
        renderMathInElement(document.getElementById('theoryDesc'));
    }
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

function toggleAccordion(el) {
    const acc = el.parentElement;
    acc.classList.toggle('open');
}

// Block Diagram interactive inspection
const blockDetails = {
    data: { title: "Data Preprocessing & Feature Pipeline", desc: "Performs standard scaling \(z = (x - \mu)/\sigma\), missing value imputation, and feature extraction to condition the input manifold." },
    forward: { title: "Forward Activation & Affine Maps", desc: "Computes affine transformation \(z = Wx + b\) followed by elementwise non-linear activations (ReLU, Sigmoid) to project into latent space." },
    loss: { title: "Objective Function / Empirical Risk", desc: "Measures discrepancy between predictions and ground-truth using convex MSE or Cross-Entropy \(\mathcal{L} = -\sum y \log \hat{y}\)." },
    backprop: { title: "Gradient Backpropagation", desc: "Applies the chain rule recursively through computational graph tensors to calculate parameter partial derivatives \(\frac{\partial \mathcal{L}}{\partial W}\)." },
    inference: { title: "Model Inference & Decision Boundary", desc: "Projects final separating hyperplanes or regression surfaces across the validation feature manifold with bounded confidence." },
    source: { title: "Continuous AC/DC Signal Source", desc: "Delivers energetic excitation \(v_{in}(t) = V_m \sin(\omega t)\) or transient step input into the connected reactive network." },
    inductor: { title: "Inductive Choke Storage", desc: "Stores kinetic magnetic energy \(E_L = \frac{1}{2} L I^2\) and opposes instantaneous current variations via Lenz's law." },
    resistor: { title: "Damping Resistor", desc: "Dissipates circuit energy thermally via Joule heating \(P = I^2 R\), providing exponential transient damping \(e^{-\alpha t}\)." },
    capacitor: { title: "Capacitive Storage Tank", desc: "Stores electrostatic potential energy \(E_C = \frac{1}{2} C V^2\) and buffers charge to establish resonance frequency." },
    output: { title: "Terminal Load & Matching", desc: "Receives filtered electrical power; achieves maximum power transfer when load matches Thevenin impedance \(R_L = R_{th}\)." }
};

function selectBlock(key) {
    document.querySelectorAll('.diagram-node').forEach(node => node.classList.remove('active-block'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active-block');
    }
    const detail = blockDetails[key] || { title: "System Component", desc: "Operational stage contributing to closed-loop dynamics." };
    document.getElementById('diagramInfoTitle').innerText = detail.title;
    document.getElementById('diagramInfoDesc').innerText = detail.desc;
    if (window.renderMathInElement) {
        renderMathInElement(document.getElementById('diagramInfoDesc'));
    }
}

// Canvas Simulation Engine
const canvas = document.getElementById('interactiveCanvas');
const ctx = canvas.getContext('2d');

function initSimulator() {
    handleParamChange();
    startLoop();
}

function startLoop() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    function loop() {
        if (isAnimating) {
            simTime += 0.03;
        }
        renderSimulation();
        animFrameId = requestAnimationFrame(loop);
    }
    animFrameId = requestAnimationFrame(loop);
}

function toggleAnimation() {
    isAnimating = !isAnimating;
}

function resetSimulation() {
    simTime = 0;
    handleParamChange();
}

function handleParamChange() {
    const p1 = parseFloat(document.getElementById('sliderParam1').value);
    const p2 = parseFloat(document.getElementById('sliderParam2').value);
    const p3 = parseFloat(document.getElementById('sliderParam3').value);

    document.getElementById('valParam1').innerText = p1.toFixed(2);
    document.getElementById('valParam2').innerText = p2.toFixed(2);
    document.getElementById('valParam3').innerText = p3.toFixed(2);

    updateStatusPill(p1, p2, p3);
}

function updateStatusPill(p1, p2, p3) {
    const pill = document.getElementById('statusPill');
    if (!pill) return;

    if (courseCategory === "ml" || courseCategory === "drl") {
        if (p1 > 0.85) {
            pill.className = "status-pill danger";
            pill.innerHTML = "&bull; Divergence / Exploding Gradient";
        } else if (p1 < 0.04) {
            pill.className = "status-pill warning";
            pill.innerHTML = "&bull; Vanishing / Stalled Step";
        } else {
            pill.className = "status-pill success";
            pill.innerHTML = "&bull; Optimal Gradient Descent";
        }
    } else if (courseCategory === "circuits") {
        const R = p1, L = p2 * 1e-3, C = p3 * 1e-6;
        const alpha = R / (2 * L);
        const w0 = 1 / Math.sqrt(L * C);
        const zeta = alpha / w0;
        if (zeta < 0.95) {
            pill.className = "status-pill warning";
            pill.innerHTML = `&bull; Underdamped (&zeta; = ${zeta.toFixed(2)})`;
        } else if (zeta > 1.05) {
            pill.className = "status-pill success";
            pill.innerHTML = `&bull; Overdamped (&zeta; = ${zeta.toFixed(2)})`;
        } else {
            pill.className = "status-pill success";
            pill.innerHTML = "&bull; Critically Damped (&zeta; &approx; 1.00)";
        }
    } else if (courseCategory === "control") {
        const zeta = p1, wn = p2, K = p3;
        if (zeta < 0.2 || K > 25) {
            pill.className = "status-pill danger";
            pill.innerHTML = "&bull; High Overshoot &gt; 50%";
        } else if (zeta > 1.1) {
            pill.className = "status-pill warning";
            pill.innerHTML = "&bull; Sluggish Overdamped";
        } else {
            pill.className = "status-pill success";
            pill.innerHTML = `&bull; Optimal Response (&zeta; = ${zeta.toFixed(2)})`;
        }
    } else if (courseCategory === "power_electronics" || courseCategory === "machines") {
        const D = p1, fsw = p2;
        if (D > 0.85) {
            pill.className = "status-pill warning";
            pill.innerHTML = "&bull; High Duty Saturation Warning";
        } else if (fsw < 25) {
            pill.className = "status-pill danger";
            pill.innerHTML = "&bull; High Inductor Ripple &Delta;I_L";
        } else {
            pill.className = "status-pill success";
            pill.innerHTML = "&bull; Safe CCM Operation";
        }
    } else {
        pill.className = "status-pill success";
        pill.innerHTML = "&bull; Stable LTI Trajectory";
    }
}

function drawGrid(w, h) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); ctx.stroke();
}

function renderSimulation() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    drawGrid(w, h);

    const p1 = parseFloat(document.getElementById('sliderParam1').value);
    const p2 = parseFloat(document.getElementById('sliderParam2').value);
    const p3 = parseFloat(document.getElementById('sliderParam3').value);

    if (courseCategory === "ml" || courseCategory === "drl") {
        const cx = w/2, cy = h/2;
        const gamma = p3;
        
        ctx.lineWidth = 1.2;
        for (let r = 25; r <= 140; r += 25) {
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.15 + r/300})`;
            ctx.beginPath();
            ctx.ellipse(cx, cy, r * (1 + gamma * 0.1), r * 0.8, -0.2, 0, Math.PI * 2);
            ctx.stroke();
        }

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
        for (let i = 0; i < steps; i++) {
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
        }
        ctx.stroke();

        ctx.fillStyle = "#f3f4f6";
        ctx.font = "12px 'Fira Code', monospace";
        ctx.fillText(`Global Optimum W*=(0,0)  |  Loss J = ${Math.max(0.01, 1.2 / (1 + p1 * 5)).toFixed(3)}`, 20, 26);

    } else if (courseCategory === "circuits") {
        const R = p1, L = p2 * 1e-3, C = p3 * 1e-6;
        const alpha = R / (2 * L);
        const w0 = 1 / Math.sqrt(L * C);
        const zeta = alpha / w0;
        const wd = w0 * Math.sqrt(Math.max(0, 1 - zeta * zeta));

        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        for (let px = 0; px < w; px++) {
            const t = (px / w) * 0.02;
            let v = 0;
            if (zeta < 1.0) {
                v = 100 * Math.exp(-alpha * t) * Math.cos(wd * t - simTime * 5);
            } else {
                v = 100 * Math.exp(-alpha * t);
            }
            const py = (h/2) - v;
            if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();

        ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (let px = 0; px < w; px++) {
            const t = (px / w) * 0.02;
            const env = 100 * Math.exp(-alpha * t);
            const py = (h/2) - env;
            if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#0dd5c5";
        ctx.font = "12px 'Fira Code', monospace";
        ctx.fillText(`w0 = ${w0.toFixed(0)} rad/s  |  zeta = ${zeta.toFixed(2)}  |  alpha = ${alpha.toFixed(0)} Np/s`, 20, 26);

    } else if (courseCategory === "control") {
        const zeta = p1, wn = p2;
        const wd = wn * Math.sqrt(Math.max(0, 1 - zeta * zeta));
        const phi = Math.atan2(Math.sqrt(Math.max(0, 1 - zeta * zeta)), zeta);

        ctx.strokeStyle = "#0dd5c5";
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        for (let px = 0; px < w; px++) {
            const t = (px / w) * 5.0;
            let y = 1.0;
            if (zeta < 1.0) {
                y = 1.0 - (Math.exp(-zeta * wn * t) / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t + phi);
            } else {
                y = 1.0 - Math.exp(-zeta * wn * t) * (1 + wn * t);
            }
            const py = (h - 60) - y * 180;
            if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
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
        ctx.fillText(`Overshoot Mp = ${Mp.toFixed(1)}%  |  Settling ts = ${ts.toFixed(2)}s  |  wn = ${wn.toFixed(1)} rad/s`, 20, 26);

    } else {
        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let px = 0; px < w; px++) {
            const t = (px / w) * 6 * Math.PI;
            const yVal = (h/2) + Math.sin(t * p2 * 0.2 + simTime) * 80 * Math.exp(-p1 * 0.1 * (px / w * 5));
            if (px === 0) ctx.moveTo(px, yVal); else ctx.lineTo(px, yVal);
        }
        ctx.stroke();

        ctx.fillStyle = "#0dd5c5";
        ctx.font = "12px 'Fira Code', monospace";
        ctx.fillText(`State Vector Dynamic x(t)  |  Damping = ${p1.toFixed(2)}  |  Freq = ${p2.toFixed(2)}`, 20, 26);
    }
}

function checkAnswer(chosenIdx) {
    const fb = document.getElementById('checkpointFeedback');
    fb.style.display = 'block';
    if (chosenIdx === 0) {
        fb.className = 'feedback-alert feedback-correct';
        fb.innerHTML = '<strong>✓ Correct!</strong> Outstanding analysis. Your answer perfectly matches the foundational engineering criterion.';
    } else {
        fb.className = 'feedback-alert feedback-wrong';
        fb.innerHTML = '<strong>✗ Incorrect.</strong> Review the governing equations and parameter relationships above before re-attempting.';
    }
}
