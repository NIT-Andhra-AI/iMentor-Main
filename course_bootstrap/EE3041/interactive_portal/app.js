// DSP / Engineering Interactive Learning Engine
const lecturesData = [{"module": "Unit I", "num": 1, "title": "Introduction to Electric Drives", "subtopics": "Advantages of electric drives, parts of electrical drives,", "bloom": "L2_UNDERSTAND", "prereq": "None"}, {"module": "Unit I", "num": 2, "title": "electric motors, sources, choice of electric drives, and selection of drives for various", "subtopics": "electric motors, sources, choice of electric drives, and selection of drives for various", "bloom": "L3_APPLY", "prereq": "1"}, {"module": "Unit I", "num": 3, "title": "applications.", "subtopics": "applications.", "bloom": "L2_UNDERSTAND", "prereq": "2"}, {"module": "Unit I", "num": 4, "title": "DC Motor Drives", "subtopics": "Torque-speed equation of DC motor, speed control of DC motors using", "bloom": "L3_APPLY", "prereq": "3"}, {"module": "Unit I", "num": 5, "title": "single-phase and three-phase fully controlled and half controlled rectifiers in continuous and", "subtopics": "single-phase and three-phase fully controlled and half controlled rectifiers in continuous and", "bloom": "L2_UNDERSTAND", "prereq": "4"}, {"module": "Unit I", "num": 6, "title": "discontinuous mode of operation, chopper-controlled drives in continuous and discontinuous", "subtopics": "discontinuous mode of operation, chopper-controlled drives in continuous and discontinuous", "bloom": "L3_APPLY", "prereq": "5"}, {"module": "Unit I", "num": 7, "title": "mode of operation, Applications.", "subtopics": "mode of operation, Applications.", "bloom": "L2_UNDERSTAND", "prereq": "6"}, {"module": "Unit I", "num": 8, "title": "Induction Motor Drives", "subtopics": "Speed control of induction motor with V/F control, static rotor", "bloom": "L3_APPLY", "prereq": "7"}, {"module": "Unit I", "num": 9, "title": "resistance control, and slip power recovery scheme. Advanced speed control techniques- field", "subtopics": "resistance control, and slip power recovery scheme. Advanced speed control techniques- field", "bloom": "L2_UNDERSTAND", "prereq": "8"}, {"module": "Unit I", "num": 10, "title": "oriented control-direct torque control-speed sensorless control techniques, advantages and", "subtopics": "oriented control-direct torque control-speed sensorless control techniques, advantages and", "bloom": "L3_APPLY", "prereq": "9"}, {"module": "Unit I", "num": 11, "title": "disadvantages, applications.", "subtopics": "disadvantages, applications.", "bloom": "L4_ANALYZE", "prereq": "10"}, {"module": "Unit I", "num": 12, "title": "Permanent Magnet Motor Drives", "subtopics": "Basic configuration of pm motors, basic principle and", "bloom": "L4_ANALYZE", "prereq": "11"}, {"module": "Unit I", "num": 13, "title": "operation of PM motors, types, performance analysis and control of permanent magnet motor", "subtopics": "operation of PM motors, types, performance analysis and control of permanent magnet motor", "bloom": "L4_ANALYZE", "prereq": "12"}, {"module": "Unit I", "num": 14, "title": "drives, advantages and disadvantages.", "subtopics": "drives, advantages and disadvantages.", "bloom": "L4_ANALYZE", "prereq": "13"}, {"module": "Unit I", "num": 15, "title": "Text Books", "subtopics": "", "bloom": "L4_ANALYZE", "prereq": "14"}, {"module": "Unit I", "num": 16, "title": "1. G.K. Dubey", "subtopics": "Fundamentals of Electric Drives \u2013Narosa Publishers, Second edition, 2007.", "bloom": "L4_ANALYZE", "prereq": "15"}, {"module": "Unit I", "num": 17, "title": "2. S.B. Dewan, G.R. Slemom, A. Straughen", "subtopics": "Power semiconductor drives, John Wiley &", "bloom": "L4_ANALYZE", "prereq": "16"}, {"module": "Unit I", "num": 18, "title": "Sons.", "subtopics": "Sons.", "bloom": "L4_ANALYZE", "prereq": "17"}, {"module": "Unit I", "num": 19, "title": "3. VedamSubramanyam", "subtopics": "Electric Drives Concepts & Applications \u2013Tata McGraw Hill Edn.", "bloom": "L4_ANALYZE", "prereq": "18"}, {"module": "Unit I", "num": 20, "title": "Pvt.Ltd, Second Edition, 2011.", "subtopics": "Pvt.Ltd, Second Edition, 2011.", "bloom": "L4_ANALYZE", "prereq": "19"}, {"module": "Unit I", "num": 21, "title": "4. V. Subrahmanyam", "subtopics": "Thyristor Control of Electric Drives, Tata McGraw Hill Edn. Pvt.Ltd,", "bloom": "L4_ANALYZE", "prereq": "20"}, {"module": "Unit I", "num": 22, "title": "2010.", "subtopics": "2010.", "bloom": "L4_ANALYZE", "prereq": "21"}, {"module": "Unit I", "num": 23, "title": "5. Malcolm Barnes, \u201cPractical Variable Speed Drives and Power Electronics\u201d, Newnes,", "subtopics": "5. Malcolm Barnes, \u201cPractical Variable Speed Drives and Power Electronics\u201d, Newnes,", "bloom": "L4_ANALYZE", "prereq": "22"}, {"module": "Unit I", "num": 24, "title": "2003.", "subtopics": "2003.", "bloom": "L4_ANALYZE", "prereq": "23"}, {"module": "Unit I", "num": 25, "title": "6. Chris Mi, M. Abul Masrur, and Davis Wenzhong Gao \u201cHybrid Electric Vehicles- Principles", "subtopics": "6. Chris Mi, M. Abul Masrur, and Davis Wenzhong Gao \u201cHybrid Electric Vehicles- Principles", "bloom": "L4_ANALYZE", "prereq": "24"}, {"module": "Unit I", "num": 26, "title": "and Applications with Practical Perspectives\u201d, A John Wiley & Sons, Ltd., Publication,", "subtopics": "and Applications with Practical Perspectives\u201d, A John Wiley & Sons, Ltd., Publication,", "bloom": "L4_ANALYZE", "prereq": "25"}, {"module": "Unit I", "num": 27, "title": "2nd edition, 2017.", "subtopics": "2nd edition, 2017.", "bloom": "L4_ANALYZE", "prereq": "26"}, {"module": "Unit I", "num": 28, "title": "Reference Books", "subtopics": "", "bloom": "L4_ANALYZE", "prereq": "27"}, {"module": "Unit I", "num": 29, "title": "1. Werner Leonhard", "subtopics": "Control of Electric Drives, Springer international edition2001.", "bloom": "L4_ANALYZE", "prereq": "28"}, {"module": "Unit I", "num": 30, "title": "2. Nisit K.De and Swapan K.Dutta", "subtopics": "Electric Machines and Electric Drives, PHI learning Pvt.", "bloom": "L4_ANALYZE", "prereq": "29"}, {"module": "Unit I", "num": 31, "title": "Ltd, 2011.", "subtopics": "Ltd, 2011.", "bloom": "L4_ANALYZE", "prereq": "30"}, {"module": "Unit I", "num": 32, "title": "3. Mohan, Undeland, Robin, Power Electronics, 3ed (An Indian Adaptation)", "subtopics": "Converters,", "bloom": "L4_ANALYZE", "prereq": "31"}, {"module": "Unit I", "num": 33, "title": "Applications and Design, Wiley India Pvt Ltd., 2022.", "subtopics": "Applications and Design, Wiley India Pvt Ltd., 2022.", "bloom": "L4_ANALYZE", "prereq": "32"}, {"module": "Unit I", "num": 34, "title": "Online Resources", "subtopics": "", "bloom": "L4_ANALYZE", "prereq": "33"}, {"module": "Unit I", "num": 35, "title": "1. https", "subtopics": "//github.com/mathworks/MATLAB-Simulink-Challenge-Project Hub/tree/main/", "bloom": "L4_ANALYZE", "prereq": "34"}, {"module": "Unit I", "num": 36, "title": "projects/Disturbance%20Rejection%20Control%20for%20PMSM%20Motors", "subtopics": "projects/Disturbance%20Rejection%20Control%20for%20PMSM%20Motors", "bloom": "L4_ANALYZE", "prereq": "35"}];
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
