// DSP / Engineering Interactive Learning Engine
const lecturesData = [{"module": "Unit I", "num": 1, "title": "Need of sources of renewable energy", "subtopics": "Introduction to different sources of renewable energy", "bloom": "L2_UNDERSTAND", "prereq": "None"}, {"module": "Unit I", "num": 2, "title": "and applications. basic concepts of radiation, radiation measuring instruments, and", "subtopics": "and applications. basic concepts of radiation, radiation measuring instruments, and", "bloom": "L3_APPLY", "prereq": "1"}, {"module": "Unit I", "num": 3, "title": "applications.", "subtopics": "applications.", "bloom": "L2_UNDERSTAND", "prereq": "2"}, {"module": "Unit I", "num": 4, "title": "Solar Energy", "subtopics": "Basics of solar thermal applications in both low and high temperature ranges,", "bloom": "L3_APPLY", "prereq": "3"}, {"module": "Unit I", "num": 5, "title": "principle of photovoltaics including an introduction to various components of photovoltaic", "subtopics": "principle of photovoltaics including an introduction to various components of photovoltaic", "bloom": "L2_UNDERSTAND", "prereq": "4"}, {"module": "Unit I", "num": 6, "title": "systems for standalone/hybrid/grid-connected systems.", "subtopics": "systems for standalone/hybrid/grid-connected systems.", "bloom": "L3_APPLY", "prereq": "5"}, {"module": "Unit I", "num": 7, "title": "Wind Energy", "subtopics": "Wind resource assessment including instrumentation used in resource", "bloom": "L2_UNDERSTAND", "prereq": "6"}, {"module": "Unit I", "num": 8, "title": "assessment, basic theory of wind, wind power generators, performance characteristics,", "subtopics": "assessment, basic theory of wind, wind power generators, performance characteristics,", "bloom": "L3_APPLY", "prereq": "7"}, {"module": "Unit I", "num": 9, "title": "augmentation of wind power, betz criteria.", "subtopics": "augmentation of wind power, betz criteria.", "bloom": "L2_UNDERSTAND", "prereq": "8"}, {"module": "Unit I", "num": 10, "title": "Bioenergy", "subtopics": "Types and availability of biomass resources, various methods of biomass", "bloom": "L3_APPLY", "prereq": "9"}, {"module": "Unit I", "num": 11, "title": "utilization for energy generation, types of bio-gas digesters and its utilizations,", "subtopics": "utilization for energy generation, types of bio-gas digesters and its utilizations,", "bloom": "L4_ANALYZE", "prereq": "10"}, {"module": "Unit I", "num": 12, "title": "Geothermal Energy", "subtopics": "Availability and methods of utilization of geothermal resource for thermal", "bloom": "L4_ANALYZE", "prereq": "11"}, {"module": "Unit I", "num": 13, "title": "applications and electricity generation", "subtopics": "applications and electricity generation", "bloom": "L4_ANALYZE", "prereq": "12"}, {"module": "Unit I", "num": 14, "title": "Ocean Energy", "subtopics": "Principles utilization, thermodynamic cycles, tidal and wave energy, potential", "bloom": "L4_ANALYZE", "prereq": "13"}, {"module": "Unit I", "num": 15, "title": "and conversion technique, principle of ocean thermal energy conversion system.", "subtopics": "and conversion technique, principle of ocean thermal energy conversion system.", "bloom": "L4_ANALYZE", "prereq": "14"}, {"module": "Unit I", "num": 16, "title": "Fuel Cells and Hydrogen Energy", "subtopics": "Introduction, principle of fuel cells, thermodynamic", "bloom": "L4_ANALYZE", "prereq": "15"}, {"module": "Unit I", "num": 17, "title": "analysis of fuel cells, types of fuel cells, fuel cell batteries, applications of fuel cells. hydrogen", "subtopics": "analysis of fuel cells, types of fuel cells, fuel cell batteries, applications of fuel cells. hydrogen", "bloom": "L4_ANALYZE", "prereq": "16"}, {"module": "Unit I", "num": 18, "title": "as a renewable energy source, sources of hydrogen, and methods of hydrogen production.", "subtopics": "as a renewable energy source, sources of hydrogen, and methods of hydrogen production.", "bloom": "L4_ANALYZE", "prereq": "17"}, {"module": "Unit I", "num": 19, "title": "Text Books", "subtopics": "", "bloom": "L4_ANALYZE", "prereq": "18"}, {"module": "Unit I", "num": 20, "title": "1. Duffie, J. A., & Beckman, W. A. (2013). Solar engineering of thermal processes, fourth", "subtopics": "1. Duffie, J. A., & Beckman, W. A. (2013). Solar engineering of thermal processes, fourth", "bloom": "L4_ANALYZE", "prereq": "19"}, {"module": "Unit I", "num": 21, "title": "edition, Wiley.", "subtopics": "edition, Wiley.", "bloom": "L4_ANALYZE", "prereq": "20"}, {"module": "Unit I", "num": 22, "title": "2. Tiwari, G. N., & Ghosal, M. K. (2007). Fundamentals of renewable energy sources. Alpha", "subtopics": "2. Tiwari, G. N., & Ghosal, M. K. (2007). Fundamentals of renewable energy sources. Alpha", "bloom": "L4_ANALYZE", "prereq": "21"}, {"module": "Unit I", "num": 23, "title": "Science International Limited.", "subtopics": "Science International Limited.", "bloom": "L4_ANALYZE", "prereq": "22"}, {"module": "Unit I", "num": 24, "title": "3. Mukherjee, D., & Chakrabarti, S. (2004). Fundamentals of renewable energy systems.", "subtopics": "3. Mukherjee, D., & Chakrabarti, S. (2004). Fundamentals of renewable energy systems.", "bloom": "L4_ANALYZE", "prereq": "23"}, {"module": "Unit I", "num": 25, "title": "New Age International.", "subtopics": "New Age International.", "bloom": "L4_ANALYZE", "prereq": "24"}, {"module": "Unit I", "num": 26, "title": "Reference Books", "subtopics": "", "bloom": "L4_ANALYZE", "prereq": "25"}, {"module": "Unit I", "num": 27, "title": "1. Sukhatme, S. P. (2005). Solar Energy Principles of Thermal Collection and storage Tata", "subtopics": "1. Sukhatme, S. P. (2005). Solar Energy Principles of Thermal Collection and storage Tata", "bloom": "L4_ANALYZE", "prereq": "26"}, {"module": "Unit I", "num": 28, "title": "McGraw Hill Publishing Company Ltd. New Delhi.", "subtopics": "McGraw Hill Publishing Company Ltd. New Delhi.", "bloom": "L4_ANALYZE", "prereq": "27"}, {"module": "Unit I", "num": 29, "title": "2. Kothari, D. P., Singal, K. C., & Ranjan, R. (2011). Renewable energy sources and", "subtopics": "2. Kothari, D. P., Singal, K. C., & Ranjan, R. (2011). Renewable energy sources and", "bloom": "L4_ANALYZE", "prereq": "28"}, {"module": "Unit I", "num": 30, "title": "emerging technologies. PHI Learning Pvt. Ltd.", "subtopics": "emerging technologies. PHI Learning Pvt. Ltd.", "bloom": "L4_ANALYZE", "prereq": "29"}, {"module": "Unit I", "num": 31, "title": "Scheme and Syllabi 60 | Page", "subtopics": "Scheme and Syllabi 60 | Page", "bloom": "L4_ANALYZE", "prereq": "30"}, {"module": "Unit V", "num": 32, "title": "Telemetry Monitoring, State Estimation & Extended Kalman Filtering", "subtopics": "EKF linearization, covariance update, measurement noise filtering, state tracking", "bloom": "L5_EVALUATE", "prereq": "18"}, {"module": "Unit V", "num": 33, "title": "Edge Computing, FPGA / ASIC Acceleration & Parallel Architectures", "subtopics": "High-throughput streaming hardware, pipelining, SIMD vectorization, memory hierarchies", "bloom": "L5_EVALUATE", "prereq": "23"}, {"module": "Unit V", "num": 34, "title": "Deep Industrial Case Study: Safety-Critical Deployment of Renewable Power Generation", "subtopics": "Production architecture, failure mode analysis (FMEA), trade-off Pareto curve", "bloom": "L5_EVALUATE", "prereq": "30"}, {"module": "Unit V", "num": 35, "title": "Emerging Research Frontiers: Physics-Informed Neural Networks & Modern Trends", "subtopics": "PINNs, digital twins, data-driven system identification, quantum computing extensions", "bloom": "L5_EVALUATE", "prereq": "34"}, {"module": "Unit V", "num": 36, "title": "End-to-End System Design Verification, Synthesis Defense & Capstone Review in Renewable Power Generation", "subtopics": "Complete system verification, performance validation against specs, synthesis review", "bloom": "L6_CREATE", "prereq": "35"}];
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
