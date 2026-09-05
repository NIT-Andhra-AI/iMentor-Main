// EE2061: Control Systems - High-Fidelity Interactive Learning Engine
// Styled and engineered after spkkarri/DSP-Course standard
const lecturesData = [{"module": "Unit I", "num": 1, "title": "Control system terminology, examples of simple control systems, open loop and closed loop", "subtopics": "Control system terminology, examples of simple control systems, open loop and closed loop", "bloom": "L2_UNDERSTAND"}, {"module": "Unit I", "num": 2, "title": "control systems, Types of control systems.", "subtopics": "control systems, Types of control systems.", "bloom": "L3_APPLY"}, {"module": "Unit I", "num": 3, "title": "Mathematical Models of Physical Systems", "subtopics": "Analogy with mechanical systems, formulation", "bloom": "L2_UNDERSTAND"}, {"module": "Unit I", "num": 4, "title": "of differential equations for electrical systems transfer functions of open and closed loop", "subtopics": "of differential equations for electrical systems transfer functions of open and closed loop", "bloom": "L3_APPLY"}, {"module": "Unit I", "num": 5, "title": "systems, DC & AC servomotors, synchro pair as error detector, block diagram representation", "subtopics": "systems, DC & AC servomotors, synchro pair as error detector, block diagram representation", "bloom": "L2_UNDERSTAND"}, {"module": "Unit I", "num": 6, "title": "of control systems", "subtopics": "block diagram algebra, signal flow graph, Mason\u2019s gain formula.", "bloom": "L3_APPLY"}, {"module": "Unit I", "num": 7, "title": "Time Domain Analysis", "subtopics": "Standard test signals \u2013 step, ramp, parabolic, and impulse; impulse", "bloom": "L2_UNDERSTAND"}, {"module": "Unit I", "num": 8, "title": "response, characteristic equation of feedback systems, transient response of first order and", "subtopics": "response, characteristic equation of feedback systems, transient response of first order and", "bloom": "L3_APPLY"}, {"module": "Unit I", "num": 9, "title": "second order systems to standard test signals, time domain specifications, steady-state error", "subtopics": "second order systems to standard test signals, time domain specifications, steady-state error", "bloom": "L2_UNDERSTAND"}, {"module": "Unit I", "num": 10, "title": "and error constants, introduction to P, PI, PID controllers.", "subtopics": "and error constants, introduction to P, PI, PID controllers.", "bloom": "L3_APPLY"}, {"module": "Unit I", "num": 11, "title": "Stability Analysis", "subtopics": "Concept of stability and conditions for stability, Routh \u2013 Hurwitz criterion,", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 12, "title": "dominant poles of transfer function.", "subtopics": "dominant poles of transfer function.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 13, "title": "Root Locus Technique", "subtopics": "The root locus concept, basic properties, magnitude and angle", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 14, "title": "conditions, properties and construction of the complex root loci, effects of adding poles and", "subtopics": "conditions, properties and construction of the complex root loci, effects of adding poles and", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 15, "title": "zeros to G(s) H(s) on the root loci.", "subtopics": "zeros to G(s) H(s) on the root loci.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 16, "title": "Frequency Response Analysis", "subtopics": "Introduction, frequency response specifications, correlation", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 17, "title": "between time and frequency response, specifications, stability analysis from Bode plot,", "subtopics": "between time and frequency response, specifications, stability analysis from Bode plot,", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 18, "title": "Nyquist plot, effect of adding poles & zeros to G(s) H(s) on the shape of polar plots.", "subtopics": "Nyquist plot, effect of adding poles & zeros to G(s) H(s) on the shape of polar plots.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 19, "title": "Introduction to lead, lag, lead-lag compensation techniques.", "subtopics": "Introduction to lead, lag, lead-lag compensation techniques.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 20, "title": "State Space Analysis", "subtopics": "State variables, State equations, converting a transfer function to state", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 21, "title": "space, converting from state space to a transfer function, Laplace transform solution of state", "subtopics": "space, converting from state space to a transfer function, Laplace transform solution of state", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 22, "title": "equations, time-domain solution of state equations, concept of controllability and observability.", "subtopics": "equations, time-domain solution of state equations, concept of controllability and observability.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 23, "title": "Text Books", "subtopics": "", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 24, "title": "1. J Nagrath & M Gopal, \u201cControl System Engineering\u201d, 7th Edition New Age International", "subtopics": "1. J Nagrath & M Gopal, \u201cControl System Engineering\u201d, 7th Edition New Age International", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 25, "title": "Publication, New Delhi 2021.", "subtopics": "Publication, New Delhi 2021.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 26, "title": "2. B.C. Kuo,\u201d Automatic Control Systems\u201d, Prentice Hall India Publications, NewDelhi,", "subtopics": "2. B.C. Kuo,\u201d Automatic Control Systems\u201d, Prentice Hall India Publications, NewDelhi,", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 27, "title": "Eighth Edition,2014.", "subtopics": "Eighth Edition,2014.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 28, "title": "Reference Books", "subtopics": "", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 29, "title": "1. Norman S. Nise \u201cControl Systems Engineering\u201d, 7th edition, Wiley, 2018", "subtopics": "1. Norman S. Nise \u201cControl Systems Engineering\u201d, 7th edition, Wiley, 2018", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 30, "title": "2. William Bolton \u201cControl Systems\u201d Newnes, 2002", "subtopics": "2. William Bolton \u201cControl Systems\u201d Newnes, 2002", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 31, "title": "3. William S. Levine \u201cControl System Fundamentals\u201d CRC Press, 2010", "subtopics": "3. William S. Levine \u201cControl System Fundamentals\u201d CRC Press, 2010", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 32, "title": "4. K. Warwick \u201cControl systems", "subtopics": "an introduction\u201d Prentice Hall, 1989", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 33, "title": "5. M. Gopal \u201cControl Systems", "subtopics": "Principles and Design\u201d Tata McGraw-Hill Education, 2002", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 34, "title": "Scheme and Syllabi 43 | Page", "subtopics": "Scheme and Syllabi 43 | Page", "bloom": "L4_ANALYZE"}, {"module": "Unit V", "num": 35, "title": "Emerging Research Frontiers: Physics-Informed Neural Networks & Modern Trends", "subtopics": "PINNs, digital twins, data-driven system identification, quantum computing extensions", "bloom": "L5_EVALUATE"}, {"module": "Unit V", "num": 36, "title": "End-to-End System Design Verification, Synthesis Defense & Capstone Review in Control Systems", "subtopics": "Complete system verification, performance validation against specs, synthesis review", "bloom": "L6_CREATE"}];
const courseCategory = "control";
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
