// MA2051: Complex Variables and Transform Techniques - High-Fidelity Interactive Learning Engine
// Styled and engineered after spkkarri/DSP-Course standard
const lecturesData = [{"module": "Unit I", "num": 1, "title": "Complex Variables", "subtopics": "Analytic function - Cauchy Riemann equations - Harmonic functions", "bloom": "L2_UNDERSTAND"}, {"module": "Unit I", "num": 2, "title": "-Conjugate functions - complex integration - line integrals in complex plane - Cauchy\u2019s", "subtopics": "-Conjugate functions - complex integration - line integrals in complex plane - Cauchy\u2019s", "bloom": "L3_APPLY"}, {"module": "Unit I", "num": 3, "title": "theorem (simple proof only), Cauchy\u2019s integral formula - Taylor\u2019s and Laurent\u2019s series", "subtopics": "theorem (simple proof only), Cauchy\u2019s integral formula - Taylor\u2019s and Laurent\u2019s series", "bloom": "L2_UNDERSTAND"}, {"module": "Unit I", "num": 4, "title": "expansions -zeros and singularities - Residues - residue theorem, use of residue theorem to", "subtopics": "expansions -zeros and singularities - Residues - residue theorem, use of residue theorem to", "bloom": "L3_APPLY"}, {"module": "Unit I", "num": 5, "title": "evaluate the real integrals without poles on the x-axis, Bilinear transformations, Conformal", "subtopics": "evaluate the real integrals without poles on the x-axis, Bilinear transformations, Conformal", "bloom": "L2_UNDERSTAND"}, {"module": "Unit I", "num": 6, "title": "mapping.", "subtopics": "mapping.", "bloom": "L3_APPLY"}, {"module": "Unit I", "num": 7, "title": "Fourier Series", "subtopics": "Expansion of a function in Fourier series for a given range- Convergence of", "bloom": "L2_UNDERSTAND"}, {"module": "Unit I", "num": 8, "title": "Fourier series - Half range sine and cosine expansions.", "subtopics": "Fourier series - Half range sine and cosine expansions.", "bloom": "L3_APPLY"}, {"module": "Unit I", "num": 9, "title": "Fourier Transforms", "subtopics": "Fourier transformation and inverse transforms - sine, cosine", "bloom": "L2_UNDERSTAND"}, {"module": "Unit I", "num": 10, "title": "transformations and inverse transforms - simple illustrations.", "subtopics": "transformations and inverse transforms - simple illustrations.", "bloom": "L3_APPLY"}, {"module": "Unit I", "num": 11, "title": "Partial Differential Equations", "subtopics": "Classification of Second order linear Partial Differential", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 12, "title": "Equations, D'alembert's solution of wave equation, Method of separation of variables -", "subtopics": "Equations, D'alembert's solution of wave equation, Method of separation of variables -", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 13, "title": "Solution of one dimensional wave equation, one dimensional heat conduction equation and", "subtopics": "Solution of one dimensional wave equation, one dimensional heat conduction equation and", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 14, "title": "two dimensional steady state heat conduction equation with illustrations.", "subtopics": "two dimensional steady state heat conduction equation with illustrations.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 15, "title": "Numerical Methods", "subtopics": "Bisection method, Secant method, Newton-Raphson method, Fixed-", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 16, "title": "point iteration scheme, Gaussian elimination, Jacobi, Gauss Seidel methods, Trapezoidal rule,", "subtopics": "point iteration scheme, Gaussian elimination, Jacobi, Gauss Seidel methods, Trapezoidal rule,", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 17, "title": "Simpson\u2019s 1/3, and 3/8-rules, Taylor series, Euler\u2019s method, Modified Euler\u2019s method, Runge-", "subtopics": "Simpson\u2019s 1/3, and 3/8-rules, Taylor series, Euler\u2019s method, Modified Euler\u2019s method, Runge-", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 18, "title": "Kutta method.", "subtopics": "Kutta method.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 19, "title": "Text Books", "subtopics": "", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 20, "title": "1. R.K. Jain and S.R.K. Iyengar, Advanced Engineering Mathematics, Narosa", "subtopics": "1. R.K. Jain and S.R.K. Iyengar, Advanced Engineering Mathematics, Narosa", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 21, "title": "th", "subtopics": "th", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 22, "title": "Publishing House, 5 edition, 2016.", "subtopics": "Publishing House, 5 edition, 2016.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 23, "title": "2. E. Kreyszig, Advanced Engineering Mathematics, John Wiley and Sons, 8thedition,", "subtopics": "2. E. Kreyszig, Advanced Engineering Mathematics, John Wiley and Sons, 8thedition,", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 24, "title": "2008.", "subtopics": "2008.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 25, "title": "th", "subtopics": "th", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 26, "title": "3. B.S. Grewal, Higher Engineering Mathematics, Khanna Publications,44 edition,", "subtopics": "3. B.S. Grewal, Higher Engineering Mathematics, Khanna Publications,44 edition,", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 27, "title": "2017.", "subtopics": "2017.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 28, "title": "Reference Books", "subtopics": "", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 29, "title": "1. M. Spiegel, S. Lipschutz , J. Schiller, and D. Spellman, Complex Variable (Schaum's", "subtopics": "1. M. Spiegel, S. Lipschutz , J. Schiller, and D. Spellman, Complex Variable (Schaum's", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 30, "title": "Outlines), Revised 2nd edition, 2017.", "subtopics": "Outlines), Revised 2nd edition, 2017.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 31, "title": "2. R.V. Churchill and J.W. Brown, Complex variables and its applications, McGraw Hill,", "subtopics": "2. R.V. Churchill and J.W. Brown, Complex variables and its applications, McGraw Hill,", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 32, "title": "2009.", "subtopics": "2009.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 33, "title": "Scheme and Syllabi 36 | Page", "subtopics": "Scheme and Syllabi 36 | Page", "bloom": "L4_ANALYZE"}, {"module": "Unit V", "num": 34, "title": "Deep Industrial Case Study: Safety-Critical Deployment of Complex Variables And Transform Techniques", "subtopics": "Production architecture, failure mode analysis (FMEA), trade-off Pareto curve", "bloom": "L5_EVALUATE"}, {"module": "Unit V", "num": 35, "title": "Emerging Research Frontiers: Physics-Informed Neural Networks & Modern Trends", "subtopics": "PINNs, digital twins, data-driven system identification, quantum computing extensions", "bloom": "L5_EVALUATE"}, {"module": "Unit V", "num": 36, "title": "End-to-End System Design Verification, Synthesis Defense & Capstone Review in Complex Variables And Transform Techniques", "subtopics": "Complete system verification, performance validation against specs, synthesis review", "bloom": "L6_CREATE"}];
const courseCategory = "circuits";
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
