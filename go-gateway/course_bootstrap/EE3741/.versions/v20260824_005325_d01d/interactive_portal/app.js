// DSP / Engineering Interactive Learning Engine
const lecturesData = [{"module":"Unit I: Isolated DC-DC Converter Topologies","num":1,"title":"Forward, and fly-back converters, half and full bridge topologies, push pull","subtopics":"forward, and fly-back converters, half and full bridge topologies, push pull converter- operation and analysis","bloom":"L2_UNDERSTAND","prereq":"None","is_lab":false},{"module":"Unit I: Isolated DC-DC Converter Topologies","num":2,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 1)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L2_UNDERSTAND","prereq":"L1","is_lab":false},{"module":"Unit I: Isolated DC-DC Converter Topologies","num":3,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 2)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L2_UNDERSTAND","prereq":"L2","is_lab":false},{"module":"Unit I: Isolated DC-DC Converter Topologies","num":4,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 3)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L3","is_lab":false},{"module":"Unit I: Isolated DC-DC Converter Topologies","num":5,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 4)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L4","is_lab":false},{"module":"Unit I: Isolated DC-DC Converter Topologies","num":6,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 5)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L5","is_lab":false},{"module":"Unit I: Isolated DC-DC Converter Topologies","num":7,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 6)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L6","is_lab":false},{"module":"Unit I: Isolated DC-DC Converter Topologies","num":8,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 7)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L7","is_lab":false},{"module":"Unit I: Isolated DC-DC Converter Topologies","num":9,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 8)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L8","is_lab":false},{"module":"Unit II: Converter Modelling","num":10,"title":"Small-signal modelling of buck and boost converters for control Design","subtopics":"Small-signal modelling of buck and boost converters for control Design","bloom":"L3_APPLY","prereq":"L9","is_lab":false},{"module":"Unit II: Converter Modelling","num":11,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 1)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L10","is_lab":false},{"module":"Unit II: Converter Modelling","num":12,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 2)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L11","is_lab":false},{"module":"Unit II: Converter Modelling","num":13,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 3)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L12","is_lab":false},{"module":"Unit II: Converter Modelling","num":14,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 4)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L3_APPLY","prereq":"L13","is_lab":false},{"module":"Unit II: Converter Modelling","num":15,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 5)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L14","is_lab":false},{"module":"Unit II: Converter Modelling","num":16,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 6)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L15","is_lab":false},{"module":"Unit II: Converter Modelling","num":17,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 7)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L16","is_lab":false},{"module":"Unit II: Converter Modelling","num":18,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 8)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L17","is_lab":false},{"module":"Unit III: Controller Design","num":19,"title":"Design of Type-I, Type-2 and Type-3 compensators for voltage mode control of","subtopics":"Design of Type-I, Type-2 and Type-3 compensators for voltage mode control of smps based on small-signal transfer functions – realization of these compensators using OPAMPs","bloom":"L4_ANALYZE","prereq":"L18","is_lab":false},{"module":"Unit III: Controller Design","num":20,"title":"Current Mode Control – Advantages – subharmonic instability – slope","subtopics":"Current Mode Control – Advantages – subharmonic instability – slope compensation – ideal slope for slope compensation – design of outer voltage control loop in current mode controlled converter","bloom":"L4_ANALYZE","prereq":"L19","is_lab":false},{"module":"Unit III: Controller Design","num":21,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 1)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L20","is_lab":false},{"module":"Unit III: Controller Design","num":22,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 2)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L21","is_lab":false},{"module":"Unit III: Controller Design","num":23,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 3)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L22","is_lab":false},{"module":"Unit III: Controller Design","num":24,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 4)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L5_EVALUATE","prereq":"L23","is_lab":false},{"module":"Unit III: Controller Design","num":25,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 5)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L5_EVALUATE","prereq":"L24","is_lab":false},{"module":"Unit III: Controller Design","num":26,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 6)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L5_EVALUATE","prereq":"L25","is_lab":false},{"module":"Unit III: Controller Design","num":27,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 7)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L5_EVALUATE","prereq":"L26","is_lab":false},{"module":"Unit IV: Power Converter Design","num":28,"title":"Design of filter inductor \u0026 capacitor, and power transformer, ratings for","subtopics":"Design of filter inductor \u0026 capacitor, and power transformer, ratings for switching devices, current transformer for current sensing, design of drive circuits for switching devices, considerations for PCB layout, techniques to reduce EMI emissions","bloom":"L4_ANALYZE","prereq":"L27","is_lab":false},{"module":"Unit IV: Power Converter Design","num":29,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 1)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L28","is_lab":false},{"module":"Unit IV: Power Converter Design","num":30,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 2)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L29","is_lab":false},{"module":"Unit IV: Power Converter Design","num":31,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 3)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L30","is_lab":false},{"module":"Unit IV: Power Converter Design","num":32,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 4)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L4_ANALYZE","prereq":"L31","is_lab":false},{"module":"Unit IV: Power Converter Design","num":33,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 5)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L5_EVALUATE","prereq":"L32","is_lab":false},{"module":"Unit IV: Power Converter Design","num":34,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 6)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L5_EVALUATE","prereq":"L33","is_lab":false},{"module":"Unit IV: Power Converter Design","num":35,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 7)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L5_EVALUATE","prereq":"L34","is_lab":false},{"module":"Unit IV: Power Converter Design","num":36,"title":"Numerical Problem Solving \u0026 GATE Practice (Session 8)","subtopics":"Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping","bloom":"L6_CREATE","prereq":"L35","is_lab":false}];
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
