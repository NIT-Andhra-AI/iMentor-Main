// DSP / Engineering Interactive Learning Engine
const lecturesData = [{"module": "Unit I", "num": 1, "title": "Preliminaries for Power System Security Problems", "subtopics": "Per unit quantities - modeling of", "bloom": "L2_UNDERSTAND", "prereq": "None"}, {"module": "Unit I", "num": 2, "title": "generators, transformers, off-nominal tap setting and phase shifting transformers,", "subtopics": "generators, transformers, off-nominal tap setting and phase shifting transformers,", "bloom": "L3_APPLY", "prereq": "1"}, {"module": "Unit I", "num": 3, "title": "transmission lines and loads. Primitive parameters - bus admittance matrix - bus impedance", "subtopics": "transmission lines and loads. Primitive parameters - bus admittance matrix - bus impedance", "bloom": "L2_UNDERSTAND", "prereq": "2"}, {"module": "Unit I", "num": 4, "title": "matrix - reduction due to zero bus currents and zero bus voltages - solution through factored", "subtopics": "matrix - reduction due to zero bus currents and zero bus voltages - solution through factored", "bloom": "L3_APPLY", "prereq": "3"}, {"module": "Unit I", "num": 5, "title": "matrices - solution of non-linear algebraic equation and non-linear differential equations.", "subtopics": "matrices - solution of non-linear algebraic equation and non-linear differential equations.", "bloom": "L2_UNDERSTAND", "prereq": "4"}, {"module": "Unit I", "num": 6, "title": "Power System Security Assessment & Security Constrained Optimization", "subtopics": "Network", "bloom": "L3_APPLY", "prereq": "5"}, {"module": "Unit I", "num": 7, "title": "sensitivity factors, contingency selection, contingency ranking, performance indices and", "subtopics": "sensitivity factors, contingency selection, contingency ranking, performance indices and", "bloom": "L2_UNDERSTAND", "prereq": "6"}, {"module": "Unit I", "num": 8, "title": "methods, direct methods, indirect methods, sensitivity factors, generation shift factors, line", "subtopics": "methods, direct methods, indirect methods, sensitivity factors, generation shift factors, line", "bloom": "L3_APPLY", "prereq": "7"}, {"module": "Unit I", "num": 9, "title": "outage distribution factors, basis of evolutionary optimization techniques, preventive,", "subtopics": "outage distribution factors, basis of evolutionary optimization techniques, preventive,", "bloom": "L2_UNDERSTAND", "prereq": "8"}, {"module": "Unit I", "num": 10, "title": "emergency and restorative controls though non-linear programming and linear programming", "subtopics": "emergency and restorative controls though non-linear programming and linear programming", "bloom": "L3_APPLY", "prereq": "9"}, {"module": "Unit I", "num": 11, "title": "methods", "subtopics": "methods", "bloom": "L4_ANALYZE", "prereq": "10"}, {"module": "Unit I", "num": 12, "title": "Basic Reliability Concepts", "subtopics": "The general reliability function, exponential distribution \u2013 mean", "bloom": "L4_ANALYZE", "prereq": "11"}, {"module": "Unit I", "num": 13, "title": "time to failures \u2013 series and parallel systems. Markov process \u2013 continuous markov process", "subtopics": "time to failures \u2013 series and parallel systems. Markov process \u2013 continuous markov process", "bloom": "L4_ANALYZE", "prereq": "12"}, {"module": "Unit I", "num": 14, "title": "\u2013 recursive techniques \u2013 simple series and parallel system models.", "subtopics": "\u2013 recursive techniques \u2013 simple series and parallel system models.", "bloom": "L4_ANALYZE", "prereq": "13"}, {"module": "Unit I", "num": 15, "title": "Generating Capacity \u2013 Basic Probability Methods", "subtopics": "The generation system model \u2013 loss of", "bloom": "L4_ANALYZE", "prereq": "14"}, {"module": "Unit I", "num": 16, "title": "load indices \u2013 capacity expansion analysis \u2013 scheduled outages. Load forecast uncertainty", "subtopics": "load indices \u2013 capacity expansion analysis \u2013 scheduled outages. Load forecast uncertainty", "bloom": "L4_ANALYZE", "prereq": "15"}, {"module": "Unit I", "num": 17, "title": "loss of energy indices. The frequency and duration method.", "subtopics": "loss of energy indices. The frequency and duration method.", "bloom": "L4_ANALYZE", "prereq": "16"}, {"module": "Unit I", "num": 18, "title": "Transmission Systems Reliability Evaluation", "subtopics": "Radial configuration \u2013 conditional probability", "bloom": "L4_ANALYZE", "prereq": "17"}, {"module": "Unit I", "num": 19, "title": "approach \u2013 network configurations \u2013 state selection.", "subtopics": "approach \u2013 network configurations \u2013 state selection.", "bloom": "L4_ANALYZE", "prereq": "18"}, {"module": "Unit I", "num": 20, "title": "Text Books", "subtopics": "", "bloom": "L4_ANALYZE", "prereq": "19"}, {"module": "Unit I", "num": 21, "title": "1. Roy Billinton and Ronald Allan Pitam", "subtopics": "Reliability Evaluation of Power Systems,1996.", "bloom": "L4_ANALYZE", "prereq": "20"}, {"module": "Unit I", "num": 22, "title": "2. J. Endremyl", "subtopics": "Reliability Modelling in Electric Power Systems, John Wiley, 2005.", "bloom": "L4_ANALYZE", "prereq": "21"}, {"module": "Unit I", "num": 23, "title": "3. G W Stagg and A H El Abiad, \u201cComputer Methods in Power System Analysis\u201d, McGraw", "subtopics": "3. G W Stagg and A H El Abiad, \u201cComputer Methods in Power System Analysis\u201d, McGraw", "bloom": "L4_ANALYZE", "prereq": "22"}, {"module": "Unit I", "num": 24, "title": "Hill, 1968.", "subtopics": "Hill, 1968.", "bloom": "L4_ANALYZE", "prereq": "23"}, {"module": "Unit I", "num": 25, "title": "Reference Books", "subtopics": "", "bloom": "L4_ANALYZE", "prereq": "24"}, {"module": "Unit I", "num": 26, "title": "1. J J Grainger and W D Stevension, \u201cPower System Analysis\u201d, McGraw-Hill, Inc., 1994.", "subtopics": "1. J J Grainger and W D Stevension, \u201cPower System Analysis\u201d, McGraw-Hill, Inc., 1994.", "bloom": "L4_ANALYZE", "prereq": "25"}, {"module": "Unit I", "num": 27, "title": "2. D P Kothori and I J Nagrath, \u201cModern Power System Analysis\u201d, Tata McGraw Hill", "subtopics": "2. D P Kothori and I J Nagrath, \u201cModern Power System Analysis\u201d, Tata McGraw Hill", "bloom": "L4_ANALYZE", "prereq": "26"}, {"module": "Unit I", "num": 28, "title": "Education Private Limited, 2011.", "subtopics": "Education Private Limited, 2011.", "bloom": "L4_ANALYZE", "prereq": "27"}, {"module": "Unit I", "num": 29, "title": "3. Hadi Saadat, \u201cPower System Analysis\u201d McGraw-Hill, 2004. 6. M A Pai,\u201d Computer", "subtopics": "3. Hadi Saadat, \u201cPower System Analysis\u201d McGraw-Hill, 2004. 6. M A Pai,\u201d Computer", "bloom": "L4_ANALYZE", "prereq": "28"}, {"module": "Unit I", "num": 30, "title": "Techniques in Power System Analysis\u201d, Tata McGraw Publishing Company Limited,", "subtopics": "Techniques in Power System Analysis\u201d, Tata McGraw Publishing Company Limited,", "bloom": "L4_ANALYZE", "prereq": "29"}, {"module": "Unit I", "num": 31, "title": "2006.", "subtopics": "2006.", "bloom": "L4_ANALYZE", "prereq": "30"}, {"module": "Unit I", "num": 32, "title": "4. K.R.PADIYAR , Power System Dynamics", "subtopics": "Stability and Control, II Edition,", "bloom": "L4_ANALYZE", "prereq": "31"}, {"module": "Unit I", "num": 33, "title": "B.S.Publications.", "subtopics": "B.S.Publications.", "bloom": "L4_ANALYZE", "prereq": "32"}, {"module": "Unit I", "num": 34, "title": "5. P.M. Anderson and A.A. Fouad, Power system control and stability, John Wiley & sons.", "subtopics": "5. P.M. Anderson and A.A. Fouad, Power system control and stability, John Wiley & sons.", "bloom": "L4_ANALYZE", "prereq": "33"}, {"module": "Unit I", "num": 35, "title": "Scheme and Syllabi 75 | Page", "subtopics": "Scheme and Syllabi 75 | Page", "bloom": "L4_ANALYZE", "prereq": "34"}, {"module": "Unit V", "num": 36, "title": "End-to-End System Design Verification, Synthesis Defense & Capstone Review in Power System Security And Reliability", "subtopics": "Complete system verification, performance validation against specs, synthesis review", "bloom": "L6_CREATE", "prereq": "35"}];
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
