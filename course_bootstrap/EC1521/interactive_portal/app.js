// DSP / Engineering Interactive Learning Engine
const lecturesData = [{"module":"Basics of Signals and Systems","num":1,"title":"Continuous Time and Discrete Time signals","subtopics":"Continuous Time and Discrete Time signals concepts in Basics of Signals and Systems","bloom":"L3_APPLY","prereq":"None","is_lab":false},{"module":"Basics of Signals and Systems","num":2,"title":"Exponential and Sinusoidal Signals","subtopics":"Exponential and Sinusoidal Signals concepts in Basics of Signals and Systems","bloom":"L3_APPLY","prereq":"1","is_lab":false},{"module":"Basics of Signals and Systems","num":3,"title":"Unit Impulse and Unit Step Functions","subtopics":"Unit Impulse and Unit Step Functions concepts in Basics of Signals and Systems","bloom":"L3_APPLY","prereq":"2","is_lab":false},{"module":"Basics of Signals and Systems","num":4,"title":"Continuous and Discrete Time Systems","subtopics":"Continuous and Discrete Time Systems concepts in Basics of Signals and Systems","bloom":"L3_APPLY","prereq":"3","is_lab":false},{"module":"Basics of Signals and Systems","num":5,"title":"basic System Properties Linear Time Invariant Systems: Discrete Time LTI Systems","subtopics":"basic System Properties Linear Time Invariant Systems: Discrete Time LTI Systems concepts in Basics of Signals and Systems","bloom":"L3_APPLY","prereq":"4","is_lab":false},{"module":"Basics of Signals and Systems","num":6,"title":"Continuous Time LTI Systems","subtopics":"Continuous Time LTI Systems concepts in Basics of Signals and Systems","bloom":"L3_APPLY","prereq":"5","is_lab":false},{"module":"Basics of Signals and Systems","num":7,"title":"properties of LTI Systems","subtopics":"properties of LTI Systems concepts in Basics of Signals and Systems","bloom":"L3_APPLY","prereq":"6","is_lab":false},{"module":"Basics of Signals and Systems","num":8,"title":"causal LTI Systems Described by Difference equations Fourier Series Representation of Periodic Signals: Response of LTI systems to Complex Exponentials","subtopics":"causal LTI Systems Described by Difference equations Fourier Series Representation of Periodic Signals: Response of LTI systems to Complex Exponentials concepts in Basics of Signals and Systems","bloom":"L3_APPLY","prereq":"7","is_lab":false},{"module":"Basics of Signals and Systems","num":9,"title":"Fourier series Representation of CT periodic Signals","subtopics":"Fourier series Representation of CT periodic Signals concepts in Basics of Signals and Systems","bloom":"L3_APPLY","prereq":"8","is_lab":false},{"module":"Basics of Signals and Systems","num":10,"title":"properties of CT Fourier Series","subtopics":"properties of CT Fourier Series concepts in Basics of Signals and Systems","bloom":"L3_APPLY","prereq":"9","is_lab":false},{"module":"Basics of Signals and Systems","num":11,"title":"Fourier Series representation of DT periodic Signals","subtopics":"Fourier Series representation of DT periodic Signals concepts in Basics of Signals and Systems","bloom":"L3_APPLY","prereq":"10","is_lab":false},{"module":"Basics of Signals and Systems","num":12,"title":"properties of DFS","subtopics":"properties of DFS concepts in Basics of Signals and Systems","bloom":"L3_APPLY","prereq":"11","is_lab":false},{"module":"Basics of Signals and Systems","num":13,"title":"Fourier series and LTI Systems","subtopics":"Fourier series and LTI Systems concepts in Basics of Signals and Systems","bloom":"L3_APPLY","prereq":"12","is_lab":false},{"module":"Basics of Signals and Systems","num":14,"title":"Filtering","subtopics":"Filtering concepts in Basics of Signals and Systems","bloom":"L3_APPLY","prereq":"13","is_lab":false},{"module":"Basics of Signals and Systems","num":15,"title":"Examples of CT filters","subtopics":"Examples of CT filters concepts in Basics of Signals and Systems","bloom":"L3_APPLY","prereq":"14","is_lab":false},{"module":"Basics of Signals and Systems","num":16,"title":"Examples of DT filters Continuous Time Fourier Transform: Representation of a periodic Signals by continuous FT","subtopics":"Examples of DT filters Continuous Time Fourier Transform: Representation of a periodic Signals by continuous FT concepts in Basics of Signals and Systems","bloom":"L3_APPLY","prereq":"15","is_lab":false},{"module":"Basics of Signals and Systems","num":17,"title":"FT of periodic signals","subtopics":"FT of periodic signals concepts in Basics of Signals and Systems","bloom":"L3_APPLY","prereq":"16","is_lab":false},{"module":"Basics of Signals and Systems","num":18,"title":"convolution and multiplication property of continuous FT","subtopics":"convolution and multiplication property of continuous FT concepts in Basics of Signals and Systems","bloom":"L3_APPLY","prereq":"17","is_lab":false},{"module":"Basics of Signals and Systems","num":19,"title":"systems characterized by Linear Constant Coefficient Differential Equations Time And Frequency Characterization of Signals and Systems: Magnitude and phase representation of FT","subtopics":"systems characterized by Linear Constant Coefficient Differential Equations Time And Frequency Characterization of Signals and Systems: Magnitude and phase representation of FT concepts in Basics of Signals and Systems","bloom":"L4_ANALYZE","prereq":"18","is_lab":false},{"module":"Basics of Signals and Systems","num":20,"title":"Magnitude and phase response of LTI systems","subtopics":"Magnitude and phase response of LTI systems concepts in Basics of Signals and Systems","bloom":"L4_ANALYZE","prereq":"19","is_lab":false},{"module":"Basics of Signals and Systems","num":21,"title":"Time domain and Frequency domain aspects of ideal and non-ideal filters Discrete Time Fourier Transform (DTFT) convolution property","subtopics":"Time domain and Frequency domain aspects of ideal and non-ideal filters Discrete Time Fourier Transform (DTFT) convolution property concepts in Basics of Signals and Systems","bloom":"L4_ANALYZE","prereq":"20","is_lab":false},{"module":"Basics of Signals and Systems","num":22,"title":"multiplication property","subtopics":"multiplication property concepts in Basics of Signals and Systems","bloom":"L4_ANALYZE","prereq":"21","is_lab":false},{"module":"Basics of Signals and Systems","num":23,"title":"Duality","subtopics":"Duality concepts in Basics of Signals and Systems","bloom":"L4_ANALYZE","prereq":"22","is_lab":false},{"module":"Basics of Signals and Systems","num":24,"title":"Systems characterized by Linear Constant Coefficient Difference Equations Laplace Transforms: Review of Laplace transforms","subtopics":"Systems characterized by Linear Constant Coefficient Difference Equations Laplace Transforms: Review of Laplace transforms concepts in Basics of Signals and Systems","bloom":"L4_ANALYZE","prereq":"23","is_lab":false},{"module":"Basics of Signals and Systems","num":25,"title":"Inverse Laplace transform","subtopics":"Inverse Laplace transform concepts in Basics of Signals and Systems","bloom":"L4_ANALYZE","prereq":"24","is_lab":false},{"module":"Basics of Signals and Systems","num":26,"title":"Concept of region of convergence (ROC) for Laplace transforms","subtopics":"Concept of region of convergence (ROC) for Laplace transforms concepts in Basics of Signals and Systems","bloom":"L4_ANALYZE","prereq":"25","is_lab":false},{"module":"Basics of Signals and Systems","num":27,"title":"Properties of Laplace Transforms relation between Laplace and Fourier transforms","subtopics":"Properties of Laplace Transforms relation between Laplace and Fourier transforms concepts in Basics of Signals and Systems","bloom":"L4_ANALYZE","prereq":"26","is_lab":false},{"module":"Basics of Signals and Systems","num":28,"title":"Continuous Time and Discrete Time signals","subtopics":"Continuous Time and Discrete Time signals concepts in Basics of Signals and Systems","bloom":"L4_ANALYZE","prereq":"27","is_lab":false},{"module":"Basics of Signals and Systems","num":29,"title":"Exponential and Sinusoidal Signals","subtopics":"Exponential and Sinusoidal Signals concepts in Basics of Signals and Systems","bloom":"L4_ANALYZE","prereq":"28","is_lab":false},{"module":"Basics of Signals and Systems","num":30,"title":"Unit Impulse and Unit Step Functions","subtopics":"Unit Impulse and Unit Step Functions concepts in Basics of Signals and Systems","bloom":"L4_ANALYZE","prereq":"29","is_lab":false},{"module":"Basics of Signals and Systems","num":31,"title":"Continuous and Discrete Time Systems","subtopics":"Continuous and Discrete Time Systems concepts in Basics of Signals and Systems","bloom":"L4_ANALYZE","prereq":"30","is_lab":false},{"module":"Basics of Signals and Systems","num":32,"title":"basic System Properties Linear Time Invariant Systems: Discrete Time LTI Systems","subtopics":"basic System Properties Linear Time Invariant Systems: Discrete Time LTI Systems concepts in Basics of Signals and Systems","bloom":"L4_ANALYZE","prereq":"31","is_lab":false},{"module":"Basics of Signals and Systems","num":33,"title":"Continuous Time LTI Systems","subtopics":"Continuous Time LTI Systems concepts in Basics of Signals and Systems","bloom":"L4_ANALYZE","prereq":"32","is_lab":false},{"module":"Basics of Signals and Systems","num":34,"title":"properties of LTI Systems","subtopics":"properties of LTI Systems concepts in Basics of Signals and Systems","bloom":"L4_ANALYZE","prereq":"33","is_lab":false},{"module":"Basics of Signals and Systems","num":35,"title":"causal LTI Systems Described by Difference equations Fourier Series Representation of Periodic Signals: Response of LTI systems to Complex Exponentials","subtopics":"causal LTI Systems Described by Difference equations Fourier Series Representation of Periodic Signals: Response of LTI systems to Complex Exponentials concepts in Basics of Signals and Systems","bloom":"L4_ANALYZE","prereq":"34","is_lab":false},{"module":"Basics of Signals and Systems","num":36,"title":"Fourier series Representation of CT periodic Signals","subtopics":"Fourier series Representation of CT periodic Signals concepts in Basics of Signals and Systems","bloom":"L4_ANALYZE","prereq":"35","is_lab":false}];
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
