// DSP / Engineering Interactive Learning Engine
const lecturesData = [{"module":"DC Machines","num":1,"title":"Review of electromagnetic fundamentals","subtopics":"Review of electromagnetic fundamentals concepts in DC Machines","bloom":"L3_APPLY","prereq":"None","is_lab":false},{"module":"DC Machines","num":2,"title":"principles of energy conversion – basic magnetic circuit analysis","subtopics":"principles of energy conversion – basic magnetic circuit analysis concepts in DC Machines","bloom":"L3_APPLY","prereq":"1","is_lab":false},{"module":"DC Machines","num":3,"title":"construction","subtopics":"construction concepts in DC Machines","bloom":"L3_APPLY","prereq":"2","is_lab":false},{"module":"DC Machines","num":4,"title":"principle of operation","subtopics":"principle of operation concepts in DC Machines","bloom":"L3_APPLY","prereq":"3","is_lab":false},{"module":"DC Machines","num":5,"title":"lap and wave windings; methods of excitation","subtopics":"lap and wave windings; methods of excitation concepts in DC Machines","bloom":"L3_APPLY","prereq":"4","is_lab":false},{"module":"DC Machines","num":6,"title":"emf and torque equations","subtopics":"emf and torque equations concepts in DC Machines","bloom":"L3_APPLY","prereq":"5","is_lab":false},{"module":"DC Machines","num":7,"title":"characteristics of machines operating as motors and generators; commutation","subtopics":"characteristics of machines operating as motors and generators; commutation concepts in DC Machines","bloom":"L3_APPLY","prereq":"6","is_lab":false},{"module":"DC Machines","num":8,"title":"armature reaction speed control methods","subtopics":"armature reaction speed control methods concepts in DC Machines","bloom":"L3_APPLY","prereq":"7","is_lab":false},{"module":"DC Machines","num":9,"title":"losses and efficiency; starters for DC motors Testing of DC machines Single-Phase Transformers: types and construction","subtopics":"losses and efficiency; starters for DC motors Testing of DC machines Single-Phase Transformers: types and construction concepts in DC Machines","bloom":"L3_APPLY","prereq":"8","is_lab":false},{"module":"DC Machines","num":10,"title":"principle of operation","subtopics":"principle of operation concepts in DC Machines","bloom":"L3_APPLY","prereq":"9","is_lab":false},{"module":"DC Machines","num":11,"title":"EMF equation","subtopics":"EMF equation concepts in DC Machines","bloom":"L3_APPLY","prereq":"10","is_lab":false},{"module":"DC Machines","num":12,"title":"equivalent circuit","subtopics":"equivalent circuit concepts in DC Machines","bloom":"L3_APPLY","prereq":"11","is_lab":false},{"module":"DC Machines","num":13,"title":"phasor diagram","subtopics":"phasor diagram concepts in DC Machines","bloom":"L3_APPLY","prereq":"12","is_lab":false},{"module":"DC Machines","num":14,"title":"losses","subtopics":"losses concepts in DC Machines","bloom":"L3_APPLY","prereq":"13","is_lab":false},{"module":"DC Machines","num":15,"title":"efficiency and regulation; OC and SC tests","subtopics":"efficiency and regulation; OC and SC tests concepts in DC Machines","bloom":"L3_APPLY","prereq":"14","is_lab":false},{"module":"DC Machines","num":16,"title":"polarity test","subtopics":"polarity test concepts in DC Machines","bloom":"L3_APPLY","prereq":"15","is_lab":false},{"module":"DC Machines","num":17,"title":"parallel operation","subtopics":"parallel operation concepts in DC Machines","bloom":"L3_APPLY","prereq":"16","is_lab":false},{"module":"DC Machines","num":18,"title":"Sumpner’s test","subtopics":"Sumpner’s test concepts in DC Machines","bloom":"L3_APPLY","prereq":"17","is_lab":false},{"module":"DC Machines","num":19,"title":"auto transformers","subtopics":"auto transformers concepts in DC Machines","bloom":"L4_ANALYZE","prereq":"18","is_lab":false},{"module":"DC Machines","num":20,"title":"saving of copper and its application Three-Phase Transformer: Construction","subtopics":"saving of copper and its application Three-Phase Transformer: Construction concepts in DC Machines","bloom":"L4_ANALYZE","prereq":"19","is_lab":false},{"module":"DC Machines","num":21,"title":"type of connections","subtopics":"type of connections concepts in DC Machines","bloom":"L4_ANALYZE","prereq":"20","is_lab":false},{"module":"DC Machines","num":22,"title":"voltage and current relations","subtopics":"voltage and current relations concepts in DC Machines","bloom":"L4_ANALYZE","prereq":"21","is_lab":false},{"module":"DC Machines","num":23,"title":"all day efficiency","subtopics":"all day efficiency concepts in DC Machines","bloom":"L4_ANALYZE","prereq":"22","is_lab":false},{"module":"DC Machines","num":24,"title":"use of tertiary winding","subtopics":"use of tertiary winding concepts in DC Machines","bloom":"L4_ANALYZE","prereq":"23","is_lab":false},{"module":"DC Machines","num":25,"title":"tap changing","subtopics":"tap changing concepts in DC Machines","bloom":"L4_ANALYZE","prereq":"24","is_lab":false},{"module":"DC Machines","num":26,"title":"scott connection","subtopics":"scott connection concepts in DC Machines","bloom":"L4_ANALYZE","prereq":"25","is_lab":false},{"module":"DC Machines","num":27,"title":"cooling methods","subtopics":"cooling methods concepts in DC Machines","bloom":"L4_ANALYZE","prereq":"26","is_lab":false},{"module":"DC Machines","num":28,"title":"Review of electromagnetic fundamentals","subtopics":"Review of electromagnetic fundamentals concepts in DC Machines","bloom":"L4_ANALYZE","prereq":"27","is_lab":false},{"module":"DC Machines","num":29,"title":"principles of energy conversion – basic magnetic circuit analysis","subtopics":"principles of energy conversion – basic magnetic circuit analysis concepts in DC Machines","bloom":"L4_ANALYZE","prereq":"28","is_lab":false},{"module":"DC Machines","num":30,"title":"construction","subtopics":"construction concepts in DC Machines","bloom":"L4_ANALYZE","prereq":"29","is_lab":false},{"module":"DC Machines","num":31,"title":"principle of operation","subtopics":"principle of operation concepts in DC Machines","bloom":"L4_ANALYZE","prereq":"30","is_lab":false},{"module":"DC Machines","num":32,"title":"lap and wave windings; methods of excitation","subtopics":"lap and wave windings; methods of excitation concepts in DC Machines","bloom":"L4_ANALYZE","prereq":"31","is_lab":false},{"module":"DC Machines","num":33,"title":"emf and torque equations","subtopics":"emf and torque equations concepts in DC Machines","bloom":"L4_ANALYZE","prereq":"32","is_lab":false},{"module":"DC Machines","num":34,"title":"characteristics of machines operating as motors and generators; commutation","subtopics":"characteristics of machines operating as motors and generators; commutation concepts in DC Machines","bloom":"L4_ANALYZE","prereq":"33","is_lab":false},{"module":"DC Machines","num":35,"title":"armature reaction speed control methods","subtopics":"armature reaction speed control methods concepts in DC Machines","bloom":"L4_ANALYZE","prereq":"34","is_lab":false},{"module":"DC Machines","num":36,"title":"losses and efficiency; starters for DC motors Testing of DC machines Single-Phase Transformers: types and construction","subtopics":"losses and efficiency; starters for DC motors Testing of DC machines Single-Phase Transformers: types and construction concepts in DC Machines","bloom":"L4_ANALYZE","prereq":"35","is_lab":false}];
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
