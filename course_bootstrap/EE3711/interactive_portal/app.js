// DSP / Engineering Interactive Learning Engine
const lecturesData = [{"module": "Unit I", "num": 1, "title": "Introduction to Smart Grid", "subtopics": "Introduction to smart grid - working definitions of smart grid and", "bloom": "L2_UNDERSTAND", "prereq": "None"}, {"module": "Unit I", "num": 2, "title": "associated concepts \u2013 smart grid functions \u2013 traditional power grid and smart grid \u2013 new", "subtopics": "associated concepts \u2013 smart grid functions \u2013 traditional power grid and smart grid \u2013 new", "bloom": "L3_APPLY", "prereq": "1"}, {"module": "Unit I", "num": 3, "title": "technologies for smart grid \u2013 advantages \u2013 Indian smart grid \u2013 dimensions of smart grid-key", "subtopics": "technologies for smart grid \u2013 advantages \u2013 Indian smart grid \u2013 dimensions of smart grid-key", "bloom": "L2_UNDERSTAND", "prereq": "2"}, {"module": "Unit I", "num": 4, "title": "challenges for smart grid.", "subtopics": "challenges for smart grid.", "bloom": "L3_APPLY", "prereq": "3"}, {"module": "Unit I", "num": 5, "title": "Smart Grid Architecture", "subtopics": "Components and architecture of smart grid design \u2013 review of the", "bloom": "L2_UNDERSTAND", "prereq": "4"}, {"module": "Unit I", "num": 6, "title": "proposed architectures for smart grid. The fundamental components of smart grid designs \u2013", "subtopics": "proposed architectures for smart grid. The fundamental components of smart grid designs \u2013", "bloom": "L3_APPLY", "prereq": "5"}, {"module": "Unit I", "num": 7, "title": "transmission automation \u2013 distribution automation \u2013 renewable and distributed energy", "subtopics": "transmission automation \u2013 distribution automation \u2013 renewable and distributed energy", "bloom": "L2_UNDERSTAND", "prereq": "6"}, {"module": "Unit I", "num": 8, "title": "integration.", "subtopics": "integration.", "bloom": "L3_APPLY", "prereq": "7"}, {"module": "Unit I", "num": 9, "title": "Tools and Techniques for Smart Grid", "subtopics": "Computational techniques \u2013 static and dynamic", "bloom": "L2_UNDERSTAND", "prereq": "8"}, {"module": "Unit I", "num": 10, "title": "optimization techniques \u2013 computational intelligence techniques \u2013 evolutionary algorithms-", "subtopics": "optimization techniques \u2013 computational intelligence techniques \u2013 evolutionary algorithms-", "bloom": "L3_APPLY", "prereq": "9"}, {"module": "Unit I", "num": 11, "title": "artificial intelligence techniques.", "subtopics": "artificial intelligence techniques.", "bloom": "L4_ANALYZE", "prereq": "10"}, {"module": "Unit I", "num": 12, "title": "Distributed Generation Technologies", "subtopics": "Introduction to renewable energy technologies \u2013", "bloom": "L4_ANALYZE", "prereq": "11"}, {"module": "Unit I", "num": 13, "title": "micro grids\u2013 storage technologies \u2013electric vehicles and plug \u2013 in hybrids \u2013 environmental", "subtopics": "micro grids\u2013 storage technologies \u2013electric vehicles and plug \u2013 in hybrids \u2013 environmental", "bloom": "L4_ANALYZE", "prereq": "12"}, {"module": "Unit I", "num": 14, "title": "impact and climate change \u2013 economic issues.", "subtopics": "impact and climate change \u2013 economic issues.", "bloom": "L4_ANALYZE", "prereq": "13"}, {"module": "Unit I", "num": 15, "title": "Communication Technologies", "subtopics": "Introduction to communication technology-synchro-phasor", "bloom": "L4_ANALYZE", "prereq": "14"}, {"module": "Unit I", "num": 16, "title": "measurement units \u2013 wide area measurement systems.", "subtopics": "measurement units \u2013 wide area measurement systems.", "bloom": "L4_ANALYZE", "prereq": "15"}, {"module": "Unit I", "num": 17, "title": "Control of Smart Grid System and Smart Cities", "subtopics": "Load frequency control in micro grid", "bloom": "L4_ANALYZE", "prereq": "16"}, {"module": "Unit I", "num": 18, "title": "system \u2013 voltage control in micro grid system \u2013 reactive power control in smart grid. Case", "subtopics": "system \u2013 voltage control in micro grid system \u2013 reactive power control in smart grid. Case", "bloom": "L4_ANALYZE", "prereq": "17"}, {"module": "Unit I", "num": 19, "title": "studies and test beds for the smart grids, smart grids to the smart cities", "subtopics": "new paradigms for", "bloom": "L4_ANALYZE", "prereq": "18"}, {"module": "Unit I", "num": 20, "title": "future networks.", "subtopics": "future networks.", "bloom": "L4_ANALYZE", "prereq": "19"}, {"module": "Unit I", "num": 21, "title": "Text Books", "subtopics": "", "bloom": "L4_ANALYZE", "prereq": "20"}, {"module": "Unit I", "num": 22, "title": "1. Mani Vadari, Smart Grid Redefined", "subtopics": "Transformation of the electric utility. Artech House,", "bloom": "L4_ANALYZE", "prereq": "21"}, {"module": "Unit I", "num": 23, "title": "2018.", "subtopics": "2018.", "bloom": "L4_ANALYZE", "prereq": "22"}, {"module": "Unit I", "num": 24, "title": "2. Stuart Borlase, Smart Grids, Infrastructure, Technology and Solutions, CRC Press,", "subtopics": "2. Stuart Borlase, Smart Grids, Infrastructure, Technology and Solutions, CRC Press,", "bloom": "L4_ANALYZE", "prereq": "23"}, {"module": "Unit I", "num": 25, "title": "2013.", "subtopics": "2013.", "bloom": "L4_ANALYZE", "prereq": "24"}, {"module": "Unit I", "num": 26, "title": "Reference Books", "subtopics": "", "bloom": "L4_ANALYZE", "prereq": "25"}, {"module": "Unit I", "num": 27, "title": "1. M. L. Scala, S. Bruno, C. A. Nucci, S. Lamonaca, U. Stecch, Smart Grids to the Smart", "subtopics": "1. M. L. Scala, S. Bruno, C. A. Nucci, S. Lamonaca, U. Stecch, Smart Grids to the Smart", "bloom": "L4_ANALYZE", "prereq": "26"}, {"module": "Unit I", "num": 28, "title": "Cities", "subtopics": "New Paradigms for Future Networks, Vol-II, Wiley publication, 2017.", "bloom": "L4_ANALYZE", "prereq": "27"}, {"module": "Unit I", "num": 29, "title": "2. N. Ramesh Babu, Smart Grid Systems", "subtopics": "Modeling and Control, 1st ed, CRC Press, 2019.", "bloom": "L4_ANALYZE", "prereq": "28"}, {"module": "Unit I", "num": 30, "title": "3. A.G. Phadke and J.S. Thorp Synchronized Phasor Measurements and their", "subtopics": "3. A.G. Phadke and J.S. Thorp Synchronized Phasor Measurements and their", "bloom": "L4_ANALYZE", "prereq": "29"}, {"module": "Unit I", "num": 31, "title": "Applications, Springer Edition, 2010.", "subtopics": "Applications, Springer Edition, 2010.", "bloom": "L4_ANALYZE", "prereq": "30"}, {"module": "Unit I", "num": 32, "title": "Online Resources", "subtopics": "", "bloom": "L4_ANALYZE", "prereq": "31"}, {"module": "Unit I", "num": 33, "title": "1. https", "subtopics": "//nptel.ac.in/courses/108/107/108107113/", "bloom": "L4_ANALYZE", "prereq": "32"}, {"module": "Unit I", "num": 34, "title": "2. https", "subtopics": "//www.coursera.org/lecture/electric-power-systems/smart-grid-utilities-", "bloom": "L4_ANALYZE", "prereq": "33"}, {"module": "Unit I", "num": 35, "title": "consumers- TSfBn", "subtopics": "consumers- TSfBn", "bloom": "L4_ANALYZE", "prereq": "34"}, {"module": "Unit I", "num": 36, "title": "Scheme and Syllabi 73 | Page", "subtopics": "Scheme and Syllabi 73 | Page", "bloom": "L4_ANALYZE", "prereq": "35"}];
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
