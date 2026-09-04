// DSP / Engineering Interactive Learning Engine
const lecturesData = [{"module":"Unit I: Synchronous Reluctance Motors","num":1,"title":"Constructional features– types– axial and radial flux motors– operating","subtopics":"Constructional features– types– axial and radial flux motors– operating principles– variable reluctance and hybrid motors–voltage and torque equations- phasor diagram - characteristics","bloom":"L2_UNDERSTAND","prereq":"None","is_lab":false},{"module":"Unit I: Synchronous Reluctance Motors","num":2,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 1)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L2_UNDERSTAND","prereq":"L1","is_lab":false},{"module":"Unit I: Synchronous Reluctance Motors","num":3,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 2)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L2_UNDERSTAND","prereq":"L2","is_lab":false},{"module":"Unit I: Synchronous Reluctance Motors","num":4,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 3)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L3","is_lab":false},{"module":"Unit I: Synchronous Reluctance Motors","num":5,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 4)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L4","is_lab":false},{"module":"Unit I: Synchronous Reluctance Motors","num":6,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 5)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L5","is_lab":false},{"module":"Unit I: Synchronous Reluctance Motors","num":7,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 6)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L6","is_lab":false},{"module":"Unit I: Synchronous Reluctance Motors","num":8,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 7)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L7","is_lab":false},{"module":"Unit II: Stepper Motors","num":9,"title":"Constructional features– principle of operation– variable reluctance motor","subtopics":"Constructional features– principle of operation– variable reluctance motor – hybrid motor– single and multi stack configurations– torque equations– modes of excitations– characteristics– drive circuits– microprocessor control of stepping motors– closed loop control","bloom":"L3_APPLY","prereq":"L8","is_lab":false},{"module":"Unit II: Stepper Motors","num":10,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 1)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L9","is_lab":false},{"module":"Unit II: Stepper Motors","num":11,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 2)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L10","is_lab":false},{"module":"Unit II: Stepper Motors","num":12,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 3)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L11","is_lab":false},{"module":"Unit II: Stepper Motors","num":13,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 4)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L12","is_lab":false},{"module":"Unit II: Stepper Motors","num":14,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 5)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L13","is_lab":false},{"module":"Unit II: Stepper Motors","num":15,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 6)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L14","is_lab":false},{"module":"Unit III: Switched Reluctance Motors","num":16,"title":"Constructional features– rotary and linear SRM-principle of operation–","subtopics":"Constructional features– rotary and linear SRM-principle of operation– torque production– steady state performance prediction- analytical method- power converters and their controllers – methods of rotor position sensing – sensorless operation – closed loop control of SRM - characteristics","bloom":"L4_ANALYZE","prereq":"L15","is_lab":false},{"module":"Unit III: Switched Reluctance Motors","num":17,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 1)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L16","is_lab":false},{"module":"Unit III: Switched Reluctance Motors","num":18,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 2)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L17","is_lab":false},{"module":"Unit III: Switched Reluctance Motors","num":19,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 3)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L18","is_lab":false},{"module":"Unit III: Switched Reluctance Motors","num":20,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 4)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L5_EVALUATE","prereq":"L19","is_lab":false},{"module":"Unit III: Switched Reluctance Motors","num":21,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 5)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L5_EVALUATE","prereq":"L20","is_lab":false},{"module":"Unit III: Switched Reluctance Motors","num":22,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 6)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L5_EVALUATE","prereq":"L21","is_lab":false},{"module":"Unit IV: Permanent Magnet Brushless DC Motors","num":23,"title":"Permanent magnet materials– magnetic characteristics – permeance","subtopics":"Permanent magnet materials– magnetic characteristics – permeance coefficient- principle of operation– types– magnetic circuit analysis–EMF and torque equations – commutation power controllers– motor characteristics and control","bloom":"L4_ANALYZE","prereq":"L22","is_lab":false},{"module":"Unit IV: Permanent Magnet Brushless DC Motors","num":24,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 1)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L23","is_lab":false},{"module":"Unit IV: Permanent Magnet Brushless DC Motors","num":25,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 2)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L24","is_lab":false},{"module":"Unit IV: Permanent Magnet Brushless DC Motors","num":26,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 3)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L25","is_lab":false},{"module":"Unit IV: Permanent Magnet Brushless DC Motors","num":27,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 4)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L5_EVALUATE","prereq":"L26","is_lab":false},{"module":"Unit IV: Permanent Magnet Brushless DC Motors","num":28,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 5)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L5_EVALUATE","prereq":"L27","is_lab":false},{"module":"Unit IV: Permanent Magnet Brushless DC Motors","num":29,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 6)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L6_CREATE","prereq":"L28","is_lab":false},{"module":"Unit V: Other motors","num":30,"title":"Linear induction motor, hysteresis motor, Energy efficient motors","subtopics":"linear induction motor, hysteresis motor, Energy efficient motors","bloom":"L4_ANALYZE","prereq":"L29","is_lab":false},{"module":"Unit V: Other motors","num":31,"title":"Control and applications of special machines","subtopics":"Control and applications of special machines","bloom":"L4_ANALYZE","prereq":"L30","is_lab":false},{"module":"Unit V: Other motors","num":32,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 1)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L31","is_lab":false},{"module":"Unit V: Other motors","num":33,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 2)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L32","is_lab":false},{"module":"Unit V: Other motors","num":34,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 3)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L5_EVALUATE","prereq":"L33","is_lab":false},{"module":"Unit V: Other motors","num":35,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 4)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L5_EVALUATE","prereq":"L34","is_lab":false},{"module":"Unit V: Other motors","num":36,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 5)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L6_CREATE","prereq":"L35","is_lab":false}];
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
