// DSP / Engineering Interactive Learning Engine
const lecturesData = [{"module": "Unit I", "num": 1, "title": "Basic Concepts of Vehicle Energy and Fuel Consumption", "subtopics": "Main elements of the energy", "bloom": "L2_UNDERSTAND", "prereq": "None"}, {"module": "Unit I", "num": 2, "title": "conversion scheme in vehicles, energy domains in vehicle propulsion systems, upstream", "subtopics": "conversion scheme in vehicles, energy domains in vehicle propulsion systems, upstream", "bloom": "L3_APPLY", "prereq": "1"}, {"module": "Unit I", "num": 3, "title": "processes, energy density of on-board energy carriers, fuel efficiency, pathways to better fuel", "subtopics": "processes, energy density of on-board energy carriers, fuel efficiency, pathways to better fuel", "bloom": "L2_UNDERSTAND", "prereq": "2"}, {"module": "Unit I", "num": 4, "title": "economy, types of losses, uphill driving force, performance and drivability, energy demand in", "subtopics": "economy, types of losses, uphill driving force, performance and drivability, energy demand in", "bloom": "L3_APPLY", "prereq": "3"}, {"module": "Unit I", "num": 5, "title": "driving cycles.", "subtopics": "driving cycles.", "bloom": "L2_UNDERSTAND", "prereq": "4"}, {"module": "Unit I", "num": 6, "title": "Vehicle Power Management in Electric and Hybrid Electric Vehicles", "subtopics": "Configurations of", "bloom": "L3_APPLY", "prereq": "5"}, {"module": "Unit I", "num": 7, "title": "hybrid electric vehicles (HEVs) and Electric vehicles (EVs), Types of HEVs and EVs,", "subtopics": "hybrid electric vehicles (HEVs) and Electric vehicles (EVs), Types of HEVs and EVs,", "bloom": "L2_UNDERSTAND", "prereq": "6"}, {"module": "Unit I", "num": 8, "title": "regenerative braking, battery technologies, role of power electronics and electric machines,", "subtopics": "regenerative braking, battery technologies, role of power electronics and electric machines,", "bloom": "L3_APPLY", "prereq": "7"}, {"module": "Unit I", "num": 9, "title": "advantages over conventional vehicles.", "subtopics": "advantages over conventional vehicles.", "bloom": "L2_UNDERSTAND", "prereq": "8"}, {"module": "Unit I", "num": 10, "title": "Global & National Developments and Technical Standards in EV Sector", "subtopics": "Study of global", "bloom": "L3_APPLY", "prereq": "9"}, {"module": "Unit I", "num": 11, "title": "EV Outlook \u2013 trends and developments in EV markets, promotion, polices, IEA technology", "subtopics": "EV Outlook \u2013 trends and developments in EV markets, promotion, polices, IEA technology", "bloom": "L4_ANALYZE", "prereq": "10"}, {"module": "Unit I", "num": 12, "title": "road map on electric and plug-in hybrid vehicles, FAME schemes, bureau of energy efficiency,", "subtopics": "road map on electric and plug-in hybrid vehicles, FAME schemes, bureau of energy efficiency,", "bloom": "L4_ANALYZE", "prereq": "11"}, {"module": "Unit I", "num": 13, "title": "niti aayog, progress and plans of OEMs.", "subtopics": "niti aayog, progress and plans of OEMs.", "bloom": "L4_ANALYZE", "prereq": "12"}, {"module": "Unit I", "num": 14, "title": "Battery Technologies and their Performance in EVs", "subtopics": "Battery parameters, types of", "bloom": "L4_ANALYZE", "prereq": "13"}, {"module": "Unit I", "num": 15, "title": "batteries, comparison, ultracapacitor, flywheel, battery charging and discharging, battery", "subtopics": "batteries, comparison, ultracapacitor, flywheel, battery charging and discharging, battery", "bloom": "L4_ANALYZE", "prereq": "14"}, {"module": "Unit I", "num": 16, "title": "efficiency, battery testing, factors affecting battery failures.", "subtopics": "efficiency, battery testing, factors affecting battery failures.", "bloom": "L4_ANALYZE", "prereq": "15"}, {"module": "Unit I", "num": 17, "title": "EV Charging Infrastructure", "subtopics": "Wired charging station (Static): Electric vehicle supply", "bloom": "L4_ANALYZE", "prereq": "16"}, {"module": "Unit I", "num": 18, "title": "equipment, classification of electric vehicle supply equipment, DC charging station, AC", "subtopics": "equipment, classification of electric vehicle supply equipment, DC charging station, AC", "bloom": "L4_ANALYZE", "prereq": "17"}, {"module": "Unit I", "num": 19, "title": "charging station, advantages and disadvantages of wired charging station, IEC standards for", "subtopics": "charging station, advantages and disadvantages of wired charging station, IEC standards for", "bloom": "L4_ANALYZE", "prereq": "18"}, {"module": "Unit I", "num": 20, "title": "wired charging Station.", "subtopics": "wired charging Station.", "bloom": "L4_ANALYZE", "prereq": "19"}, {"module": "Unit I", "num": 21, "title": "Wireless Charging Station (Dynamic)", "subtopics": "Composition of the wireless charging system,", "bloom": "L4_ANALYZE", "prereq": "20"}, {"module": "Unit I", "num": 22, "title": "Wireless charging challenges, IEC Standards for wireless charging Station.", "subtopics": "Wireless charging challenges, IEC Standards for wireless charging Station.", "bloom": "L4_ANALYZE", "prereq": "21"}, {"module": "Unit I", "num": 23, "title": "Text Books", "subtopics": "", "bloom": "L4_ANALYZE", "prereq": "22"}, {"module": "Unit I", "num": 24, "title": "1. Lino Guzzella and Antonio Sciarretta \u201cVehicle Propulsion Systems\u201d, Springer, 2005", "subtopics": "1. Lino Guzzella and Antonio Sciarretta \u201cVehicle Propulsion Systems\u201d, Springer, 2005", "bloom": "L4_ANALYZE", "prereq": "23"}, {"module": "Unit I", "num": 25, "title": "2. Xi Zhang and Chris Mi \u201cVehicle Power Management\u201d Springer, 2011", "subtopics": "2. Xi Zhang and Chris Mi \u201cVehicle Power Management\u201d Springer, 2011", "bloom": "L4_ANALYZE", "prereq": "24"}, {"module": "Unit I", "num": 26, "title": "3. James Larminie, John Lowry, \u201cElectric Vehicle Technology Explained,\u201d 2nd edition Willey,", "subtopics": "3. James Larminie, John Lowry, \u201cElectric Vehicle Technology Explained,\u201d 2nd edition Willey,", "bloom": "L4_ANALYZE", "prereq": "25"}, {"module": "Unit I", "num": 27, "title": "2012.", "subtopics": "2012.", "bloom": "L4_ANALYZE", "prereq": "26"}, {"module": "Unit I", "num": 28, "title": "Reference Books", "subtopics": "", "bloom": "L4_ANALYZE", "prereq": "27"}, {"module": "Unit I", "num": 29, "title": "1. Sandeep Dhameja, \u201cElectric Vehicle Battery Systems,\u201d 1st edition Elsevier, 2001.", "subtopics": "1. Sandeep Dhameja, \u201cElectric Vehicle Battery Systems,\u201d 1st edition Elsevier, 2001.", "bloom": "L4_ANALYZE", "prereq": "28"}, {"module": "Unit I", "num": 30, "title": "2. Naoui Mohamed, Flah Aymen, Mohammed Alqarni, Rania A. Turky, Basem Alamri, Ziad", "subtopics": "2. Naoui Mohamed, Flah Aymen, Mohammed Alqarni, Rania A. Turky, Basem Alamri, Ziad", "bloom": "L4_ANALYZE", "prereq": "29"}, {"module": "Unit I", "num": 31, "title": "M. Ali, Shady H.E. Abdel Aleem, \u201cA new wireless charging system for electric vehicles", "subtopics": "M. Ali, Shady H.E. Abdel Aleem, \u201cA new wireless charging system for electric vehicles", "bloom": "L4_ANALYZE", "prereq": "30"}, {"module": "Unit I", "num": 32, "title": "using two receiver coils,\u201d Ain Shams Engineering Journal, Volume 13, Issue 2, 2022.", "subtopics": "using two receiver coils,\u201d Ain Shams Engineering Journal, Volume 13, Issue 2, 2022.", "bloom": "L4_ANALYZE", "prereq": "31"}, {"module": "Unit I", "num": 33, "title": "Online Resources", "subtopics": "", "bloom": "L4_ANALYZE", "prereq": "32"}, {"module": "Unit I", "num": 34, "title": "1. https", "subtopics": "//www.iea.org/, IEA Global EV Outlook 2023", "bloom": "L4_ANALYZE", "prereq": "33"}, {"module": "Unit I", "num": 35, "title": "2. https", "subtopics": "//fame2.heavyindustries.gov.in/, National Automotive Board (NAB), Ministry of", "bloom": "L4_ANALYZE", "prereq": "34"}, {"module": "Unit I", "num": 36, "title": "Heavy Industries, Govt of India", "subtopics": "Heavy Industries, Govt of India", "bloom": "L4_ANALYZE", "prereq": "35"}];
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
