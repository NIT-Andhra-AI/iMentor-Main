// DSP / Engineering Interactive Learning Engine
const lecturesData = [{"module":"Unit 1","num":1,"title":"Charge, Current, Voltage \u0026 Power","subtopics":"Charge conservation, Energy, Active/Passive elements","bloom":"L2_UNDERSTAND","prereq":"None","is_lab":false},{"module":"Unit 1","num":2,"title":"Ohm's Law \u0026 Kirchhoff's Laws","subtopics":"KVL, KCL, Node equations, Mesh equations","bloom":"L2_UNDERSTAND","prereq":"1","is_lab":false},{"module":"Unit 1","num":3,"title":"Network Elements \u0026 Sources","subtopics":"Resistors, Inductors, Capacitors, Dependent Sources","bloom":"L2_UNDERSTAND","prereq":"2","is_lab":false},{"module":"Unit 1","num":4,"title":"Series \u0026 Parallel Connections","subtopics":"Voltage division, Current division, Source transformation","bloom":"L2_UNDERSTAND","prereq":"3","is_lab":false},{"module":"Unit 1","num":5,"title":"Nodal Analysis Fundamentals","subtopics":"Reference node, conductance matrix, supernode","bloom":"L3_APPLY","prereq":"4","is_lab":false},{"module":"Unit 1","num":6,"title":"Mesh Analysis Fundamentals","subtopics":"Loop currents, resistance matrix, supermesh","bloom":"L3_APPLY","prereq":"5","is_lab":false},{"module":"Unit 1","num":7,"title":"Graph Theory Fundamentals","subtopics":"Trees, cotrees, incidence matrix","bloom":"L3_APPLY","prereq":"6","is_lab":false},{"module":"Unit 1","num":8,"title":"Tie-Set \u0026 Cut-Set Matrices","subtopics":"Fundamental loops, cut-sets, KCL/KVL formulation","bloom":"L3_APPLY","prereq":"7","is_lab":false},{"module":"Unit 1","num":9,"title":"Superposition \u0026 Linearity","subtopics":"Homogeneity, additivity, power calculations","bloom":"L3_APPLY","prereq":"8","is_lab":false},{"module":"Unit 2","num":10,"title":"Thevenin's Theorem","subtopics":"Open circuit voltage, Thevenin resistance, Equivalent circuit","bloom":"L3_APPLY","prereq":"9","is_lab":false},{"module":"Unit 2","num":11,"title":"Norton's Theorem","subtopics":"Short circuit current, Norton equivalent, Duals","bloom":"L3_APPLY","prereq":"10","is_lab":false},{"module":"Unit 2","num":12,"title":"Maximum Power Transfer Theorem","subtopics":"Load matching, source resistance, derivative optimization","bloom":"L3_APPLY","prereq":"11","is_lab":false},{"module":"Unit 2","num":13,"title":"Reciprocity \u0026 Millman's Theorems","subtopics":"Bilateral networks, parallel voltage sources","bloom":"L3_APPLY","prereq":"12","is_lab":false},{"module":"Unit 2","num":14,"title":"Compensation \u0026 Tellegen's Theorems","subtopics":"Substitution, power conservation, topology","bloom":"L4_ANALYZE","prereq":"13","is_lab":false},{"module":"Unit 2","num":15,"title":"First-Order RC Circuits","subtopics":"Transient response, time constant, natural/forced response","bloom":"L4_ANALYZE","prereq":"14","is_lab":false},{"module":"Unit 2","num":16,"title":"First-Order RL Circuits","subtopics":"Inductor current, time constant, step response","bloom":"L4_ANALYZE","prereq":"15","is_lab":false},{"module":"Unit 2","num":17,"title":"Second-Order RLC Circuits","subtopics":"Series RLC, parallel RLC, differential equations","bloom":"L4_ANALYZE","prereq":"16","is_lab":false},{"module":"Unit 2","num":18,"title":"Damping \u0026 Transient Behaviors","subtopics":"Underdamped, critically damped, overdamped, overshoot","bloom":"L4_ANALYZE","prereq":"17","is_lab":false},{"module":"Unit 3","num":19,"title":"Sinusoidal Steady-State Analysis","subtopics":"Sinusoids, phasors, complex impedance, admittance","bloom":"L4_ANALYZE","prereq":"18","is_lab":false},{"module":"Unit 3","num":20,"title":"Phasor Diagrams \u0026 Relations","subtopics":"Leading/lagging, phase shifts, V-I vectors","bloom":"L4_ANALYZE","prereq":"19","is_lab":false},{"module":"Unit 3","num":21,"title":"AC Power Analysis","subtopics":"Real, reactive, apparent power, Power factor","bloom":"L4_ANALYZE","prereq":"20","is_lab":false},{"module":"Unit 3","num":22,"title":"Power Factor Correction","subtopics":"Capacitor banks, reactive power compensation","bloom":"L4_ANALYZE","prereq":"21","is_lab":false},{"module":"Unit 3","num":23,"title":"Series Resonance","subtopics":"Resonant frequency, bandwidth, quality factor","bloom":"L5_EVALUATE","prereq":"22","is_lab":false},{"module":"Unit 3","num":24,"title":"Parallel Resonance","subtopics":"Tank circuits, dynamic impedance, magnification","bloom":"L5_EVALUATE","prereq":"23","is_lab":false},{"module":"Unit 3","num":25,"title":"Magnetically Coupled Circuits","subtopics":"Mutual inductance, dot convention, coupling coefficient","bloom":"L5_EVALUATE","prereq":"24","is_lab":false},{"module":"Unit 3","num":26,"title":"Ideal \u0026 Linear Transformers","subtopics":"Turns ratio, impedance reflection, isolation","bloom":"L5_EVALUATE","prereq":"25","is_lab":false},{"module":"Unit 3","num":27,"title":"Two-Port Networks Introduction","subtopics":"Port definition, driving point/transfer impedance","bloom":"L5_EVALUATE","prereq":"26","is_lab":false},{"module":"Unit 4","num":28,"title":"Z and Y Parameters","subtopics":"Open-circuit impedance, short-circuit admittance","bloom":"L5_EVALUATE","prereq":"27","is_lab":false},{"module":"Unit 4","num":29,"title":"Transmission (ABCD) Parameters","subtopics":"Cascade connection, forward V/I ratio","bloom":"L5_EVALUATE","prereq":"28","is_lab":false},{"module":"Unit 4","num":30,"title":"Hybrid (h) Parameters","subtopics":"Transistor modeling, series-parallel combinations","bloom":"L5_EVALUATE","prereq":"29","is_lab":false},{"module":"Unit 4","num":31,"title":"Interconnection of Two-Port Networks","subtopics":"Series, parallel, cascade connections","bloom":"L5_EVALUATE","prereq":"30","is_lab":false},{"module":"Unit 4","num":32,"title":"Network Synthesis Basics","subtopics":"Hurwitz polynomials, positive real functions","bloom":"L5_EVALUATE","prereq":"31","is_lab":false},{"module":"Unit 4","num":33,"title":"Driving Point Synthesis (LC)","subtopics":"Foster forms, Cauer forms, reactance functions","bloom":"L6_CREATE","prereq":"32","is_lab":false},{"module":"Unit 4","num":34,"title":"Driving Point Synthesis (RC \u0026 RL)","subtopics":"Foster I \u0026 II, Cauer I \u0026 II","bloom":"L6_CREATE","prereq":"33","is_lab":false},{"module":"Unit 4","num":35,"title":"Filter Fundamentals","subtopics":"Low-pass, high-pass, attenuation, characteristic impedance","bloom":"L6_CREATE","prereq":"34","is_lab":false},{"module":"Unit 4","num":36,"title":"Active vs Passive Filters","subtopics":"Op-amp realizations, Butterworth approximations","bloom":"L6_CREATE","prereq":"35","is_lab":false}];
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
    document.getElementById('lectureSubtopics').innerHTML = '<strong>Module:</strong> ' + lec.module + ' &bull; <strong>Topics:</strong> ' + lec.subtopics;

    // Reset Quiz
    document.getElementById('checkpointFeedback').style.display = 'none';
    
    // Update Math box
    const mathBox = document.getElementById('lectureMathFormula');
    mathBox.innerHTML = '$$ H(z) = \\frac{\\sum_{k=0}^{M} b_k z^{-k}}{1 + \\sum_{k=1}^{N} a_k z^{-k}} \\iff y[n] = \\sum_{k=0}^{M} b_k x[n-k] - \\sum_{k=1}^{N} a_k y[n-k] $$';
    
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

    // Plot 1: Dynamic Time Waveform (Left / Middle)
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
    ctx.fillText('Pole Magnitude |p|: ' + alpha.toFixed(2), 20, 30);
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
        feedback.innerHTML = '<strong>Correct!</strong> For a causal LTI system, all poles must lie strictly inside the unit circle |z| &lt; 1 for the unit circle to be within the ROC.';
    } else {
        feedback.className = 'feedback-alert feedback-wrong';
        feedback.innerHTML = '<strong>Incorrect.</strong> Recall that BIBO stability requires sum |h[n]| &lt; infinity, which means the Fourier Transform exists and the unit circle |z|=1 lies inside the ROC.';
    }
}
