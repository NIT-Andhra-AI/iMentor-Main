// DSP / Engineering Interactive Learning Engine
const lecturesData = [{"module": "Unit I", "num": 1, "title": "Measuring Instruments", "subtopics": "Definitions- accuracy, tolerance, sensitivity, reproducibility. errors &", "bloom": "L2_UNDERSTAND", "prereq": "None"}, {"module": "Unit I", "num": 2, "title": "error analysis in measurements. Classification of measuring instruments and their", "subtopics": "error analysis in measurements. Classification of measuring instruments and their", "bloom": "L3_APPLY", "prereq": "1"}, {"module": "Unit I", "num": 3, "title": "characteristics.", "subtopics": "characteristics.", "bloom": "L2_UNDERSTAND", "prereq": "2"}, {"module": "Unit I", "num": 4, "title": "Electromechanical Instruments \u2013 permanent magnet moving coil, moving iron instruments", "subtopics": "Electromechanical Instruments \u2013 permanent magnet moving coil, moving iron instruments", "bloom": "L3_APPLY", "prereq": "3"}, {"module": "Unit I", "num": 5, "title": "and electrodynamometer type instruments", "subtopics": "construction, working, types, torque equation,", "bloom": "L2_UNDERSTAND", "prereq": "4"}, {"module": "Unit I", "num": 6, "title": "range extension, errors, advantages and disadvantages, active- and reactive- power", "subtopics": "range extension, errors, advantages and disadvantages, active- and reactive- power", "bloom": "L3_APPLY", "prereq": "5"}, {"module": "Unit I", "num": 7, "title": "measurements in single-phase and three-phase circuits.", "subtopics": "measurements in single-phase and three-phase circuits.", "bloom": "L2_UNDERSTAND", "prereq": "6"}, {"module": "Unit I", "num": 8, "title": "Measurement of Resistance, Inductance and capacitances", "subtopics": "DC bridges: Wheatstone,", "bloom": "L3_APPLY", "prereq": "7"}, {"module": "Unit I", "num": 9, "title": "kelvin\u2019s, kelvin\u2019s double bridge, megger, earth resistance measurement, loss of charge", "subtopics": "kelvin\u2019s, kelvin\u2019s double bridge, megger, earth resistance measurement, loss of charge", "bloom": "L2_UNDERSTAND", "prereq": "8"}, {"module": "Unit I", "num": 10, "title": "method for measurement of high resistance; AC bridges", "subtopics": "Maxwell\u2019s bridges, De-sauty,", "bloom": "L3_APPLY", "prereq": "9"}, {"module": "Unit I", "num": 11, "title": "Anderson, Schering, Wien; for measurement of inductance and capacitance and their", "subtopics": "Anderson, Schering, Wien; for measurement of inductance and capacitance and their", "bloom": "L4_ANALYZE", "prereq": "10"}, {"module": "Unit I", "num": 12, "title": "limitation", "subtopics": "limitation", "bloom": "L4_ANALYZE", "prereq": "11"}, {"module": "Unit I", "num": 13, "title": "Instrument Transformers", "subtopics": "Construction, working, testing & applications of current", "bloom": "L4_ANALYZE", "prereq": "12"}, {"module": "Unit I", "num": 14, "title": "transformer and potential transformer.", "subtopics": "transformer and potential transformer.", "bloom": "L4_ANALYZE", "prereq": "13"}, {"module": "Unit I", "num": 15, "title": "Electronic Instruments and Transducers", "subtopics": "Digital voltmeters, dual trace and dual beam", "bloom": "L4_ANALYZE", "prereq": "14"}, {"module": "Unit I", "num": 16, "title": "cathode ray oscilloscopes, measurement of voltage and frequency, Lissajous patterns, wave", "subtopics": "cathode ray oscilloscopes, measurement of voltage and frequency, Lissajous patterns, wave", "bloom": "L4_ANALYZE", "prereq": "15"}, {"module": "Unit I", "num": 17, "title": "analyzers, harmonic distortion analyzer, LCR meter and Q-meter.", "subtopics": "analyzers, harmonic distortion analyzer, LCR meter and Q-meter.", "bloom": "L4_ANALYZE", "prereq": "16"}, {"module": "Unit I", "num": 18, "title": "Digital energy meter design components; circuit diagram; digital meter software algorithm;", "subtopics": "Digital energy meter design components; circuit diagram; digital meter software algorithm;", "bloom": "L4_ANALYZE", "prereq": "17"}, {"module": "Unit I", "num": 19, "title": "meter working principle; automatic meter reading, advanced metering infrastructure", "subtopics": "meter working principle; automatic meter reading, advanced metering infrastructure", "bloom": "L4_ANALYZE", "prereq": "18"}, {"module": "Unit I", "num": 20, "title": "environments. Thermistor, RTD, thermocouple, LVDT, strain gauge, piezoelectric", "subtopics": "environments. Thermistor, RTD, thermocouple, LVDT, strain gauge, piezoelectric", "bloom": "L4_ANALYZE", "prereq": "19"}, {"module": "Unit I", "num": 21, "title": "transducers, digital shaft encoders, tachometer, hall effect sensors.", "subtopics": "transducers, digital shaft encoders, tachometer, hall effect sensors.", "bloom": "L4_ANALYZE", "prereq": "20"}, {"module": "Unit I", "num": 22, "title": "Text Books", "subtopics": "", "bloom": "L4_ANALYZE", "prereq": "21"}, {"module": "Unit I", "num": 23, "title": "1. A Course in Electrical and Electronic Measurements and Instrumentation, K. Sawhney,", "subtopics": "1. A Course in Electrical and Electronic Measurements and Instrumentation, K. Sawhney,", "bloom": "L4_ANALYZE", "prereq": "22"}, {"module": "Unit I", "num": 24, "title": "Dhanpat Rai and Co., 2020, 19th Edition.", "subtopics": "Dhanpat Rai and Co., 2020, 19th Edition.", "bloom": "L4_ANALYZE", "prereq": "23"}, {"module": "Unit I", "num": 25, "title": "2. Modern Electronic Instrumentation and Measurements Techniques, Albert D. Helfrick,", "subtopics": "2. Modern Electronic Instrumentation and Measurements Techniques, Albert D. Helfrick,", "bloom": "L4_ANALYZE", "prereq": "24"}, {"module": "Unit I", "num": 26, "title": "William D. Cooper, Pearson Education India, 2016, 1st Edition.", "subtopics": "William D. Cooper, Pearson Education India, 2016, 1st Edition.", "bloom": "L4_ANALYZE", "prereq": "25"}, {"module": "Unit I", "num": 27, "title": "Reference Books", "subtopics": "", "bloom": "L4_ANALYZE", "prereq": "26"}, {"module": "Unit I", "num": 28, "title": "1. Electrical Measurements and Measuring Instruments, E.W. Golding, F.C. Widdis, Reem", "subtopics": "1. Electrical Measurements and Measuring Instruments, E.W. Golding, F.C. Widdis, Reem", "bloom": "L4_ANALYZE", "prereq": "27"}, {"module": "Unit I", "num": 29, "title": "Publications,2011, 3rd Edition.", "subtopics": "Publications,2011, 3rd Edition.", "bloom": "L4_ANALYZE", "prereq": "28"}, {"module": "Unit I", "num": 30, "title": "2. Electronic Instrumentation and Measurements, H S Kalsi, McGraw Hill, Fourth", "subtopics": "2. Electronic Instrumentation and Measurements, H S Kalsi, McGraw Hill, Fourth", "bloom": "L4_ANALYZE", "prereq": "29"}, {"module": "Unit I", "num": 31, "title": "Edition,2019, 4th Edition.", "subtopics": "Edition,2019, 4th Edition.", "bloom": "L4_ANALYZE", "prereq": "30"}, {"module": "Unit I", "num": 32, "title": "Scheme and Syllabi 31 | Page", "subtopics": "Scheme and Syllabi 31 | Page", "bloom": "L4_ANALYZE", "prereq": "31"}, {"module": "Unit V", "num": 33, "title": "Edge Computing, FPGA / ASIC Acceleration & Parallel Architectures", "subtopics": "High-throughput streaming hardware, pipelining, SIMD vectorization, memory hierarchies", "bloom": "L5_EVALUATE", "prereq": "23"}, {"module": "Unit V", "num": 34, "title": "Deep Industrial Case Study: Safety-Critical Deployment of Measurements And Instrumentation", "subtopics": "Production architecture, failure mode analysis (FMEA), trade-off Pareto curve", "bloom": "L5_EVALUATE", "prereq": "30"}, {"module": "Unit V", "num": 35, "title": "Emerging Research Frontiers: Physics-Informed Neural Networks & Modern Trends", "subtopics": "PINNs, digital twins, data-driven system identification, quantum computing extensions", "bloom": "L5_EVALUATE", "prereq": "34"}, {"module": "Unit V", "num": 36, "title": "End-to-End System Design Verification, Synthesis Defense & Capstone Review in Measurements And Instrumentation", "subtopics": "Complete system verification, performance validation against specs, synthesis review", "bloom": "L6_CREATE", "prereq": "35"}];
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
