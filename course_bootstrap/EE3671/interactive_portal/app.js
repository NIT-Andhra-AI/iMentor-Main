// DSP / Engineering Interactive Learning Engine
const lecturesData = [{"module": "Unit I", "num": 1, "title": "Sensors and Transducers", "subtopics": "Process control basics: overview, process control loop and its", "bloom": "L2_UNDERSTAND", "prereq": "None"}, {"module": "Unit I", "num": 2, "title": "elements; sensor time response", "subtopics": "understanding first and second-order responses;", "bloom": "L3_APPLY", "prereq": "1"}, {"module": "Unit I", "num": 3, "title": "transducers", "subtopics": "characteristics, selection criteria, and applications.", "bloom": "L2_UNDERSTAND", "prereq": "2"}, {"module": "Unit I", "num": 4, "title": "Signal Conditioning Circuits and Final Control", "subtopics": "Electronic amplifiers: types include", "bloom": "L3_APPLY", "prereq": "3"}, {"module": "Unit I", "num": 5, "title": "differential, instrumentation, precision rectifiers, log amplifiers, carrier amplifiers, lock-in", "subtopics": "differential, instrumentation, precision rectifiers, log amplifiers, carrier amplifiers, lock-in", "bloom": "L2_UNDERSTAND", "prereq": "4"}, {"module": "Unit I", "num": 6, "title": "amplifiers, isolation amplifiers, charge amplifiers, and phase-sensitive detectors; final control", "subtopics": "amplifiers, isolation amplifiers, charge amplifiers, and phase-sensitive detectors; final control", "bloom": "L3_APPLY", "prereq": "5"}, {"module": "Unit I", "num": 7, "title": "operations", "subtopics": "signal conversion and actuators and control elements.", "bloom": "L2_UNDERSTAND", "prereq": "6"}, {"module": "Unit I", "num": 8, "title": "Data Transmission and Virtual Instrumentation System", "subtopics": "Data transmission methods:", "bloom": "L3_APPLY", "prereq": "7"}, {"module": "Unit I", "num": 9, "title": "analog and digital cable transmission, fiber optics, pneumatic systems; process control", "subtopics": "analog and digital cable transmission, fiber optics, pneumatic systems; process control", "bloom": "L2_UNDERSTAND", "prereq": "8"}, {"module": "Unit I", "num": 10, "title": "networks", "subtopics": "functions, characteristics, fieldbus, profibus, and wireless communication; virtual", "bloom": "L3_APPLY", "prereq": "9"}, {"module": "Unit I", "num": 11, "title": "instrumentation", "subtopics": "architecture and comparison with traditional instruments, including graphical", "bloom": "L4_ANALYZE", "prereq": "10"}, {"module": "Unit I", "num": 12, "title": "programming concepts.", "subtopics": "programming concepts.", "bloom": "L4_ANALYZE", "prereq": "11"}, {"module": "Unit I", "num": 13, "title": "Programmable Logic Controllers (PLC)", "subtopics": "PLC: Organization, hardware details, I/O power", "bloom": "L4_ANALYZE", "prereq": "12"}, {"module": "Unit I", "num": 14, "title": "supply, CPU; standards programming aspects", "subtopics": "ladder programming: realization of AND, OR", "bloom": "L4_ANALYZE", "prereq": "13"}, {"module": "Unit I", "num": 15, "title": "logic, the concept of latching, introduction to timer/counters, exercises based on timers and", "subtopics": "logic, the concept of latching, introduction to timer/counters, exercises based on timers and", "bloom": "L4_ANALYZE", "prereq": "14"}, {"module": "Unit I", "num": 16, "title": "counters.", "subtopics": "counters.", "bloom": "L4_ANALYZE", "prereq": "15"}, {"module": "Unit I", "num": 17, "title": "SCADA and DCS Systems", "subtopics": "SCADA: Introduction, architecture, components, supervision,", "bloom": "L4_ANALYZE", "prereq": "16"}, {"module": "Unit I", "num": 18, "title": "control, HMI, RTU, and protocols (IEC 60870-5-101, DNP3); DCS", "subtopics": "Introduction, architecture,", "bloom": "L4_ANALYZE", "prereq": "17"}, {"module": "Unit I", "num": 19, "title": "and control modes.", "subtopics": "and control modes.", "bloom": "L4_ANALYZE", "prereq": "18"}, {"module": "Unit I", "num": 20, "title": "Text Books", "subtopics": "", "bloom": "L4_ANALYZE", "prereq": "19"}, {"module": "Unit I", "num": 21, "title": "1. Curtis D Johnson , \u201cProcess Control Instrumentation Technology\u201d, PHI Learning Pvt Ltd", "subtopics": "1. Curtis D Johnson , \u201cProcess Control Instrumentation Technology\u201d, PHI Learning Pvt Ltd", "bloom": "L4_ANALYZE", "prereq": "20"}, {"module": "Unit I", "num": 22, "title": "New Delhi, 2005", "subtopics": "New Delhi, 2005", "bloom": "L4_ANALYZE", "prereq": "21"}, {"module": "Unit I", "num": 23, "title": "2. Doeblin E.O, \u201cMeasurement Systems", "subtopics": "Application and Design\u201d, Fourth Edition, McGraw", "bloom": "L4_ANALYZE", "prereq": "22"}, {"module": "Unit I", "num": 24, "title": "Hill, Newyork, 1992", "subtopics": "Hill, Newyork, 1992", "bloom": "L4_ANALYZE", "prereq": "23"}, {"module": "Unit I", "num": 25, "title": "3. DVS. Murty, \u201cTransducers and Instrumentation\u201d, Second Edition, PHI Learning Pvt Ltd", "subtopics": "3. DVS. Murty, \u201cTransducers and Instrumentation\u201d, Second Edition, PHI Learning Pvt Ltd", "bloom": "L4_ANALYZE", "prereq": "24"}, {"module": "Unit I", "num": 26, "title": "New Delhi, 2013", "subtopics": "New Delhi, 2013", "bloom": "L4_ANALYZE", "prereq": "25"}, {"module": "Unit I", "num": 27, "title": "4. Jovitha Jerome, \u201cVirtual instrumentation using LabVIEW\u201d, Prentice Hall of India, 2010.", "subtopics": "4. Jovitha Jerome, \u201cVirtual instrumentation using LabVIEW\u201d, Prentice Hall of India, 2010.", "bloom": "L4_ANALYZE", "prereq": "26"}, {"module": "Unit I", "num": 28, "title": "William Bolton, \u201cProgrammable Logic Controllers\u201d, Fifth edition, ELSEVIER INDIA Pvt", "subtopics": "William Bolton, \u201cProgrammable Logic Controllers\u201d, Fifth edition, ELSEVIER INDIA Pvt", "bloom": "L4_ANALYZE", "prereq": "27"}, {"module": "Unit I", "num": 29, "title": "Ltd New Delhi, 2011", "subtopics": "Ltd New Delhi, 2011", "bloom": "L4_ANALYZE", "prereq": "28"}, {"module": "Unit I", "num": 30, "title": "5. Stuart A. Boyer, \"SCADA", "subtopics": "Supervisory Control and Data Acquisition\", Fourth edition,", "bloom": "L4_ANALYZE", "prereq": "29"}, {"module": "Unit I", "num": 31, "title": "International Society of Automation, 2010", "subtopics": "International Society of Automation, 2010", "bloom": "L4_ANALYZE", "prereq": "30"}, {"module": "Unit I", "num": 32, "title": "References", "subtopics": "", "bloom": "L4_ANALYZE", "prereq": "31"}, {"module": "Unit I", "num": 33, "title": "1. G.K.McMillan, \u2018Process/Industrial Instrument and control and hand book\u2019 McGraw Hill,", "subtopics": "1. G.K.McMillan, \u2018Process/Industrial Instrument and control and hand book\u2019 McGraw Hill,", "bloom": "L4_ANALYZE", "prereq": "32"}, {"module": "Unit I", "num": 34, "title": "New York,2019", "subtopics": "New York,2019", "bloom": "L4_ANALYZE", "prereq": "33"}, {"module": "Unit I", "num": 35, "title": "2. Michael P .Lucas, \u2018Distributed Control system\u2019, Van Nastrant Reinhold Company, New", "subtopics": "2. Michael P .Lucas, \u2018Distributed Control system\u2019, Van Nastrant Reinhold Company, New", "bloom": "L4_ANALYZE", "prereq": "34"}, {"module": "Unit I", "num": 36, "title": "York Patranabis, D., \u2018Principles of Industrial Instrumentation\u2019, Second Edition Tata", "subtopics": "York Patranabis, D., \u2018Principles of Industrial Instrumentation\u2019, Second Edition Tata", "bloom": "L4_ANALYZE", "prereq": "35"}];
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
