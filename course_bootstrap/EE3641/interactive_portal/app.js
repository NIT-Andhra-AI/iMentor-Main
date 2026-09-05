// EE3641: Introduction to Electric Vehicles - High-Fidelity Interactive Learning Engine
// Styled and engineered after spkkarri/DSP-Course standard
const lecturesData = [{"module": "Unit I", "num": 1, "title": "Basic Concepts of Vehicle Energy and Fuel Consumption", "subtopics": "Main elements of the energy", "bloom": "L2_UNDERSTAND"}, {"module": "Unit I", "num": 2, "title": "conversion scheme in vehicles, energy domains in vehicle propulsion systems, upstream", "subtopics": "conversion scheme in vehicles, energy domains in vehicle propulsion systems, upstream", "bloom": "L3_APPLY"}, {"module": "Unit I", "num": 3, "title": "processes, energy density of on-board energy carriers, fuel efficiency, pathways to better fuel", "subtopics": "processes, energy density of on-board energy carriers, fuel efficiency, pathways to better fuel", "bloom": "L2_UNDERSTAND"}, {"module": "Unit I", "num": 4, "title": "economy, types of losses, uphill driving force, performance and drivability, energy demand in", "subtopics": "economy, types of losses, uphill driving force, performance and drivability, energy demand in", "bloom": "L3_APPLY"}, {"module": "Unit I", "num": 5, "title": "driving cycles.", "subtopics": "driving cycles.", "bloom": "L2_UNDERSTAND"}, {"module": "Unit I", "num": 6, "title": "Vehicle Power Management in Electric and Hybrid Electric Vehicles", "subtopics": "Configurations of", "bloom": "L3_APPLY"}, {"module": "Unit I", "num": 7, "title": "hybrid electric vehicles (HEVs) and Electric vehicles (EVs), Types of HEVs and EVs,", "subtopics": "hybrid electric vehicles (HEVs) and Electric vehicles (EVs), Types of HEVs and EVs,", "bloom": "L2_UNDERSTAND"}, {"module": "Unit I", "num": 8, "title": "regenerative braking, battery technologies, role of power electronics and electric machines,", "subtopics": "regenerative braking, battery technologies, role of power electronics and electric machines,", "bloom": "L3_APPLY"}, {"module": "Unit I", "num": 9, "title": "advantages over conventional vehicles.", "subtopics": "advantages over conventional vehicles.", "bloom": "L2_UNDERSTAND"}, {"module": "Unit I", "num": 10, "title": "Global & National Developments and Technical Standards in EV Sector", "subtopics": "Study of global", "bloom": "L3_APPLY"}, {"module": "Unit I", "num": 11, "title": "EV Outlook \u2013 trends and developments in EV markets, promotion, polices, IEA technology", "subtopics": "EV Outlook \u2013 trends and developments in EV markets, promotion, polices, IEA technology", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 12, "title": "road map on electric and plug-in hybrid vehicles, FAME schemes, bureau of energy efficiency,", "subtopics": "road map on electric and plug-in hybrid vehicles, FAME schemes, bureau of energy efficiency,", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 13, "title": "niti aayog, progress and plans of OEMs.", "subtopics": "niti aayog, progress and plans of OEMs.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 14, "title": "Battery Technologies and their Performance in EVs", "subtopics": "Battery parameters, types of", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 15, "title": "batteries, comparison, ultracapacitor, flywheel, battery charging and discharging, battery", "subtopics": "batteries, comparison, ultracapacitor, flywheel, battery charging and discharging, battery", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 16, "title": "efficiency, battery testing, factors affecting battery failures.", "subtopics": "efficiency, battery testing, factors affecting battery failures.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 17, "title": "EV Charging Infrastructure", "subtopics": "Wired charging station (Static): Electric vehicle supply", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 18, "title": "equipment, classification of electric vehicle supply equipment, DC charging station, AC", "subtopics": "equipment, classification of electric vehicle supply equipment, DC charging station, AC", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 19, "title": "charging station, advantages and disadvantages of wired charging station, IEC standards for", "subtopics": "charging station, advantages and disadvantages of wired charging station, IEC standards for", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 20, "title": "wired charging Station.", "subtopics": "wired charging Station.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 21, "title": "Wireless Charging Station (Dynamic)", "subtopics": "Composition of the wireless charging system,", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 22, "title": "Wireless charging challenges, IEC Standards for wireless charging Station.", "subtopics": "Wireless charging challenges, IEC Standards for wireless charging Station.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 23, "title": "Text Books", "subtopics": "", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 24, "title": "1. Lino Guzzella and Antonio Sciarretta \u201cVehicle Propulsion Systems\u201d, Springer, 2005", "subtopics": "1. Lino Guzzella and Antonio Sciarretta \u201cVehicle Propulsion Systems\u201d, Springer, 2005", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 25, "title": "2. Xi Zhang and Chris Mi \u201cVehicle Power Management\u201d Springer, 2011", "subtopics": "2. Xi Zhang and Chris Mi \u201cVehicle Power Management\u201d Springer, 2011", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 26, "title": "3. James Larminie, John Lowry, \u201cElectric Vehicle Technology Explained,\u201d 2nd edition Willey,", "subtopics": "3. James Larminie, John Lowry, \u201cElectric Vehicle Technology Explained,\u201d 2nd edition Willey,", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 27, "title": "2012.", "subtopics": "2012.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 28, "title": "Reference Books", "subtopics": "", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 29, "title": "1. Sandeep Dhameja, \u201cElectric Vehicle Battery Systems,\u201d 1st edition Elsevier, 2001.", "subtopics": "1. Sandeep Dhameja, \u201cElectric Vehicle Battery Systems,\u201d 1st edition Elsevier, 2001.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 30, "title": "2. Naoui Mohamed, Flah Aymen, Mohammed Alqarni, Rania A. Turky, Basem Alamri, Ziad", "subtopics": "2. Naoui Mohamed, Flah Aymen, Mohammed Alqarni, Rania A. Turky, Basem Alamri, Ziad", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 31, "title": "M. Ali, Shady H.E. Abdel Aleem, \u201cA new wireless charging system for electric vehicles", "subtopics": "M. Ali, Shady H.E. Abdel Aleem, \u201cA new wireless charging system for electric vehicles", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 32, "title": "using two receiver coils,\u201d Ain Shams Engineering Journal, Volume 13, Issue 2, 2022.", "subtopics": "using two receiver coils,\u201d Ain Shams Engineering Journal, Volume 13, Issue 2, 2022.", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 33, "title": "Online Resources", "subtopics": "", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 34, "title": "1. https", "subtopics": "//www.iea.org/, IEA Global EV Outlook 2023", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 35, "title": "2. https", "subtopics": "//fame2.heavyindustries.gov.in/, National Automotive Board (NAB), Ministry of", "bloom": "L4_ANALYZE"}, {"module": "Unit I", "num": 36, "title": "Heavy Industries, Govt of India", "subtopics": "Heavy Industries, Govt of India", "bloom": "L4_ANALYZE"}];
const courseCategory = "circuits";
let currentLecIndex = 0;
let isAnimating = true;
let animFrameId = null;
let simTime = 0;

document.addEventListener('DOMContentLoaded', () => {
    loadLecture(1);
    initSimulator();
    if (window.renderMathInElement) {
        renderMathInElement(document.body, {
            delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false },
                { left: "\(", right: "\)", display: false },
                { left: "\[", right: "\]", display: true }
            ]
        });
    }
});

function loadLecture(num) {
    const idx = lecturesData.findIndex(l => l.num === num);
    if (idx === -1) return;
    currentLecIndex = idx;
    const lec = lecturesData[idx];

    // Update active lecture in sidebar
    document.querySelectorAll('.lecture-item').forEach(item => {
        item.classList.toggle('active', parseInt(item.getAttribute('data-lecture')) === num);
    });

    // Update Header
    document.getElementById('currentLecBadge').innerText = `Lecture ${lec.num}: ${lec.title}`;
    document.getElementById('bloomBadge').innerText = lec.bloom || 'L3_APPLY';
    document.getElementById('lectureSubtopics').innerHTML = `<strong>Module:</strong> ${lec.module} &bull; <strong>Topics:</strong> ${lec.subtopics || 'Foundational Principles'}`;

    // Reset Checkpoint feedback
    const fb = document.getElementById('checkpointFeedback');
    if (fb) fb.style.display = 'none';

    // Rerender KaTeX if applicable
    if (window.renderMathInElement) {
        renderMathInElement(document.getElementById('theoryDesc'));
    }
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

function toggleAccordion(el) {
    const acc = el.parentElement;
    acc.classList.toggle('open');
}

// Block Diagram interactive inspection
const blockDetails = {
    data: { title: "Data Preprocessing & Feature Pipeline", desc: "Performs standard scaling \(z = (x - \mu)/\sigma\), missing value imputation, and feature extraction to condition the input manifold." },
    forward: { title: "Forward Activation & Affine Maps", desc: "Computes affine transformation \(z = Wx + b\) followed by elementwise non-linear activations (ReLU, Sigmoid) to project into latent space." },
    loss: { title: "Objective Function / Empirical Risk", desc: "Measures discrepancy between predictions and ground-truth using convex MSE or Cross-Entropy \(\mathcal{L} = -\sum y \log \hat{y}\)." },
    backprop: { title: "Gradient Backpropagation", desc: "Applies the chain rule recursively through computational graph tensors to calculate parameter partial derivatives \(\frac{\partial \mathcal{L}}{\partial W}\)." },
    inference: { title: "Model Inference & Decision Boundary", desc: "Projects final separating hyperplanes or regression surfaces across the validation feature manifold with bounded confidence." },
    source: { title: "Continuous AC/DC Signal Source", desc: "Delivers energetic excitation \(v_{in}(t) = V_m \sin(\omega t)\) or transient step input into the connected reactive network." },
    inductor: { title: "Inductive Choke Storage", desc: "Stores kinetic magnetic energy \(E_L = \frac{1}{2} L I^2\) and opposes instantaneous current variations via Lenz's law." },
    resistor: { title: "Damping Resistor", desc: "Dissipates circuit energy thermally via Joule heating \(P = I^2 R\), providing exponential transient damping \(e^{-\alpha t}\)." },
    capacitor: { title: "Capacitive Storage Tank", desc: "Stores electrostatic potential energy \(E_C = \frac{1}{2} C V^2\) and buffers charge to establish resonance frequency." },
    output: { title: "Terminal Load & Matching", desc: "Receives filtered electrical power; achieves maximum power transfer when load matches Thevenin impedance \(R_L = R_{th}\)." }
};

function selectBlock(key) {
    document.querySelectorAll('.diagram-node').forEach(node => node.classList.remove('active-block'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active-block');
    }
    const detail = blockDetails[key] || { title: "System Component", desc: "Operational stage contributing to closed-loop dynamics." };
    document.getElementById('diagramInfoTitle').innerText = detail.title;
    document.getElementById('diagramInfoDesc').innerText = detail.desc;
    if (window.renderMathInElement) {
        renderMathInElement(document.getElementById('diagramInfoDesc'));
    }
}

// Canvas Simulation Engine
const canvas = document.getElementById('interactiveCanvas');
const ctx = canvas.getContext('2d');

function initSimulator() {
    handleParamChange();
    startLoop();
}

function startLoop() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    function loop() {
        if (isAnimating) {
            simTime += 0.03;
        }
        renderSimulation();
        animFrameId = requestAnimationFrame(loop);
    }
    animFrameId = requestAnimationFrame(loop);
}

function toggleAnimation() {
    isAnimating = !isAnimating;
}

function resetSimulation() {
    simTime = 0;
    handleParamChange();
}

function handleParamChange() {
    const p1 = parseFloat(document.getElementById('sliderParam1').value);
    const p2 = parseFloat(document.getElementById('sliderParam2').value);
    const p3 = parseFloat(document.getElementById('sliderParam3').value);

    document.getElementById('valParam1').innerText = p1.toFixed(2);
    document.getElementById('valParam2').innerText = p2.toFixed(2);
    document.getElementById('valParam3').innerText = p3.toFixed(2);

    updateStatusPill(p1, p2, p3);
}

function updateStatusPill(p1, p2, p3) {
    const pill = document.getElementById('statusPill');
    if (!pill) return;

    if (courseCategory === "ml" || courseCategory === "drl") {
        if (p1 > 0.85) {
            pill.className = "status-pill danger";
            pill.innerHTML = "&bull; Divergence / Exploding Gradient";
        } else if (p1 < 0.04) {
            pill.className = "status-pill warning";
            pill.innerHTML = "&bull; Vanishing / Stalled Step";
        } else {
            pill.className = "status-pill success";
            pill.innerHTML = "&bull; Optimal Gradient Descent";
        }
    } else if (courseCategory === "circuits") {
        const R = p1, L = p2 * 1e-3, C = p3 * 1e-6;
        const alpha = R / (2 * L);
        const w0 = 1 / Math.sqrt(L * C);
        const zeta = alpha / w0;
        if (zeta < 0.95) {
            pill.className = "status-pill warning";
            pill.innerHTML = `&bull; Underdamped (&zeta; = ${zeta.toFixed(2)})`;
        } else if (zeta > 1.05) {
            pill.className = "status-pill success";
            pill.innerHTML = `&bull; Overdamped (&zeta; = ${zeta.toFixed(2)})`;
        } else {
            pill.className = "status-pill success";
            pill.innerHTML = "&bull; Critically Damped (&zeta; &approx; 1.00)";
        }
    } else if (courseCategory === "control") {
        const zeta = p1, wn = p2, K = p3;
        if (zeta < 0.2 || K > 25) {
            pill.className = "status-pill danger";
            pill.innerHTML = "&bull; High Overshoot &gt; 50%";
        } else if (zeta > 1.1) {
            pill.className = "status-pill warning";
            pill.innerHTML = "&bull; Sluggish Overdamped";
        } else {
            pill.className = "status-pill success";
            pill.innerHTML = `&bull; Optimal Response (&zeta; = ${zeta.toFixed(2)})`;
        }
    } else if (courseCategory === "power_electronics" || courseCategory === "machines") {
        const D = p1, fsw = p2;
        if (D > 0.85) {
            pill.className = "status-pill warning";
            pill.innerHTML = "&bull; High Duty Saturation Warning";
        } else if (fsw < 25) {
            pill.className = "status-pill danger";
            pill.innerHTML = "&bull; High Inductor Ripple &Delta;I_L";
        } else {
            pill.className = "status-pill success";
            pill.innerHTML = "&bull; Safe CCM Operation";
        }
    } else {
        pill.className = "status-pill success";
        pill.innerHTML = "&bull; Stable LTI Trajectory";
    }
}

function drawGrid(w, h) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); ctx.stroke();
}

function renderSimulation() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    drawGrid(w, h);

    const p1 = parseFloat(document.getElementById('sliderParam1').value);
    const p2 = parseFloat(document.getElementById('sliderParam2').value);
    const p3 = parseFloat(document.getElementById('sliderParam3').value);

    if (courseCategory === "ml" || courseCategory === "drl") {
        const cx = w/2, cy = h/2;
        const gamma = p3;
        
        ctx.lineWidth = 1.2;
        for (let r = 25; r <= 140; r += 25) {
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.15 + r/300})`;
            ctx.beginPath();
            ctx.ellipse(cx, cy, r * (1 + gamma * 0.1), r * 0.8, -0.2, 0, Math.PI * 2);
            ctx.stroke();
        }

        const lr = p1;
        const momentum = p2;
        let x = cx - 180;
        let y = cy - 90;
        let vx = 0, vy = 0;

        ctx.strokeStyle = "#0dd5c5";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x, y);

        const steps = 18;
        for (let i = 0; i < steps; i++) {
            const gx = (x - cx) * 0.12;
            const gy = (y - cy) * 0.12 * gamma * 0.4;
            vx = momentum * vx - lr * gx;
            vy = momentum * vy - lr * gy;
            x += vx + Math.sin(simTime + i) * 1.5;
            y += vy + Math.cos(simTime + i) * 1.5;
            ctx.lineTo(x, y);

            ctx.fillStyle = i === steps - 1 ? "#ef4444" : "#0dd5c5";
            ctx.beginPath();
            ctx.arc(x, y, i === steps - 1 ? 5 : 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.stroke();

        ctx.fillStyle = "#f3f4f6";
        ctx.font = "12px 'Fira Code', monospace";
        ctx.fillText(`Global Optimum W*=(0,0)  |  Loss J = ${Math.max(0.01, 1.2 / (1 + p1 * 5)).toFixed(3)}`, 20, 26);

    } else if (courseCategory === "circuits") {
        const R = p1, L = p2 * 1e-3, C = p3 * 1e-6;
        const alpha = R / (2 * L);
        const w0 = 1 / Math.sqrt(L * C);
        const zeta = alpha / w0;
        const wd = w0 * Math.sqrt(Math.max(0, 1 - zeta * zeta));

        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        for (let px = 0; px < w; px++) {
            const t = (px / w) * 0.02;
            let v = 0;
            if (zeta < 1.0) {
                v = 100 * Math.exp(-alpha * t) * Math.cos(wd * t - simTime * 5);
            } else {
                v = 100 * Math.exp(-alpha * t);
            }
            const py = (h/2) - v;
            if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();

        ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (let px = 0; px < w; px++) {
            const t = (px / w) * 0.02;
            const env = 100 * Math.exp(-alpha * t);
            const py = (h/2) - env;
            if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#0dd5c5";
        ctx.font = "12px 'Fira Code', monospace";
        ctx.fillText(`w0 = ${w0.toFixed(0)} rad/s  |  zeta = ${zeta.toFixed(2)}  |  alpha = ${alpha.toFixed(0)} Np/s`, 20, 26);

    } else if (courseCategory === "control") {
        const zeta = p1, wn = p2;
        const wd = wn * Math.sqrt(Math.max(0, 1 - zeta * zeta));
        const phi = Math.atan2(Math.sqrt(Math.max(0, 1 - zeta * zeta)), zeta);

        ctx.strokeStyle = "#0dd5c5";
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        for (let px = 0; px < w; px++) {
            const t = (px / w) * 5.0;
            let y = 1.0;
            if (zeta < 1.0) {
                y = 1.0 - (Math.exp(-zeta * wn * t) / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t + phi);
            } else {
                y = 1.0 - Math.exp(-zeta * wn * t) * (1 + wn * t);
            }
            const py = (h - 60) - y * 180;
            if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(0, (h - 60) - 180);
        ctx.lineTo(w, (h - 60) - 180);
        ctx.stroke();
        ctx.setLineDash([]);

        const Mp = zeta < 1.0 ? Math.exp(-Math.PI * zeta / Math.sqrt(1 - zeta * zeta)) * 100 : 0;
        const ts = 4.0 / (zeta * wn);

        ctx.fillStyle = "#f3f4f6";
        ctx.font = "12px 'Fira Code', monospace";
        ctx.fillText(`Overshoot Mp = ${Mp.toFixed(1)}%  |  Settling ts = ${ts.toFixed(2)}s  |  wn = ${wn.toFixed(1)} rad/s`, 20, 26);

    } else {
        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let px = 0; px < w; px++) {
            const t = (px / w) * 6 * Math.PI;
            const yVal = (h/2) + Math.sin(t * p2 * 0.2 + simTime) * 80 * Math.exp(-p1 * 0.1 * (px / w * 5));
            if (px === 0) ctx.moveTo(px, yVal); else ctx.lineTo(px, yVal);
        }
        ctx.stroke();

        ctx.fillStyle = "#0dd5c5";
        ctx.font = "12px 'Fira Code', monospace";
        ctx.fillText(`State Vector Dynamic x(t)  |  Damping = ${p1.toFixed(2)}  |  Freq = ${p2.toFixed(2)}`, 20, 26);
    }
}

function checkAnswer(chosenIdx) {
    const fb = document.getElementById('checkpointFeedback');
    fb.style.display = 'block';
    if (chosenIdx === 0) {
        fb.className = 'feedback-alert feedback-correct';
        fb.innerHTML = '<strong>✓ Correct!</strong> Outstanding analysis. Your answer perfectly matches the foundational engineering criterion.';
    } else {
        fb.className = 'feedback-alert feedback-wrong';
        fb.innerHTML = '<strong>✗ Incorrect.</strong> Review the governing equations and parameter relationships above before re-attempting.';
    }
}
