// DSP / Engineering Interactive Learning Engine
const lecturesData = [{"module": "Unit I", "num": 1, "title": "Complex Variables", "subtopics": "Analytic function - Cauchy Riemann equations - Harmonic functions", "bloom": "L2_UNDERSTAND", "prereq": "None"}, {"module": "Unit I", "num": 2, "title": "-Conjugate functions - complex integration - line integrals in complex plane - Cauchy\u2019s", "subtopics": "-Conjugate functions - complex integration - line integrals in complex plane - Cauchy\u2019s", "bloom": "L3_APPLY", "prereq": "1"}, {"module": "Unit I", "num": 3, "title": "theorem (simple proof only), Cauchy\u2019s integral formula - Taylor\u2019s and Laurent\u2019s series", "subtopics": "theorem (simple proof only), Cauchy\u2019s integral formula - Taylor\u2019s and Laurent\u2019s series", "bloom": "L2_UNDERSTAND", "prereq": "2"}, {"module": "Unit I", "num": 4, "title": "expansions -zeros and singularities - Residues - residue theorem, use of residue theorem to", "subtopics": "expansions -zeros and singularities - Residues - residue theorem, use of residue theorem to", "bloom": "L3_APPLY", "prereq": "3"}, {"module": "Unit I", "num": 5, "title": "evaluate the real integrals without poles on the x-axis, Bilinear transformations, Conformal", "subtopics": "evaluate the real integrals without poles on the x-axis, Bilinear transformations, Conformal", "bloom": "L2_UNDERSTAND", "prereq": "4"}, {"module": "Unit I", "num": 6, "title": "mapping.", "subtopics": "mapping.", "bloom": "L3_APPLY", "prereq": "5"}, {"module": "Unit I", "num": 7, "title": "Fourier Series", "subtopics": "Expansion of a function in Fourier series for a given range- Convergence of", "bloom": "L2_UNDERSTAND", "prereq": "6"}, {"module": "Unit I", "num": 8, "title": "Fourier series - Half range sine and cosine expansions.", "subtopics": "Fourier series - Half range sine and cosine expansions.", "bloom": "L3_APPLY", "prereq": "7"}, {"module": "Unit I", "num": 9, "title": "Fourier Transforms", "subtopics": "Fourier transformation and inverse transforms - sine, cosine", "bloom": "L2_UNDERSTAND", "prereq": "8"}, {"module": "Unit I", "num": 10, "title": "transformations and inverse transforms - simple illustrations.", "subtopics": "transformations and inverse transforms - simple illustrations.", "bloom": "L3_APPLY", "prereq": "9"}, {"module": "Unit I", "num": 11, "title": "Partial Differential Equations", "subtopics": "Classification of Second order linear Partial Differential", "bloom": "L4_ANALYZE", "prereq": "10"}, {"module": "Unit I", "num": 12, "title": "Equations, D'alembert's solution of wave equation, Method of separation of variables -", "subtopics": "Equations, D'alembert's solution of wave equation, Method of separation of variables -", "bloom": "L4_ANALYZE", "prereq": "11"}, {"module": "Unit I", "num": 13, "title": "Solution of one dimensional wave equation, one dimensional heat conduction equation and", "subtopics": "Solution of one dimensional wave equation, one dimensional heat conduction equation and", "bloom": "L4_ANALYZE", "prereq": "12"}, {"module": "Unit I", "num": 14, "title": "two dimensional steady state heat conduction equation with illustrations.", "subtopics": "two dimensional steady state heat conduction equation with illustrations.", "bloom": "L4_ANALYZE", "prereq": "13"}, {"module": "Unit I", "num": 15, "title": "Numerical Methods", "subtopics": "Bisection method, Secant method, Newton-Raphson method, Fixed-", "bloom": "L4_ANALYZE", "prereq": "14"}, {"module": "Unit I", "num": 16, "title": "point iteration scheme, Gaussian elimination, Jacobi, Gauss Seidel methods, Trapezoidal rule,", "subtopics": "point iteration scheme, Gaussian elimination, Jacobi, Gauss Seidel methods, Trapezoidal rule,", "bloom": "L4_ANALYZE", "prereq": "15"}, {"module": "Unit I", "num": 17, "title": "Simpson\u2019s 1/3, and 3/8-rules, Taylor series, Euler\u2019s method, Modified Euler\u2019s method, Runge-", "subtopics": "Simpson\u2019s 1/3, and 3/8-rules, Taylor series, Euler\u2019s method, Modified Euler\u2019s method, Runge-", "bloom": "L4_ANALYZE", "prereq": "16"}, {"module": "Unit I", "num": 18, "title": "Kutta method.", "subtopics": "Kutta method.", "bloom": "L4_ANALYZE", "prereq": "17"}, {"module": "Unit I", "num": 19, "title": "Text Books", "subtopics": "", "bloom": "L4_ANALYZE", "prereq": "18"}, {"module": "Unit I", "num": 20, "title": "1. R.K. Jain and S.R.K. Iyengar, Advanced Engineering Mathematics, Narosa", "subtopics": "1. R.K. Jain and S.R.K. Iyengar, Advanced Engineering Mathematics, Narosa", "bloom": "L4_ANALYZE", "prereq": "19"}, {"module": "Unit I", "num": 21, "title": "th", "subtopics": "th", "bloom": "L4_ANALYZE", "prereq": "20"}, {"module": "Unit I", "num": 22, "title": "Publishing House, 5 edition, 2016.", "subtopics": "Publishing House, 5 edition, 2016.", "bloom": "L4_ANALYZE", "prereq": "21"}, {"module": "Unit I", "num": 23, "title": "2. E. Kreyszig, Advanced Engineering Mathematics, John Wiley and Sons, 8thedition,", "subtopics": "2. E. Kreyszig, Advanced Engineering Mathematics, John Wiley and Sons, 8thedition,", "bloom": "L4_ANALYZE", "prereq": "22"}, {"module": "Unit I", "num": 24, "title": "2008.", "subtopics": "2008.", "bloom": "L4_ANALYZE", "prereq": "23"}, {"module": "Unit I", "num": 25, "title": "th", "subtopics": "th", "bloom": "L4_ANALYZE", "prereq": "24"}, {"module": "Unit I", "num": 26, "title": "3. B.S. Grewal, Higher Engineering Mathematics, Khanna Publications,44 edition,", "subtopics": "3. B.S. Grewal, Higher Engineering Mathematics, Khanna Publications,44 edition,", "bloom": "L4_ANALYZE", "prereq": "25"}, {"module": "Unit I", "num": 27, "title": "2017.", "subtopics": "2017.", "bloom": "L4_ANALYZE", "prereq": "26"}, {"module": "Unit I", "num": 28, "title": "Reference Books", "subtopics": "", "bloom": "L4_ANALYZE", "prereq": "27"}, {"module": "Unit I", "num": 29, "title": "1. M. Spiegel, S. Lipschutz , J. Schiller, and D. Spellman, Complex Variable (Schaum's", "subtopics": "1. M. Spiegel, S. Lipschutz , J. Schiller, and D. Spellman, Complex Variable (Schaum's", "bloom": "L4_ANALYZE", "prereq": "28"}, {"module": "Unit I", "num": 30, "title": "Outlines), Revised 2nd edition, 2017.", "subtopics": "Outlines), Revised 2nd edition, 2017.", "bloom": "L4_ANALYZE", "prereq": "29"}, {"module": "Unit I", "num": 31, "title": "2. R.V. Churchill and J.W. Brown, Complex variables and its applications, McGraw Hill,", "subtopics": "2. R.V. Churchill and J.W. Brown, Complex variables and its applications, McGraw Hill,", "bloom": "L4_ANALYZE", "prereq": "30"}, {"module": "Unit I", "num": 32, "title": "2009.", "subtopics": "2009.", "bloom": "L4_ANALYZE", "prereq": "31"}, {"module": "Unit I", "num": 33, "title": "Scheme and Syllabi 36 | Page", "subtopics": "Scheme and Syllabi 36 | Page", "bloom": "L4_ANALYZE", "prereq": "32"}, {"module": "Unit V", "num": 34, "title": "Deep Industrial Case Study: Safety-Critical Deployment of Complex Variables And Transform Techniques", "subtopics": "Production architecture, failure mode analysis (FMEA), trade-off Pareto curve", "bloom": "L5_EVALUATE", "prereq": "30"}, {"module": "Unit V", "num": 35, "title": "Emerging Research Frontiers: Physics-Informed Neural Networks & Modern Trends", "subtopics": "PINNs, digital twins, data-driven system identification, quantum computing extensions", "bloom": "L5_EVALUATE", "prereq": "34"}, {"module": "Unit V", "num": 36, "title": "End-to-End System Design Verification, Synthesis Defense & Capstone Review in Complex Variables And Transform Techniques", "subtopics": "Complete system verification, performance validation against specs, synthesis review", "bloom": "L6_CREATE", "prereq": "35"}];
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
