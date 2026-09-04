// DSP / Engineering Interactive Learning Engine
const lecturesData = [{"module": "Unit I", "num": 1, "title": "Discrete-Time Signals & Systems Classification", "subtopics": "Standard DT sequences, linearity, time-invariance, causality, stability", "bloom": "L2_UNDERSTAND", "prereq": "None"}, {"module": "Unit I", "num": 2, "title": "Linear Convolution Sum & Interconnected LTI Systems", "subtopics": "Convolution sum derivation, graphical computation, properties, parallel/cascade systems", "bloom": "L3_APPLY", "prereq": "1"}, {"module": "Unit I", "num": 3, "title": "Difference Equations & Dynamic System Impulse Response", "subtopics": "Constant coefficient linear difference equations, homogeneous/particular solutions", "bloom": "L3_APPLY", "prereq": "2"}, {"module": "Unit I", "num": 4, "title": "Discrete-Time Fourier Transform (DTFT) Foundations", "subtopics": "DTFT analysis/synthesis pairs, convergence conditions, energy spectral density", "bloom": "L3_APPLY", "prereq": "2"}, {"module": "Unit I", "num": 5, "title": "DTFT Symmetry & Operational Properties", "subtopics": "Time-shifting, frequency-shifting, modulation, convolution and multiplication theorems", "bloom": "L3_APPLY", "prereq": "4"}, {"module": "Unit I", "num": 6, "title": "Frequency Response of LTI Systems & Distortionless Transmission", "subtopics": "Magnitude and phase response, group delay, phase delay, linear phase conditions", "bloom": "L4_ANALYZE", "prereq": "5"}, {"module": "Unit I", "num": 7, "title": "Z-Transform Theory & Region of Convergence (ROC)", "subtopics": "Bilateral Z-transform, ROC properties for causal/anti-causal sequences, pole-zero plots", "bloom": "L3_APPLY", "prereq": "1"}, {"module": "Unit II", "num": 8, "title": "Inverse Z-Transform & Rational Transfer Functions", "subtopics": "Partial fraction expansion, power series method, contour integration inversion", "bloom": "L3_APPLY", "prereq": "7"}, {"module": "Unit II", "num": 9, "title": "System Stability & Causality Analysis in Z-Domain", "subtopics": "Poles inside unit circle, minimum-phase vs all-pass decomposition", "bloom": "L4_ANALYZE", "prereq": "8"}, {"module": "Unit II", "num": 10, "title": "Discrete Fourier Transform (DFT) & Frequency Sampling", "subtopics": "Sampling the DTFT, DFT and IDFT definition, relation between DTFT and DFT", "bloom": "L3_APPLY", "prereq": "4"}, {"module": "Unit II", "num": 11, "title": "Mathematical Properties of the Discrete Fourier Transform", "subtopics": "Periodicity, linearity, circular shift, circular time-reversal, Parseval's theorem", "bloom": "L3_APPLY", "prereq": "10"}, {"module": "Unit II", "num": 12, "title": "Circular Convolution & Linear Convolution Equivalence", "subtopics": "Matrix form of circular convolution, zero-padding requirements for linear filtering", "bloom": "L4_ANALYZE", "prereq": "11"}, {"module": "Unit II", "num": 13, "title": "Fast Fourier Transform: Radix-2 Decimation-in-Time (DIT-FFT)", "subtopics": "Cooley-Tukey decomposition, butterfly computation structure, in-place bit reversal", "bloom": "L4_ANALYZE", "prereq": "10"}, {"module": "Unit II", "num": 14, "title": "Fast Fourier Transform: Radix-2 Decimation-in-Frequency (DIF-FFT)", "subtopics": "DIF butterfly derivation, comparison with DIT, computational complexity O(N log N)", "bloom": "L4_ANALYZE", "prereq": "13"}, {"module": "Unit III", "num": 15, "title": "High-Throughput Block Convolution: Overlap-Add & Overlap-Save", "subtopics": "Sectioned convolution for continuous streaming signals, real-time filtering trade-offs", "bloom": "L4_ANALYZE", "prereq": "12"}, {"module": "Unit III", "num": 16, "title": "Analog Filter Approximation: Butterworth Prototype", "subtopics": "Maximally flat passband response, filter order determination, pole placement in s-plane", "bloom": "L4_ANALYZE", "prereq": "6"}, {"module": "Unit III", "num": 17, "title": "Analog Filter Approximation: Chebyshev Type I & II", "subtopics": "Equiripple passband / stopband characteristics, elliptic and Bessel approximations", "bloom": "L4_ANALYZE", "prereq": "16"}, {"module": "Unit III", "num": 18, "title": "IIR Filter Design: Bilinear Transformation Method", "subtopics": "s-to-z plane conformal mapping, algebraic pre-warping formula, stability preservation", "bloom": "L4_ANALYZE", "prereq": "16"}, {"module": "Unit III", "num": 19, "title": "IIR Filter Design: Impulse Invariance Method", "subtopics": "Impulse response discretization, frequency aliasing effects, comparison with Bilinear", "bloom": "L4_ANALYZE", "prereq": "18"}, {"module": "Unit III", "num": 20, "title": "Digital Frequency Transformations for IIR Filters", "subtopics": "Low-pass to high-pass, band-pass, and band-stop transformations in discrete domain", "bloom": "L4_ANALYZE", "prereq": "18"}, {"module": "Unit III", "num": 21, "title": "Linear Phase FIR Filter Fundamentals & 4 Filter Types", "subtopics": "Symmetric/anti-symmetric impulse responses, Type 1-4 zero locations, linear phase proofs", "bloom": "L4_ANALYZE", "prereq": "6"}, {"module": "Unit III", "num": 22, "title": "FIR Filter Design: Windowing Method & Gibbs Phenomenon", "subtopics": "Rectangular, Hanning, Hamming, Blackman, and Kaiser windows, mainlobe vs sidelobe trade-offs", "bloom": "L5_EVALUATE", "prereq": "21"}, {"module": "Unit IV", "num": 23, "title": "FIR Filter Design: Frequency Sampling & Optimal Equiripple", "subtopics": "Frequency sampling synthesis, Parks-McClellan Remez exchange algorithm formulation", "bloom": "L5_EVALUATE", "prereq": "22"}, {"module": "Unit IV", "num": 24, "title": "IIR Digital Filter Realization Structures", "subtopics": "Direct Form I, Direct Form II, Cascade, Parallel, and Transposed canonical forms", "bloom": "L4_ANALYZE", "prereq": "18"}, {"module": "Unit IV", "num": 25, "title": "FIR Digital Filter Realization & Lattice Structures", "subtopics": "Direct form FIR, Cascade FIR, Linear Phase FIR structures, Lattice/Ladder realizations", "bloom": "L4_ANALYZE", "prereq": "21"}, {"module": "Unit IV", "num": 26, "title": "Finite Wordlength Effects: Fixed-Point vs Floating-Point Formats", "subtopics": "Two's complement arithmetic, sign-magnitude, fixed-point scaling, dynamic range", "bloom": "L4_ANALYZE", "prereq": "24"}, {"module": "Unit IV", "num": 27, "title": "ADC Quantization Noise Analysis & SNR Degradation", "subtopics": "Uniform quantizer model, quantization noise variance sigma_e^2 = Delta^2 / 12, 6 dB/bit rule", "bloom": "L4_ANALYZE", "prereq": "26"}, {"module": "Unit IV", "num": 28, "title": "Coefficient Quantization & Pole-Zero Sensitivity", "subtopics": "Impact of finite precision on pole locations, high-order sensitivity and cascade mitigation", "bloom": "L4_ANALYZE", "prereq": "26"}, {"module": "Unit IV", "num": 29, "title": "Product Quantization, Roundoff Noise & Overflow Limit Cycles", "subtopics": "Roundoff noise model in IIR filters, zero-input limit cycles, overflow oscillations", "bloom": "L5_EVALUATE", "prereq": "28"}, {"module": "Unit V", "num": 30, "title": "Multirate Signal Processing: Decimation & Downsampling", "subtopics": "Sampling rate reduction, spectral aliasing, anti-aliasing decimation filter requirements", "bloom": "L4_ANALYZE", "prereq": "10"}, {"module": "Unit V", "num": 31, "title": "Multirate Signal Processing: Interpolation & Upsampling", "subtopics": "Sampling rate expansion, imaging artifacts, anti-imaging interpolation filter design", "bloom": "L4_ANALYZE", "prereq": "30"}, {"module": "Unit V", "num": 32, "title": "Polyphase Filter Decompositions & Efficient Sample Rate Converters", "subtopics": "Noble identities, polyphase decimators and interpolators, computational savings", "bloom": "L5_EVALUATE", "prereq": "31"}, {"module": "Unit V", "num": 33, "title": "Subband Coding & Quadrature Mirror Filter (QMF) Banks", "subtopics": "Two-channel QMF bank, alias-free condition, perfect reconstruction formulation", "bloom": "L5_EVALUATE", "prereq": "32"}, {"module": "Unit V", "num": 34, "title": "Adaptive Digital Filtering: LMS & RLS Algorithms", "subtopics": "Wiener filter theory, Least Mean Squares (LMS) stochastic gradient, echo cancellation", "bloom": "L5_EVALUATE", "prereq": "4"}, {"module": "Unit V", "num": 35, "title": "Spectral Estimation: Parametric & Non-Parametric Methods", "subtopics": "Periodogram, Welch's method, Autoregressive (AR) Yule-Walker model spectral estimation", "bloom": "L5_EVALUATE", "prereq": "10"}, {"module": "Unit V", "num": 36, "title": "Comprehensive DSP System Architecture Defense & Capstone Review", "subtopics": "End-to-end audio/radar streaming pipeline, FPGA realization, latency closure defense", "bloom": "L6_CREATE", "prereq": "34"}];
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
