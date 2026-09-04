// DSP / Engineering Interactive Learning Engine
const lecturesData = [{"module": "Unit I", "num": 1, "title": "Physical Foundations & Governing Conservation Laws of Quantum Information And Quantum Computing", "subtopics": "Physical principles, conservation laws, state definitions, domain boundaries", "bloom": "L2_UNDERSTAND", "prereq": "None"}, {"module": "Unit I", "num": 2, "title": "State Variable Formulation & Continuous-Time Differential Equations in Quantum Information And Quantum Computing", "subtopics": "Governing differential equations, state vector definition, input-output representations", "bloom": "L3_APPLY", "prereq": "1"}, {"module": "Unit I", "num": 3, "title": "Transform Domain Methods (Laplace, Fourier & Z-Transforms)", "subtopics": "Complex frequency transformation, s-domain impedance, region of convergence", "bloom": "L3_APPLY", "prereq": "2"}, {"module": "Unit I", "num": 4, "title": "Matrix Canonical Representations & Coupled Dynamical Systems", "subtopics": "Companion forms, modal decomposition, decoupled state equations", "bloom": "L3_APPLY", "prereq": "2"}, {"module": "Unit I", "num": 5, "title": "Energy, Power & Constitutive Relations in Complex Networks", "subtopics": "Energy storage elements, power dissipation functions, Hamiltonian / Lagrangian views", "bloom": "L3_APPLY", "prereq": "1"}, {"module": "Unit I", "num": 6, "title": "Equilibrium States, Operating Point Analysis & Small-Signal Linearization", "subtopics": "Nonlinear systems, Jacobian matrix linearization, perturbation dynamics", "bloom": "L4_ANALYZE", "prereq": "2"}, {"module": "Unit I", "num": 7, "title": "Boundary Conditions, Spatial Discretization & Lumped Approximations", "subtopics": "Spatial differential operators, lumped element validity criteria, boundary values", "bloom": "L4_ANALYZE", "prereq": "6"}, {"module": "Unit II", "num": 8, "title": "First and Second Order Transient Dynamics in Quantum Information And Quantum Computing", "subtopics": "Step/impulse response, time constants, damping ratio, natural frequency, overshoot metrics", "bloom": "L4_ANALYZE", "prereq": "2"}, {"module": "Unit II", "num": 9, "title": "Frequency Response, Asymptotic Bode Formulations & Group Delay", "subtopics": "Logarithmic magnitude/phase plots, corner frequencies, resonant peak, phase delay", "bloom": "L4_ANALYZE", "prereq": "3"}, {"module": "Unit II", "num": 10, "title": "Algebraic Stability Criteria (Routh-Hurwitz / Schur-Cohn Criteria)", "subtopics": "Characteristic polynomial, BIBO stability conditions, special cases in Routh array", "bloom": "L4_ANALYZE", "prereq": "8"}, {"module": "Unit II", "num": 11, "title": "Geometric Stability & Root Locus Trajectory Mapping", "subtopics": "Angle and magnitude criteria, asymptotes, breakaway points, imaginary axis crossings", "bloom": "L4_ANALYZE", "prereq": "10"}, {"module": "Unit II", "num": 12, "title": "Nyquist Encirclement Criterion & Principle of the Argument", "subtopics": "Cauchy argument principle, open-loop contour mapping, gain margin & phase margin", "bloom": "L5_EVALUATE", "prereq": "10"}, {"module": "Unit II", "num": 13, "title": "State Transition Matrix e^(At), Matrix Exponentials & Cayley-Hamilton", "subtopics": "Computation methods for e^(At), Laplace inversion, Cayley-Hamilton matrix theorem", "bloom": "L4_ANALYZE", "prereq": "4"}, {"module": "Unit II", "num": 14, "title": "Controllability and Observability (Kalman Rank Conditions & Gramians)", "subtopics": "Controllability matrix rank, Observability matrix rank, duality, PBH rank tests", "bloom": "L5_EVALUATE", "prereq": "13"}, {"module": "Unit III", "num": 15, "title": "Feedback System Topologies & Closed-Loop Gain Sensitivity in Quantum Information And Quantum Computing", "subtopics": "Open-loop vs closed-loop sensitivity derivatives, disturbance rejection properties", "bloom": "L4_ANALYZE", "prereq": "9"}, {"module": "Unit III", "num": 16, "title": "Lead, Lag & Lag-Lead Compensator Frequency-Domain Design", "subtopics": "Phase lead margin boost, phase lag steady-state error reduction, lag-lead cascade", "bloom": "L5_EVALUATE", "prereq": "15"}, {"module": "Unit III", "num": 17, "title": "State Feedback Pole Placement & Ackermann's Gain Formula", "subtopics": "Full state feedback u = -Kx + r, desired closed-loop pole placement, Ackermann formulation", "bloom": "L5_EVALUATE", "prereq": "14"}, {"module": "Unit III", "num": 18, "title": "Full-Order & Reduced-Order Luenberger State Observer Synthesis", "subtopics": "Observer error dynamics, observer gain L design, separation principle theorem", "bloom": "L5_EVALUATE", "prereq": "17"}, {"module": "Unit III", "num": 19, "title": "Optimal Control & Linear Quadratic Regulator (LQR) Formulation", "subtopics": "Quadratic cost functional J, Algebraic Riccati Equation (ARE), state weighting Q/R", "bloom": "L5_EVALUATE", "prereq": "17"}, {"module": "Unit III", "num": 20, "title": "Numerical Simulation Solvers (Runge-Kutta, Forward/Backward Euler)", "subtopics": "Explicit vs implicit time-marching solvers, numerical stability regions, stiff systems", "bloom": "L4_ANALYZE", "prereq": "2"}, {"module": "Unit III", "num": 21, "title": "Constrained Parameter Optimization & Gradient Descent Formulations", "subtopics": "Lagrangian multipliers, KKT conditions, gradient descent with momentum, line search", "bloom": "L5_EVALUATE", "prereq": "20"}, {"module": "Unit III", "num": 22, "title": "Discrete-Time State-Space Representation & Sampling Period Selection", "subtopics": "Zero-order hold discretization, discrete A_d and B_d matrices, Shannon sampling rule", "bloom": "L4_ANALYZE", "prereq": "13"}, {"module": "Unit IV", "num": 23, "title": "Fixed-Point vs Floating-Point Quantization & Finite Wordlength Effects", "subtopics": "Dynamic range, precision trade-offs, scaling techniques, overflow characteristics", "bloom": "L4_ANALYZE", "prereq": "22"}, {"module": "Unit IV", "num": 24, "title": "Signal-to-Noise Ratio (SNR), Noise Floor & Quantization Noise Models", "subtopics": "Uniform quantization noise, SNR formulas, thermal noise and Johnson-Nyquist limits", "bloom": "L4_ANALYZE", "prereq": "23"}, {"module": "Unit IV", "num": 25, "title": "Non-Linear Dynamics, Limit Cycles, Saturation & Windup Phenomena", "subtopics": "Describing functions, phase-plane portraits, limit cycles, integrator windup", "bloom": "L5_EVALUATE", "prereq": "6"}, {"module": "Unit IV", "num": 26, "title": "Anti-Windup Compensation & Actuator Saturation Protection", "subtopics": "Back-calculation anti-windup, conditional integration, rate-limiters", "bloom": "L5_EVALUATE", "prereq": "25"}, {"module": "Unit IV", "num": 27, "title": "Robust Stability Bounds, Parametric Uncertainty & H-Infinity Fundamentals", "subtopics": "Small-gain theorem, structured singular values mu, unstructured additive uncertainty", "bloom": "L5_EVALUATE", "prereq": "12"}, {"module": "Unit IV", "num": 28, "title": "Fault Detection, Isolation (FDI) & Residual Generator Design", "subtopics": "Model-based fault diagnosis, parity equations, observer-based residual generation", "bloom": "L5_EVALUATE", "prereq": "18"}, {"module": "Unit IV", "num": 29, "title": "Real-Time Operating Systems (RTOS), Task Scheduling & Latency Budgets", "subtopics": "Rate monotonic scheduling (RMS), earliest deadline first (EDF), jitter mitigation", "bloom": "L5_EVALUATE", "prereq": "22"}, {"module": "Unit V", "num": 30, "title": "IEEE / ISO Industrial Engineering Standards & Compliance Verification in Quantum Information And Quantum Computing", "subtopics": "Safety standards (ISO 26262 / IEC 61508), validation methodologies, SIL ratings", "bloom": "L5_EVALUATE", "prereq": "28"}, {"module": "Unit V", "num": 31, "title": "Hardware-in-the-Loop (HIL) Emulation & Real-Time Testbenches", "subtopics": "FPGA/dSPACE real-time emulation, sensor fault injection, plant simulator calibration", "bloom": "L5_EVALUATE", "prereq": "29"}, {"module": "Unit V", "num": 32, "title": "Telemetry Monitoring, State Estimation & Extended Kalman Filtering", "subtopics": "EKF linearization, covariance update, measurement noise filtering, state tracking", "bloom": "L5_EVALUATE", "prereq": "18"}, {"module": "Unit V", "num": 33, "title": "Edge Computing, FPGA / ASIC Acceleration & Parallel Architectures", "subtopics": "High-throughput streaming hardware, pipelining, SIMD vectorization, memory hierarchies", "bloom": "L5_EVALUATE", "prereq": "23"}, {"module": "Unit V", "num": 34, "title": "Deep Industrial Case Study: Safety-Critical Deployment of Quantum Information And Quantum Computing", "subtopics": "Production architecture, failure mode analysis (FMEA), trade-off Pareto curve", "bloom": "L5_EVALUATE", "prereq": "30"}, {"module": "Unit V", "num": 35, "title": "Emerging Research Frontiers: Physics-Informed Neural Networks & Modern Trends", "subtopics": "PINNs, digital twins, data-driven system identification, quantum computing extensions", "bloom": "L5_EVALUATE", "prereq": "34"}, {"module": "Unit V", "num": 36, "title": "End-to-End System Design Verification, Synthesis Defense & Capstone Review in Quantum Information And Quantum Computing", "subtopics": "Complete system verification, performance validation against specs, synthesis review", "bloom": "L6_CREATE", "prereq": "35"}];
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
