// server/services/geminiGuidedLearningService.js
/**
 * Gemini-Grade Guided Learning Service (Learning Mode) for EE3621 (Digital Signal Processing)
 * Implements the Google Gemini Guided Learning / ChatGPT Study Mode pedagogical flow:
 *  1. Acknowledge student response competence (validate what the student got right, echoing their exact concepts)
 *  2. Re-articulate the student's response to nudge in the right direction (addressing multi-part questions directly)
 *  3. Provide clear teaching guidance, signal-chain/intuitive analogies & hints toward the correct answer (preventing Q&A mental fatigue)
 *  4. When a correct response is given: affirm mastery with a concrete numerical/conceptual bridge, provide a clear
 *     explanation of the NEXT subtopic, and follow with a single guided question on that next subtopic.
 *
 * Covers all 5 Units / 10 Core Topic Families / 36 Subtopics of EE3621:
 *  1. Discrete-Time Signals, Sampling & Quantization (SQNR) [L1-L3]
 *  2. LTI Systems, Convolution, Causality & BIBO Stability [L4-L6]
 *  3. Discrete-Time Fourier Transform (DTFT) & Frequency Response [L7-L8]
 *  4. Z-Transform, Region of Convergence (ROC) & Pole-Zero Analysis [L9-L12]
 *  5. DTFT vs DFT Frequency Sampling & Circular Convolution [L13-L15]
 *  6. Fast Fourier Transform (Radix-2 DIT & DIF FFT) [L16-L18]
 *  7. Digital Filter Structures (Direct Form I/II, Cascade, Parallel, Lattice) & Wordlength [L19-L24]
 *  8. Linear Phase FIR Filter Design & Windowing (Gibbs, Hamming, Kaiser) [L25-L27]
 *  9. IIR Filter Design (Butterworth, Chebyshev, Impulse Invariance, Bilinear Transform) [L28-L29]
 * 10. Multirate DSP & Adaptive LMS Filtering [L30-L36]
 */

const { v4: uuidv4 } = require('uuid');

const TOPIC_PROGRESSION_ORDER = [
    'signals_quantization',
    'lti_convolution',
    'dtft_frequency',
    'z_transform_roc',
    'dft_dtft_circular',
    'fft_radix2',
    'filter_structures_wordlength',
    'fir_windowing',
    'iir_bilinear',
    'multirate_adaptive'
];

const DSP_TOPICS_CATALOG = {
    signals_quantization: {
        key: 'signals_quantization',
        stepNumber: 1,
        defaultSubtopicId: 'ee3621_l1',
        matchRegex: /(adc|quantiz|sqnr|nyquist|sampling|aliasing|discrete-time signal|elementary sequence|sample and hold|ee3621_l[123]\b)/i,
        title: 'Sampling, Aliasing & ADC Quantization (SQNR)',
        concept_anchor: 'In an Analog-to-Digital Converter (ADC), a continuous signal $x(t)$ is first sampled in time at rate $f_s = 1/T_s$ (governed by the Nyquist criterion $f_s \\ge 2f_{\\max}$ to prevent frequency aliasing) and then quantized in amplitude into $2^B$ discrete levels with step size $\\Delta = X_{pp}/2^B$.',
        detailed_explanation: 'Converting a real-world continuous signal $x(t)$ into digital data requires two distinct operations along perpendicular axes:\n\n' +
            '1. **Discretizing Time (Sampling ⏱️)**: An analog **Anti-Aliasing Low-Pass Filter** first removes frequencies above $f_s/2$, and the sampler takes snapshots at $t = nT_s$. By the **Nyquist-Shannon Theorem**, sampling at $f_s \\ge 2f_{\\max}$ prevents high-frequency components from folding across $f_s/2$ and disguising themselves as lower frequencies (**aliasing** 🎭).\n' +
            '2. **Discretizing Amplitude (Quantization 🎚️)**: Once sampled in time, the quantizer rounds each continuous voltage to one of $2^B$ discrete binary codes separated by step size $\\Delta = X_{pp}/2^B$. Adding $1\\text{ bit}$ ($B \\to B+1$) doubles the number of levels and halves $\\Delta \\to \\Delta/2$, which drops quantization noise power $P_n = \\Delta^2/12$ by a factor of $4$ ($10\\log_{10}(4) \\approx +6.02\\text{ dB}$ per bit).\n\n' +
            '$$\\text{Analog Input } x(t) \\longrightarrow \\mathbf{\\text{Anti-Aliasing LPF}} \\longrightarrow \\mathbf{\\text{Sampler } (f_s)} \\longrightarrow \\mathbf{\\text{Quantizer } (2^B)} \\longrightarrow \\text{Digital } x[n]$$',
        competence_template: 'You are spot-on recognizing that adding $1\\text{ bit}$ doubles the number of discrete quantization levels ($2^{B+1} = 2 \\cdot 2^B$) and that the anti-aliasing filter is an essential front-end stage in the ADC pipeline.',
        rearticulation_template: 'Let us build directly on your two ideas:\n' +
            '1. **Does SQNR simply double with an extra bit? 🎚️** It actually quadruples in linear power! Doubling the levels cuts the step size $\\Delta = X_{pp}/2^B$ in half ($\\Delta/2$). Because average quantization noise power is proportional to the *square* of the step size ($P_n = \\Delta^2/12$), halving $\\Delta$ reduces noise power to $(\\Delta/2)^2/12 = \\frac{1}{4}P_n$—which quadruples the linear SQNR and adds $10\\log_{10}(4) \\approx +6.02\\text{ dB}$ per bit.\n' +
            '2. **Does the anti-aliasing filter eliminate quantization noise? 🛡️** Look at the signal chain: $\\text{Analog Input} \\to \\text{Anti-Aliasing LPF} \\to \\text{Sampler} \\to \\text{Quantizer}$. The analog LPF operates *upstream* on the **time/frequency axis** before sampling, so it cannot remove amplitude rounding noise created *downstream* inside the quantizer.',
        probe_question: 'How does adding $1$ extra bit to a $B$-bit uniform ADC affect the Signal-to-Quantization-Noise Ratio ($\\text{SQNR}$ in $\\text{dB}$) — for example, upgrading an $8\\text{-bit}$ ADC ($\\approx 49.9\\text{ dB}$) to $10\\text{-bit}$ — and why can an upstream anti-aliasing filter not eliminate amplitude quantization noise?',
        math_payload: 'f_s \\ge 2f_{\\max}, \\quad \\Delta = \\frac{X_{pp}}{2^B}, \\quad P_n = \\frac{\\Delta^2}{12}, \\quad \\text{SQNR}_{\\text{dB}} = 6.02B + 1.76\\text{ dB}',
        hints: [
            { tier: 1, label: 'Intuition Nudge', content: 'Each additional bit doubles the number of amplitude levels ($2^B$), halving the quantization step size $\\Delta$.' },
            { tier: 2, label: 'Mathematical Clue', content: 'Halving the step size reduces quantization noise power ($P_n = \\Delta^2 / 12$) by a factor of $4$, which corresponds to $10 \\log_{10}(4) \\approx 6.02\\text{ dB}$ per bit (so $+2\\text{ bits}$ adds $\\approx 12.04\\text{ dB}$).' },
            { tier: 3, label: 'Guided Walkthrough', content: 'Each extra bit improves SQNR by $6.02\\text{ dB}$. Sampling discretizes time (preventing aliasing via $f_s \\ge 2f_{\\max}$), whereas quantization discretizes amplitude downstream (irreversible nonlinear rounding).' }
        ],
        quick_hypotheses: [
            { id: 'h1', text: 'Each extra bit halves step size Δ and increases SQNR by 6.02 dB (+12.04 dB for 2 bits)', is_common_misconception: false },
            { id: 'h2', text: 'Increasing sampling rate f_s eliminates amplitude quantization error', is_common_misconception: true },
            { id: 'h3', text: 'Anti-aliasing LPF prevents frequency folding before sampling in time', is_common_misconception: false }
        ],
        interactive_tool_link: {
            title: 'Launch Sampling & Aliasing Visualizer',
            url: '/course_bootstrap/EE3621/interactive_portal/index.html#sampling'
        },
        synthesis_artifact: {
            title: 'Knowledge Cleared: Sampling & ADC Quantization',
            topic: 'Sampling Theorem, Aliasing & Quantization SQNR',
            summary: 'Sampling discretizes time with period $T_s$ (requiring $f_s \\ge 2f_{\\max}$ via an upstream anti-aliasing LPF to prevent spectral folding), while quantization discretizes amplitude into $2^B$ levels, halving $\\Delta$ per bit to cut noise power $P_n = \\Delta^2/12$ by $4\\times$ ($+6.02\\text{ dB}$ per bit; e.g., $8 \\to 10\\text{ bits}$ boosts SQNR by $+12.04\\text{ dB}$ from $49.9\\text{ dB}$ to $61.94\\text{ dB}$).',
            table: [
                { Dimension: 'Operation', Sampling: 'Discretizes Time ($t = nT_s$)', Quantization: 'Discretizes Amplitude ($2^B$ levels)' },
                { Dimension: 'Governing Law', Sampling: 'Nyquist: $f_s \\ge 2f_{\\max}$', Quantization: '$\\text{SQNR} = 6.02B + 1.76\\text{ dB}$' },
                { Dimension: 'Error Type', Sampling: 'Aliasing (Spectral Overlap)', Quantization: 'Granular Noise ($P_n = \\Delta^2/12$)' },
                { Dimension: 'Mitigation', Sampling: 'Upstream Anti-Aliasing LPF', Quantization: 'Higher Bit-Depth $B$ / Oversampling' }
            ],
            formulas: [
                'f_s \\ge 2f_{\\max} \\quad (\\text{Nyquist Rate})',
                'P_e = \\frac{\\Delta^2}{12}, \\quad \\text{SQNR}_{\\text{dB}} = 6.02B + 1.76\\text{ dB}'
            ]
        },
        masteryRegex: /(6\.02|halves.*step|step size|discretizes amplitude|2\^b|noise power|61\.94|12\.04)/i
    },

    lti_convolution: {
        key: 'lti_convolution',
        stepNumber: 2,
        defaultSubtopicId: 'ee3621_l4',
        matchRegex: /(lti|linear time-invariant|impulse response|linear convolution|bibo|causality|difference equation|ee3621_l[456]\b)/i,
        title: 'LTI Systems, Convolution, Causality & BIBO Stability',
        concept_anchor: 'A Linear Time-Invariant (LTI) discrete-time system is completely characterized by its unit impulse response $h[n]$, such that the output for any input $x[n]$ is given by the linear convolution sum $y[n] = x[n] * h[n]$.',
        detailed_explanation: 'Once our analog signal is digitized into $x[n]$, we process it using a **Linear Time-Invariant (LTI)** system. Think of an LTI system like an acoustic concert hall: if you clap once at $n=0$ (a unit impulse $\\delta[n]$) and record the echo pattern $h[n]$, you can predict the exact sound $y[n]$ for *any* musical performance $x[n]$ by summing scaled and delayed echoes via the **Convolution Sum**:\n\n' +
            '$$y[n] = x[n] * h[n] = \\sum_{k=-\\infty}^{\\infty} x[k]h[n-k]$$\n\n' +
            'Two physical laws govern real-time LTI filters:\n' +
            '1. **Causality (⏱️ No Future Peeking)**: The system cannot react before an input arrives, requiring $h[n] = 0$ for all $n < 0$.\n' +
            '2. **BIBO Stability (🛡️ Echoes Must Die Out)**: Every bounded input produces a bounded output if and only if the impulse response is absolutely summable ($\\sum_{n=-\\infty}^{\\infty} |h[n]| < \\infty$).',
        competence_template: 'Good thinking focusing on how the impulse response $h[n]$ governs the physical behavior of an LTI system over time.',
        rearticulation_template: 'Let us reframe your response to separate the two requirements clearly: **Causality** only checks negative time indices (requiring $h[n] = 0$ for $n < 0$ so the filter never uses future inputs), whereas **BIBO Stability** checks whether the impulse response energy dies out over all time ($\\sum_{n=-\\infty}^{\\infty} |h[n]| < \\infty$) so the output never blows up.',
        probe_question: 'What exact mathematical conditions on the impulse response $h[n]$ guarantee that an LTI system is both **Causal** and **BIBO (Bounded-Input Bounded-Output) Stable**, and why is a causal system like $h[n] = 2^n u[n]$ still unstable?',
        math_payload: 'y[n] = \\sum_{k=-\\infty}^{\\infty} x[k]h[n-k], \\quad \\text{Causal: } h[n]=0\\; (n<0), \\quad \\text{BIBO Stable: } \\sum_{n=-\\infty}^{\\infty} |h[n]| < \\infty',
        hints: [
            { tier: 1, label: 'Intuition Nudge', content: 'Causality means the system cannot respond before an impulse arrives at $n=0$; stability means its impulse response echoes must eventually die out.' },
            { tier: 2, label: 'Mathematical Clue', content: 'For causality, check $h[n]$ for negative indices $n < 0$. For BIBO stability, check if $h[n]$ is absolutely summable ($\\sum |h[n]| < \\infty$).' },
            { tier: 3, label: 'Guided Walkthrough', content: 'An LTI system is causal iff $h[n] = 0$ for all $n < 0$, and BIBO stable iff the absolute sum $\\sum_{n=-\\infty}^{\\infty} |h[n]| < \\infty$ is finite.' }
        ],
        quick_hypotheses: [
            { id: 'h1', text: 'Causal iff h[n] = 0 for n < 0, and BIBO stable iff ∑|h[n]| < ∞', is_common_misconception: false },
            { id: 'h2', text: 'Any causal LTI system is automatically BIBO stable', is_common_misconception: true },
            { id: 'h3', text: 'Finite-length FIR filters are always BIBO stable', is_common_misconception: false }
        ],
        interactive_tool_link: {
            title: 'Launch Discrete Convolution Simulator',
            url: '/course_bootstrap/EE3621/interactive_portal/index.html#convolution'
        },
        synthesis_artifact: {
            title: 'Knowledge Cleared: LTI Convolution, Causality & Stability',
            topic: 'LTI Impulse Response, Convolution Sum & BIBO Stability',
            summary: 'Every LTI system is uniquely defined by $h[n]$. Causality requires zero response for $n < 0$ ($h[n]=0$), while BIBO stability strictly requires absolute summability ($\\sum_{n=-\\infty}^{\\infty} |h[n]| < \\infty$).',
            table: [
                { Property: 'Convolution Sum', Condition: '$y[n] = \\sum_{k=-\\infty}^{\\infty} x[k]h[n-k]$', Interpretation: 'Superposition of scaled, shifted impulse responses' },
                { Property: 'Causality', Condition: '$h[n] = 0 \\text{ for all } n < 0$', Interpretation: 'Output depends only on present and past inputs' },
                { Property: 'BIBO Stability', Condition: '$\\sum_{n=-\\infty}^{\\infty} |h[n]| < \\infty$', Interpretation: 'Bounded input always yields bounded output' }
            ],
            formulas: [
                'y[n] = x[n] * h[n] = \\sum_{k=-\\infty}^{\\infty} x[k]h[n-k]',
                '\\sum_{n=-\\infty}^{\\infty} |h[n]| < \\infty \\iff \\text{BIBO Stable}'
            ]
        },
        masteryRegex: /(absolutely summable|sum.*\|h\[n\]\||h\[n\]\s*=\s*0.*n\s*<\s*0|causal.*bibo|finite-length fir)/i
    },

    dtft_frequency: {
        key: 'dtft_frequency',
        stepNumber: 3,
        defaultSubtopicId: 'ee3621_l7',
        matchRegex: /(dtft|frequency response|parseval|symmetry properties|wiener-khinchin|energy spectral|ee3621_l[78]\b)/i,
        title: 'Discrete-Time Fourier Transform (DTFT) & Frequency Response',
        concept_anchor: 'The Discrete-Time Fourier Transform (DTFT) maps an aperiodic discrete sequence $x[n]$ into a continuous, $2\\pi$-periodic function of normalized angular frequency $\\omega \\in [-\\pi, \\pi]$.',
        detailed_explanation: 'To analyze how an LTI filter shapes different frequencies, we take the **Discrete-Time Fourier Transform (DTFT)**: $X(e^{j\\omega}) = \\sum_{n=-\\infty}^{\\infty} x[n]e^{-j\\omega n}$. Because the time index $n$ only takes integer values, shifting the normalized frequency $\\omega$ by $2\\pi$ multiplies each term by $e^{-j2\\pi n} = 1$. Consequently, the DTFT spectrum $X(e^{j\\omega})$ is always **continuous and periodic with period $2\\pi$**, with low frequencies near even multiples of $\\pi$ ($0, 2\\pi$) and the highest discrete frequency (Nyquist) at odd multiples of $\\pi$ ($\\pm\\pi$).',
        competence_template: 'You are on the right track connecting the time-domain sequence $x[n]$ to the behavior of its frequency spectrum $X(e^{j\\omega})$.',
        rearticulation_template: 'Reframing your idea toward the exact mechanism: because $x[n]$ exists only at discrete integer instants $n$, adding $2\\pi$ to the angular frequency $\\omega$ changes the complex exponential by $e^{-j2\\pi n}$, which equals $1$ for every integer $n$.',
        probe_question: 'Why is the DTFT spectrum $X(e^{j\\omega})$ always periodic with period $2\\pi$, unlike the continuous-time Fourier transform?',
        math_payload: 'X(e^{j(\\omega + 2\\pi k)}) = \\sum_{n=-\\infty}^{\\infty} x[n] e^{-j(\\omega + 2\\pi k)n} = \\sum_{n=-\\infty}^{\\infty} x[n] e^{-j\\omega n} e^{-j2\\pi kn} = X(e^{j\\omega})',
        hints: [
            { tier: 1, label: 'Intuition Nudge', content: 'Notice that the time index $n$ in $x[n]$ only takes integer values.' },
            { tier: 2, label: 'Mathematical Clue', content: 'Evaluate $e^{-j(\\omega + 2\\pi)n}$ when $n$ is an integer: $e^{-j2\\pi n} = \\cos(2\\pi n) - j\\sin(2\\pi n) = 1$.' },
            { tier: 3, label: 'Guided Walkthrough', content: 'Discretization in the time domain (integer $n$) causes periodicity in the frequency domain with period $2\\pi$ because $e^{-j2\\pi kn} = 1$ for all integers $k$ and $n$.' }
        ],
        quick_hypotheses: [
            { id: 'h1', text: 'Because time index n is an integer, e^{-j2πn} = 1 makes X(e^{jω}) 2π-periodic', is_common_misconception: false },
            { id: 'h2', text: 'DTFT is aperiodic in frequency just like the analog Fourier transform', is_common_misconception: true },
            { id: 'h3', text: 'High frequencies in discrete time occur near ω = π (odd multiples of π)', is_common_misconception: false }
        ],
        interactive_tool_link: {
            title: 'Launch DTFT & Spectrum Explorer',
            url: '/course_bootstrap/EE3621/interactive_portal/index.html#fft'
        },
        synthesis_artifact: {
            title: 'Knowledge Cleared: DTFT & 2π Frequency Periodicity',
            topic: 'Discrete-Time Fourier Transform (DTFT) Properties',
            summary: 'Because discrete-time signals are defined only at integer indices $n$, complex exponentials separated by $2\\pi$ radians/sample are identical, making $X(e^{j\\omega})$ continuous and $2\\pi$-periodic.',
            table: [
                { Property: 'Analysis Equation', Expression: '$X(e^{j\\omega}) = \\sum_{n=-\\infty}^{\\infty} x[n]e^{-j\\omega n}$', Domain: 'Continuous, $2\\pi$-periodic in $\\omega$' },
                { Property: 'Synthesis Equation', Expression: '$x[n] = \\frac{1}{2\\pi}\\int_{-\\pi}^{\\pi} X(e^{j\\omega})e^{j\\omega n}d\\omega$', Domain: 'Discrete integer time $n$' },
                { Property: 'Parseval Theorem', Expression: '$\\sum_{n=-\\infty}^{\\infty}|x[n]|^2 = \\frac{1}{2\\pi}\\int_{-\\pi}^{\\pi}|X(e^{j\\omega})|^2 d\\omega$', Domain: 'Energy conservation' }
            ],
            formulas: [
                'X(e^{j\\omega}) = \\sum_{n=-\\infty}^{\\infty} x[n]e^{-j\\omega n}',
                '\\sum_{n=-\\infty}^{\\infty}|x[n]|^2 = \\frac{1}{2\\pi}\\int_{-\\pi}^{\\pi}|X(e^{j\\omega})|^2 d\\omega'
            ]
        },
        masteryRegex: /(2\\pi|2pi|integer.*n|e\^\{-j2\\?pi|periodic.*frequency|odd multiples)/i
    },

    z_transform_roc: {
        key: 'z_transform_roc',
        stepNumber: 4,
        defaultSubtopicId: 'ee3621_l9',
        matchRegex: /(z-transform|z transform|\broc\b|region of convergence|pole-zero|poles and zeros|unit circle|ee3621_l(9|10|11|12)\b)/i,
        title: 'Z-Transform, Region of Convergence (ROC) & Pole-Zero Stability',
        concept_anchor: 'The Z-Transform generalizes the DTFT to the entire complex plane $z = re^{j\\omega}$. However, the algebraic expression $X(z)$ is ambiguous without specifying its Region of Convergence (ROC)—the set of $z$ where $\\sum |x[n]z^{-n}| < \\infty$.',
        detailed_explanation: 'While the DTFT only exists for absolutely summable signals, the **Z-Transform** $X(z) = \\sum_{n=-\\infty}^{\\infty} x[n]z^{-n}$ extends analysis across the complex plane $z = re^{j\\omega}$. Two different sequences (such as a causal right-sided signal $a^n u[n]$ and an anti-causal left-sided signal $-a^n u[-n-1]$) can share the exact same algebraic fraction $X(z) = 1/(1 - az^{-1})$, differentiated only by their **Region of Convergence (ROC)**. Because $X(z)$ blows up to infinity at poles, the ROC can never contain poles. For a causal system ($\\text{ROC}: |z| > r_{\\max}$) to also be BIBO stable (ROC includes the unit circle $|z|=1$), all poles must lie strictly inside the unit circle ($|p_k| < 1$).',
        competence_template: 'Great intuition focusing on the relationship between the poles of $H(z)$, the Region of Convergence (ROC), and the unit circle $|z| = 1$.',
        rearticulation_template: 'To reframe your thought in the right direction: at any pole $p_k$, the denominator of $H(z)$ becomes zero and $|H(p_k)| \\to \\infty$, which means the power series diverges there. Instead of containing poles, the ROC is bounded by poles and must include the unit circle $|z| = 1$ for BIBO stability.',
        probe_question: 'Why can the Region of Convergence (ROC) never contain any poles, and how do you determine from the ROC and pole locations whether a causal LTI system is BIBO stable?',
        math_payload: 'X(z) = \\sum_{n=-\\infty}^{\\infty} x[n]z^{-n}, \\quad \\text{Causal + BIBO Stable} \\iff \\text{ROC: } |z| > r_{\\max} \\text{ includes } |z|=1 \\; (r_{\\max} < 1)',
        hints: [
            { tier: 1, label: 'Intuition Nudge', content: 'At a pole, $X(z)$ blows up to infinity, so the power series cannot converge there. For stability, where is the DTFT evaluated on the $z$-plane?' },
            { tier: 2, label: 'Mathematical Clue', content: 'The DTFT exists (and the system is BIBO stable) iff the ROC includes the unit circle $|z| = 1$. For a causal right-sided sequence, the ROC is outside the outermost pole: $|z| > r_{\\max}$.' },
            { tier: 3, label: 'Guided Walkthrough', content: 'Poles make $X(z) = \\infty$, violating convergence. A causal system has ROC $|z| > r_{\\max}$; for this ROC to include the unit circle $|z|=1$ (BIBO stability), all poles must lie strictly inside the unit circle ($|p_k| < 1$).' }
        ],
        quick_hypotheses: [
            { id: 'h1', text: 'ROC includes the unit circle |z|=1, and for a causal system all poles lie inside the unit circle (|p_k| < 1)', is_common_misconception: false },
            { id: 'h2', text: 'The ROC must contain all poles of X(z) for the system to be stable', is_common_misconception: true },
            { id: 'h3', text: 'Right-sided causal sequences have an ROC extending outward from the outermost pole', is_common_misconception: false }
        ],
        interactive_tool_link: {
            title: 'Launch Pole-Zero & Z-Plane Simulator',
            url: '/course_bootstrap/EE3621/interactive_portal/index.html#zplane'
        },
        synthesis_artifact: {
            title: 'Knowledge Cleared: Z-Transform & ROC Stability Laws',
            topic: 'Z-Transform, Region of Convergence (ROC) & Pole-Zero Geometry',
            summary: 'The algebraic expression $X(z)$ requires an ROC to uniquely identify $x[n]$. Because $X(z)$ diverges at poles, the ROC never contains poles. BIBO stability requires the ROC to contain the unit circle $|z|=1$; for causal systems, all poles must satisfy $|p_k| < 1$.',
            table: [
                { SequenceType: 'Causal (Right-Sided)', ROCGeometry: '$|z| > r_{\\max}$ (Outside outermost pole)', StabilityCondition: 'All poles strictly inside unit circle ($|p_k| < 1$)' },
                { SequenceType: 'Anti-Causal (Left-Sided)', ROCGeometry: '$|z| < r_{\\min}$ (Inside innermost pole)', StabilityCondition: 'All poles strictly outside unit circle ($|p_k| > 1$)' },
                { SequenceType: 'Two-Sided', ROCGeometry: 'Annular Ring $r_1 < |z| < r_2$', StabilityCondition: 'Ring contains the unit circle $|z| = 1$' }
            ],
            formulas: [
                'X(z) = \\sum_{n=-\\infty}^{\\infty} x[n]z^{-n}, \\quad H(z) = \\frac{Y(z)}{X(z)}',
                '\\text{Causal & BIBO Stable} \\iff |p_k| < 1 \\; \\forall k'
            ]
        },
        masteryRegex: /(unit circle|inside the unit circle|\|p_k\|\s*<\s*1|outermost pole|\|z\|\s*=\s*1)/i
    },

    dft_dtft_circular: {
        key: 'dft_dtft_circular',
        stepNumber: 5,
        defaultSubtopicId: 'ee3621_l13',
        matchRegex: /(dft|discrete fourier transform|circular convolution|zero padding|overlap-add|overlap-save|frequency sampling|ee3621_l(13|14|15)\b)/i,
        title: 'DTFT vs DFT Frequency Sampling & Circular Convolution',
        concept_anchor: 'In Digital Signal Processing, while the Discrete-Time Fourier Transform (DTFT) gives us a continuous spectrum $X(e^{j\\omega})$, physical computers cannot directly store or compute continuous functions.',
        detailed_explanation: 'Because digital processors have finite memory, we cannot store the continuous frequency variable $\\omega \\in [0, 2\\pi)$ of the DTFT. The **Discrete Fourier Transform (DFT)** solves this by sampling the continuous DTFT spectrum at $N$ equally spaced discrete frequency bins $\\omega_k = 2\\pi k / N$. However, sampling in frequency causes periodic repetition in time, so multiplying two $N$-point DFTs $Y[k] = X[k]H[k]$ computes **$N$-point Circular Convolution** rather than linear convolution. By **zero-padding** both sequences of lengths $L$ and $M$ to length $N \\ge L + M - 1$, circular wrap-around aliasing is prevented and circular convolution equals exact linear convolution.',
        competence_template: 'You are on the right track recognizing the connection between the DTFT spectrum and how digital computers process finite sequences.',
        rearticulation_template: 'Reframing your response to nudge it forward: while the DTFT is a continuous function of $\\omega$, digital memory can only store a finite array of numbers—so the DFT samples $\\omega$ at $N$ discrete bins ($\\omega_k = 2\\pi k/N$), and zero-padding to $N \\ge L + M - 1$ prevents time-domain circular wrap-around.',
        probe_question: 'What fundamental difference exists between the frequency domains of the DTFT and the Discrete Fourier Transform (DFT) that allows the DFT to run on digital hardware, and how do we prevent time-domain aliasing when multiplying two $N$-point DFTs?',
        math_payload: 'X[k] = X(e^{j\\omega})\\Big|_{\\omega = \\frac{2\\pi k}{N}} = \\sum_{n=0}^{N-1} x[n] e^{-j\\frac{2\\pi}{N} kn}, \\quad N \\ge L + M - 1',
        hints: [
            { tier: 1, label: 'Intuition Nudge', content: 'Think about what digital memory can store: continuous values or discrete numbers? And what happens in time when you sample in frequency?' },
            { tier: 2, label: 'Mathematical Clue', content: 'The DTFT frequency variable $\\omega$ is continuous, whereas the DFT samples it at $N$ discrete bins $\\omega_k = 2\\pi k/N$. Multiplying two $N$-point DFTs computes $N$-point circular convolution.' },
            { tier: 3, label: 'Guided Walkthrough', content: 'DTFT yields a continuous spectrum $X(e^{j\\omega})$, whereas DFT samples it into $N$ discrete bins. Zero-padding both sequences to length $N \\ge L + M - 1$ makes circular convolution identical to linear convolution.' }
        ],
        quick_hypotheses: [
            { id: 'h1', text: 'DTFT is continuous in frequency, while DFT samples it into N discrete bins ω_k = 2πk/N', is_common_misconception: false },
            { id: 'h2', text: 'DFT yields a continuous frequency spectrum', is_common_misconception: true },
            { id: 'h3', text: 'Zero-padding to N ≥ L + M - 1 prevents circular convolution wrap-around aliasing', is_common_misconception: false }
        ],
        interactive_tool_link: {
            title: 'Launch Discrete Fourier Spectrum Simulator',
            url: '/course_bootstrap/EE3621/interactive_portal/index.html#fft'
        },
        synthesis_artifact: {
            title: 'Knowledge Cleared: DTFT vs DFT Fundamentals',
            topic: 'Discrete-Time Fourier Transform (DTFT) vs Discrete Fourier Transform (DFT)',
            summary: 'The DTFT is a continuous, $2\\pi$-periodic frequency representation of $x[n]$. The DFT samples this continuous spectrum into $N$ discrete frequency bins ($\\Delta\\omega = 2\\pi/N$), and zero-padding to $N \\ge L+M-1$ enables alias-free linear filtering via circular convolution.',
            table: [
                { Dimension: 'Time Domain', DTFT: 'Discrete, Infinite duration $x[n]$', DFT: 'Discrete, Finite $N$-point sequence $x[n]$' },
                { Dimension: 'Frequency Domain', DTFT: 'Continuous $\\omega \\in [-\\pi, \\pi]$', DFT: 'Discrete $N$ frequency bins $\\omega_k = \\frac{2\\pi k}{N}$' },
                { Dimension: 'Convolution Property', DTFT: 'Linear Convolution $x[n] * h[n]$', DFT: 'Circular Convolution $x[n] \\circledast_N h[n]$' },
                { Dimension: 'Linear via DFT', DTFT: 'Direct theoretical product', DFT: 'Zero-pad to $N \\ge L + M - 1$' }
            ],
            formulas: [
                'X(e^{j\\omega}) = \\sum_{n=-\\infty}^{\\infty} x[n] e^{-j\\omega n}',
                'X[k] = \\sum_{n=0}^{N-1} x[n] e^{-j\\frac{2\\pi}{N} kn} = X(e^{j\\omega})\\Big|_{\\omega = \\frac{2\\pi k}{N}}'
            ]
        },
        masteryRegex: /(discrete.*bins|sampled.*frequency|continuous.*discrete|2\\?pi.*n|n\s*>=\s*l\s*\+\s*m\s*-\s*1|zero-pad)/i
    },

    fft_radix2: {
        key: 'fft_radix2',
        stepNumber: 6,
        defaultSubtopicId: 'ee3621_l16',
        matchRegex: /(fft|fast fourier transform|radix-2|radix-4|decimation in time|decimation in frequency|\bdit\b|\bdif\b|butterfly|twiddle|bit-reversal|ee3621_l(16|17|18)\b)/i,
        title: 'Radix-2 DIT & DIF Fast Fourier Transform (FFT)',
        concept_anchor: 'Direct computation of an $N$-point DFT requires $\\mathcal{O}(N^2)$ complex multiplications. The Cooley-Tukey Radix-2 FFT exploits the symmetry ($W_N^{k+N/2} = -W_N^k$) and periodicity of twiddle factors $W_N = e^{-j2\\pi/N}$ via a divide-and-conquer decomposition.',
        detailed_explanation: 'Computing an $N$-point DFT directly takes $N^2$ complex multiplications, which becomes a bottleneck for real-time spectrum analysis. The **Cooley-Tukey Radix-2 FFT** recursively splits an $N$-point DFT into two $(N/2)$-point DFTs (even and odd indices in Decimation-in-Time), using the half-cycle symmetry $W_N^{k+N/2} = -W_N^k$. Because $N = 2^v$ can be halved $\\log_2 N$ times, the computation forms $\\log_2 N$ stages of $N/2$ butterflies each—slashing total complex multiplications from $N^2$ down to $(N/2)\\log_2 N$ while using bit-reversed addressing.',
        competence_template: 'Good insight focusing on how the Radix-2 FFT decomposes the $N$-point DFT into smaller stages.',
        rearticulation_template: 'To reframe your thought toward the exact formula: each halving step creates one butterfly stage, so for $N = 2^v$ there are $\\log_2 N$ stages, with $N/2$ butterflies per stage—producing exact DFT values (zero approximation error) in $(N/2)\\log_2 N$ complex multiplications.',
        probe_question: 'How many stages and total complex multiplications does a Radix-2 FFT require for $N = 2^v$ points compared to direct DFT, and why is bit-reversal addressing needed?',
        math_payload: 'X[k] = G[k] + W_N^k H[k], \\quad X[k + N/2] = G[k] - W_N^k H[k], \\quad C_{\\text{mult}} = \\frac{N}{2}\\log_2 N',
        hints: [
            { tier: 1, label: 'Intuition Nudge', content: 'Splitting an $N$-point sequence in half repeatedly until reaching $2$-point DFTs takes $\\log_2 N$ stages.' },
            { tier: 2, label: 'Mathematical Clue', content: 'Each of the $\\log_2 N$ stages has $N/2$ butterfly units, and each butterfly requires $1$ complex multiplication by $W_N^r$.' },
            { tier: 3, label: 'Guided Walkthrough', content: 'A Radix-2 FFT has $\\log_2 N$ stages and requires $(N/2)\\log_2 N$ complex multiplications instead of $N^2$. Successive even/odd decimation sorts indices by their least-significant bits first, resulting in bit-reversed order.' }
        ],
        quick_hypotheses: [
            { id: 'h1', text: 'Radix-2 FFT uses log2N stages and (N/2)log2N complex multiplications with bit-reversed indexing', is_common_misconception: false },
            { id: 'h2', text: 'The FFT is an approximation that produces different spectral values than the DFT', is_common_misconception: true },
            { id: 'h3', text: 'For N=1024, FFT reduces complex multiplications from 1,048,576 to 5,120 (~205x speedup)', is_common_misconception: false }
        ],
        interactive_tool_link: {
            title: 'Launch FFT Butterfly & Spectrum Analyzer',
            url: '/course_bootstrap/EE3621/interactive_portal/index.html#fft'
        },
        synthesis_artifact: {
            title: 'Knowledge Cleared: Radix-2 DIT/DIF FFT Architecture',
            topic: 'Cooley-Tukey Radix-2 Fast Fourier Transform (DIT & DIF)',
            summary: 'The FFT computes the exact same mathematical result as the DFT while reducing computational complexity from $\\mathcal{O}(N^2)$ to $(N/2)\\log_2 N$ complex multiplications across $\\log_2 N$ butterfly stages.',
            table: [
                { Metric: 'Complex Multiplications', DirectDFT: '$N^2$', Radix2FFT: '$(N/2)\\log_2 N$' },
                { Metric: 'Complex Additions', DirectDFT: '$N(N-1)$', Radix2FFT: '$N\\log_2 N$' },
                { Metric: 'DIT Ordering', DirectDFT: 'Natural Input/Output', Radix2FFT: 'Bit-Reversed Input $\\to$ Natural Output' },
                { Metric: 'DIF Ordering', DirectDFT: 'Natural Input/Output', Radix2FFT: 'Natural Input $\\to$ Bit-Reversed Output' }
            ],
            formulas: [
                'W_N = e^{-j\\frac{2\\pi}{N}}, \\quad W_N^{k+N/2} = -W_N^k',
                '\\text{Complex Multiplications} = \\frac{N}{2}\\log_2 N, \\quad \\text{Complex Additions} = N\\log_2 N'
            ]
        },
        masteryRegex: /(log_?2|log2|n\/2.*log|5,?120|205|bit-revers|stages)/i
    },

    filter_structures_wordlength: {
        key: 'filter_structures_wordlength',
        stepNumber: 7,
        defaultSubtopicId: 'ee3621_l19',
        matchRegex: /(direct form|cascade form|parallel form|lattice|filter structure|finite wordlength|limit cycle|coefficient quantization|ee3621_l(19|20|21|22|23|24)\b)/i,
        title: 'Digital Filter Realization Structures & Finite Wordlength Effects',
        concept_anchor: 'A transfer function $H(z)$ can be realized in hardware using Direct Form I, Direct Form II (Canonical), Cascade of second-order sections (biquads), Parallel form, or Lattice structures.',
        detailed_explanation: 'When implementing a digital filter $H(z) = B(z)/A(z)$ in hardware, **Direct Form I** uses separate delay lines for input $x[n]$ and output $y[n]$ (requiring $N+M$ registers). By commuting the all-pole feedback section before the all-zero section, **Direct Form II (Canonical)** merges both delay lines into just $\\max(N,M)$ registers. However, in finite-wordlength processors, high-order single-stage polynomials are extremely sensitive to coefficient rounding (Wilkinson sensitivity), which can push poles outside the unit circle—so engineers factor $H(z)$ into a **Cascade of Second-Order Sections (Biquads)**.',
        competence_template: 'Good observation looking at how delay registers and filter coefficients behave in digital hardware realizations.',
        rearticulation_template: 'Reframing your idea: Direct Form II saves memory by sharing a single canonical delay line between the feedback and feedforward paths, while Cascade Biquad (SOS) structures protect high-order IIR filters from pole movement caused by finite-wordlength coefficient rounding.',
        probe_question: 'Why does Direct Form II require half as many delay registers as Direct Form I, and why do practical high-order IIR filters prefer a Cascade of second-order sections over a single Direct Form II structure?',
        math_payload: 'H(z) = \\prod_{k=1}^{K} \\frac{b_{0k} + b_{1k}z^{-1} + b_{2k}z^{-2}}{1 + a_{1k}z^{-1} + a_{2k}z^{-2}}',
        hints: [
            { tier: 1, label: 'Intuition Nudge', content: 'Since LTI systems commute, you can swap the all-pole feedback section and the all-zero feedforward section to share their delay line.' },
            { tier: 2, label: 'Mathematical Clue', content: 'In high-order polynomials, tiny rounding errors in coefficients $a_k$ cause massive shifts in pole locations (Wilkinson sensitivity), potentially pushing poles outside the unit circle.' },
            { tier: 3, label: 'Guided Walkthrough', content: 'Direct Form II merges the input and output delay lines into $\\max(N,M)$ canonical delays. However, cascading 2nd-order biquad sections isolates pole-pair sensitivity to coefficient quantization and prevents internal node overflow.' }
        ],
        quick_hypotheses: [
            { id: 'h1', text: 'Direct Form II shares delay registers (canonical), while Cascade biquads minimize pole sensitivity to coefficient quantization', is_common_misconception: false },
            { id: 'h2', text: 'High-order Direct Form IIR filters are immune to coefficient rounding instability', is_common_misconception: true },
            { id: 'h3', text: 'Lattice structures guarantee stability when all reflection coefficients satisfy |K_m| < 1', is_common_misconception: false }
        ],
        interactive_tool_link: {
            title: 'Launch Digital Filter Structure Lab',
            url: '/course_bootstrap/EE3621/interactive_portal/index.html#filters'
        },
        synthesis_artifact: {
            title: 'Knowledge Cleared: Filter Structures & Finite Wordlength',
            topic: 'Direct Form I/II, Cascade, Parallel, Lattice & Wordlength Effects',
            summary: 'Direct Form II is canonical (minimum delay registers), but high-order IIR filters are implemented as cascaded second-order sections (SOS) or Lattice structures ($|K_m| < 1$) to prevent coefficient quantization from destabilizing poles.',
            table: [
                { Structure: 'Direct Form I', DelayElements: '$N + M$ (Non-canonical)', WordlengthSensitivity: 'High pole sensitivity for high order, no internal overflow' },
                { Structure: 'Direct Form II', DelayElements: '$\\max(N, M)$ (Canonical)', WordlengthSensitivity: 'High pole sensitivity & internal node overflow risk' },
                { Structure: 'Cascade (SOS)', DelayElements: 'Canonical per biquad', WordlengthSensitivity: 'Low sensitivity; easy pole stability control' },
                { Structure: 'Lattice', DelayElements: '$N$ stages', WordlengthSensitivity: 'Guaranteed stable iff $|K_m| < 1$' }
            ],
            formulas: [
                'w[n] = x[n] - \\sum_{k=1}^{N} a_k w[n-k], \\quad y[n] = \\sum_{k=0}^{M} b_k w[n-k]',
                '\\text{Lattice Stability: } |K_m| < 1 \\quad \\forall m'
            ]
        },
        masteryRegex: /(canonical|shares? delay|biquad|cascade|sensitivity|quantization|\|k_m\|\s*<\s*1)/i
    },

    fir_windowing: {
        key: 'fir_windowing',
        stepNumber: 8,
        defaultSubtopicId: 'ee3621_l25',
        matchRegex: /(linear phase|fir filter|windowing|hamming|hanning|blackman|kaiser|bartlett|gibbs|frequency sampling|ee3621_l(25|26|27)\b)/i,
        title: 'Linear Phase FIR Filters & Window Design (Gibbs Phenomenon)',
        concept_anchor: 'Finite Impulse Response (FIR) filters can achieve exact Linear Phase (constant group delay $\\tau_g = (N-1)/2$, zero phase distortion) and are unconditionally BIBO stable.',
        detailed_explanation: 'An $N$-tap **Finite Impulse Response (FIR)** filter achieves exact **Linear Phase** whenever its impulse response is symmetric or antisymmetric: $h[n] = \\pm h[N-1-n]$, delaying all frequencies by an identical group delay $\\tau_g = (N-1)/2$ samples without waveform distortion. To design an FIR filter from an infinite ideal sinc response $h_d[n]$, we multiply by a finite window $w[n]$. Abruptly truncating with a Rectangular window produces a $-13\\text{ dB}$ Dirichlet sidelobe ($\\approx 9\\%$ **Gibbs overshoot**) regardless of $N$; smoothly tapering the edges with a **Hamming ($-43\\text{ dB}$ sidelobe)** or **Kaiser window** suppresses Gibbs ripples at the cost of a slightly wider transition band.',
        competence_template: 'You are on the right track connecting FIR impulse response symmetry and window length $N$ to the filter frequency response.',
        rearticulation_template: 'Reframing your idea: increasing $N$ in a Rectangular window narrows the main lobe (steepening the transition band), but the $-13\\text{ dB}$ sidelobe height stays constant—so we use smooth tapered windows like Hamming or Kaiser to suppress sidelobes and eliminate Gibbs ripples.',
        probe_question: 'What symmetry condition on $h[n]$ guarantees exact linear phase in an FIR filter, and why does increasing the length $N$ of a Rectangular window NOT reduce the $\\approx 9\\%$ Gibbs overshoot peak (requiring Hamming or Kaiser windows instead)?',
        math_payload: 'h[n] = \\pm h[N-1-n], \\quad \\tau_g = \\frac{N-1}{2}, \\quad h[n] = h_d[n] \\cdot w[n]',
        hints: [
            { tier: 1, label: 'Intuition Nudge', content: 'Truncating an infinite sinc impulse response $h_d[n]$ in time corresponds to convolving the ideal brick-wall spectrum with the Dirichlet kernel $W(e^{j\\omega})$ in frequency.' },
            { tier: 2, label: 'Mathematical Clue', content: 'Increasing $N$ makes the main lobe narrower (sharper transition band $\\Delta\\omega \\propto 1/N$), but the peak sidelobe level of a rectangular window stays fixed at $-13\\text{ dB}$.' },
            { tier: 3, label: 'Guided Walkthrough', content: 'Linear phase requires symmetric or antisymmetric $h[n] = \\pm h[N-1-n]$. Rectangular truncation leaves a $-13\\text{ dB}$ sidelobe causing $\\approx 9\\%$ Gibbs ripples; tapered windows (Hamming $-43\\text{ dB}$, Blackman $-58\\text{ dB}$, Kaiser) suppress sidelobes at the expense of a wider main lobe.' }
        ],
        quick_hypotheses: [
            { id: 'h1', text: 'Linear phase requires h[n] = ±h[N-1-n]; tapered windows (Hamming/Kaiser) suppress sidelobes to eliminate Gibbs ripples', is_common_misconception: false },
            { id: 'h2', text: 'Making a Rectangular window longer eliminates the 9% Gibbs overshoot ripple', is_common_misconception: true },
            { id: 'h3', text: 'Group delay of an N-tap linear-phase FIR filter is constant at (N-1)/2 samples', is_common_misconception: false }
        ],
        interactive_tool_link: {
            title: 'Launch FIR Window & Filter Designer',
            url: '/course_bootstrap/EE3621/interactive_portal/index.html#filters'
        },
        synthesis_artifact: {
            title: 'Knowledge Cleared: Linear Phase FIR & Window Design',
            topic: 'Linear Phase Symmetry, Gibbs Phenomenon & Window Tradeoffs',
            summary: 'Exact linear phase requires $h[n] = \\pm h[N-1-n]$, giving constant group delay $(N-1)/2$. Tapered windows trade a slightly wider transition band for dramatic sidelobe suppression ($-43\\text{ dB}$ for Hamming vs $-13\\text{ dB}$ for Rectangular).',
            table: [
                { Window: 'Rectangular', MainLobeWidth: '$4\\pi / N$', PeakSidelobe: '$-13\\text{ dB}$', StopbandAttenuation: '$-21\\text{ dB}$ (Strong Gibbs ripple)' },
                { Window: 'Hann / Hamming', MainLobeWidth: '$8\\pi / N$', PeakSidelobe: '$-31\\text{ dB} / -43\\text{ dB}$', StopbandAttenuation: '$-44\\text{ dB} / -53\\text{ dB}$' },
                { Window: 'Blackman', MainLobeWidth: '$12\\pi / N$', PeakSidelobe: '$-58\\text{ dB}$', StopbandAttenuation: '$-74\\text{ dB}$' },
                { Window: 'Kaiser ($\\beta$)', MainLobeWidth: 'Adjustable via $\\beta$', PeakSidelobe: 'Adjustable', StopbandAttenuation: 'Optimal tunable tradeoff' }
            ],
            formulas: [
                'h[n] = \\pm h[N-1-n] \\implies \\tau_g(\\omega) = -\\frac{d\\theta(\\omega)}{d\\omega} = \\frac{N-1}{2}',
                'w_{\\text{Hamming}}[n] = 0.54 - 0.46\\cos\\left(\\frac{2\\pi n}{N-1}\\right)'
            ]
        },
        masteryRegex: /(h\[n-1-n\]|symmetr|sidelobe|hamming|kaiser|n-1\)\/2|tapered)/i
    },

    iir_bilinear: {
        key: 'iir_bilinear',
        stepNumber: 9,
        defaultSubtopicId: 'ee3621_l28',
        matchRegex: /(iir|bilinear|impulse invariance|butterworth|chebyshev|frequency warping|pre-warping|analog prototype|ee3621_l(28|29)\b)/i,
        title: 'IIR Filter Design: Impulse Invariance vs Bilinear Transformation',
        concept_anchor: 'Infinite Impulse Response (IIR) digital filters are designed from analog Butterworth or Chebyshev prototypes $H_a(s)$ by mapping the left-half $s$-plane ($\\text{Re}(s) < 0$) into the interior of the $z$-plane unit circle ($|z| < 1$).',
        detailed_explanation: 'To achieve sharp frequency cutoffs with far fewer multipliers than FIR filters, **IIR Digital Filters** transform classic analog prototypes (Butterworth, Chebyshev) from the $s$-plane to the $z$-plane. **Impulse Invariance** samples the analog impulse response ($h[n] = T_s h_a(nT_s)$), which maps horizontal $s$-plane strips many-to-one onto the unit circle—causing severe aliasing unless $H_a(j\\Omega)$ is strictly bandlimited (so it fails for High-Pass and Band-Stop filters). The **Bilinear Transformation** $s = \\frac{2}{T_s}\\frac{1-z^{-1}}{1+z^{-1}}$ maps the entire $j\\Omega$ axis one-to-one onto the unit circle with **zero aliasing**, introducing a tangent frequency compression that we compensate via **pre-warping**: $\\Omega = \\frac{2}{T_s}\\tan(\\omega/2)$.',
        competence_template: 'Good thinking focusing on how analog $s$-plane poles and frequency responses map onto the digital $z$-plane unit circle.',
        rearticulation_template: 'Reframing your response: Impulse Invariance aliases high-pass filters because time-sampling folds high-frequency analog energy back into the base band, whereas the Bilinear Transformation uses the algebraic one-to-one substitution $s = \\frac{2}{T_s}\\frac{1-z^{-1}}{1+z^{-1}}$ with tangent pre-warping $\\Omega = \\frac{2}{T_s}\\tan(\\omega/2)$ to eliminate aliasing completely.',
        probe_question: 'Why is Impulse Invariance unsuitable for high-pass or band-stop filters, and how does the Bilinear Transformation avoid aliasing while introducing nonlinear frequency warping?',
        math_payload: 's = \\frac{2}{T_s}\\left(\\frac{1 - z^{-1}}{1 + z^{-1}}\\right), \\quad \\Omega = \\frac{2}{T_s}\\tan\\left(\\frac{\\omega}{2}\\right)',
        hints: [
            { tier: 1, label: 'Intuition Nudge', content: 'Impulse Invariance samples $h_a(t)$ in time, causing periodic spectral replicas that overlap if $H_a(j\\Omega)$ is not strictly bandlimited.' },
            { tier: 2, label: 'Mathematical Clue', content: 'Bilinear Transformation is a one-to-one algebraic mapping that compresses the entire infinite imaginary axis $\\Omega \\in (-\\infty, \\infty)$ onto the unit circle $\\omega \\in (-\\pi, \\pi)$.' },
            { tier: 3, label: 'Guided Walkthrough', content: 'Impulse Invariance suffers from frequency aliasing on HPF/BSF because their analog responses do not decay at high frequencies. Bilinear Transformation eliminates aliasing via one-to-one mapping, requiring pre-warping $\\Omega_c = (2/T_s)\\tan(\\omega_c/2)$ to place cutoff frequencies accurately.' }
        ],
        quick_hypotheses: [
            { id: 'h1', text: 'Bilinear Transform maps the entire jΩ axis one-to-one onto [-π, π] without aliasing, requiring pre-warping Ω = (2/T)tan(ω/2)', is_common_misconception: false },
            { id: 'h2', text: 'Impulse Invariance can design alias-free high-pass filters', is_common_misconception: true },
            { id: 'h3', text: 'Left-half s-plane poles (Re(s) < 0) always map inside the unit circle (|z| < 1)', is_common_misconception: false }
        ],
        interactive_tool_link: {
            title: 'Launch IIR Bilinear & Pole-Zero Designer',
            url: '/course_bootstrap/EE3621/interactive_portal/index.html#filters'
        },
        synthesis_artifact: {
            title: 'Knowledge Cleared: IIR Filter Design & Bilinear Warping',
            topic: 'Butterworth/Chebyshev Prototypes, Impulse Invariance & Bilinear Transformation',
            summary: 'Bilinear Transformation maps the entire left-half $s$-plane into $|z| < 1$ one-to-one, completely eliminating aliasing so LPF, HPF, BPF, and BSF can all be designed accurately with cutoff pre-warping.',
            table: [
                { Feature: 'Mapping Formula', ImpulseInvariance: '$h[n] = T_s h_a(nT_s), \\; s_k \\to e^{s_k T_s}$', BilinearTransform: '$s = \\frac{2}{T_s}\\frac{1-z^{-1}}{1+z^{-1}}$' },
                { Feature: 'Frequency Relationship', ImpulseInvariance: 'Linear ($\\omega = \\Omega T_s$) with Aliasing', BilinearTransform: 'Nonlinear Warping: $\\Omega = \\frac{2}{T_s}\\tan(\\omega/2)$' },
                { Feature: 'Aliasing', ImpulseInvariance: 'Yes (Many-to-one mapping)', BilinearTransform: 'None (One-to-one conformal mapping)' },
                { Feature: 'Supported Filter Types', ImpulseInvariance: 'LPF and BPF only', BilinearTransform: 'All (LPF, HPF, BPF, BSF)' }
            ],
            formulas: [
                's = \\frac{2}{T_s}\\left(\\frac{1 - z^{-1}}{1 + z^{-1}}\\right)',
                '\\Omega_{\\text{prewarp}} = \\frac{2}{T_s}\\tan\\left(\\frac{\\omega_d}{2}\\right)'
            ]
        },
        masteryRegex: /(one-to-one|pre-?warp|tan\(\\?omega|no aliasing|eliminates aliasing|inside.*unit circle)/i
    },

    multirate_adaptive: {
        key: 'multirate_adaptive',
        stepNumber: 10,
        defaultSubtopicId: 'ee3621_l30',
        matchRegex: /(multirate|decimat|interpolat|polyphase|noble|adaptive|lms|wiener|equalization|noise cancellation|ee3621_l(3[0-6])\b)/i,
        title: 'Multirate DSP (Decimation/Interpolation) & Adaptive LMS Filters',
        concept_anchor: 'Multirate systems change the sampling rate via $M$-fold decimation (downsampling preceded by anti-aliasing LPF) or $L$-fold interpolation (upsampling followed by anti-imaging LPF), while Adaptive LMS filters iteratively update weights $\\mathbf{w}[n]$ in real time.',
        detailed_explanation: 'Modern communication and audio systems rely on **Multirate DSP** and **Adaptive Filtering**. In $M$-fold decimation, an anti-aliasing LPF with cutoff $\\omega_c = \\pi/M$ precedes the downsampler, and **Polyphase Decomposition** moves filtering to the low rate (saving $M$-fold computations). Meanwhile, when noise or channel statistics vary over time, an **LMS (Least Mean Squares) Adaptive Filter** updates its tap weights each sample via $\\mathbf{w}[n+1] = \\mathbf{w}[n] + \\mu e[n]\\mathbf{x}[n]$. The step size $\\mu$ must satisfy $0 < \\mu < 2/\\lambda_{\\max}$ for stability: a larger $\\mu$ converges faster but suffers higher steady-state misadjustment noise.',
        competence_template: 'Spot-on focus on how the LMS step size $\\mu$ governs the adaptive weight update.',
        rearticulation_template: 'To reframe your thought: moving down the Mean-Square Error surface requires $0 < \\mu < 2/\\lambda_{\\max}$ so the gradient step does not overshoot and diverge, creating a fundamental engineering trade-off between fast tracking (larger $\\mu$) and low steady-state excess error (smaller $\\mu$).',
        probe_question: 'In an LMS adaptive filter $\\mathbf{w}[n+1] = \\mathbf{w}[n] + \\mu e[n]\\mathbf{x}[n]$, how does the step size $\\mu$ govern the trade-off between convergence speed, stability, and steady-state misadjustment?',
        math_payload: '\\mathbf{w}[n+1] = \\mathbf{w}[n] + \\mu e[n]\\mathbf{x}[n], \\quad 0 < \\mu < \\frac{2}{\\lambda_{\\max}}',
        hints: [
            { tier: 1, label: 'Intuition Nudge', content: 'Think of gradient descent on a quadratic Mean-Square Error bowl: what happens if your step size $\\mu$ is too small versus too large?' },
            { tier: 2, label: 'Mathematical Clue', content: 'Stability requires $0 < \\mu < 2/\\lambda_{\\max}$, where $\\lambda_{\\max}$ is the largest eigenvalue of the input autocorrelation matrix $\\mathbf{R}_x$.' },
            { tier: 3, label: 'Guided Walkthrough', content: 'A larger $\\mu$ (within $0 < \\mu < 2/\\lambda_{\\max}$) speeds up convergence and tracking but increases steady-state excess MSE (misadjustment). A smaller $\\mu$ converges slowly but achieves lower steady-state error.' }
        ],
        quick_hypotheses: [
            { id: 'h1', text: 'Stability requires 0 < μ < 2/λ_max; larger μ gives faster convergence but higher steady-state misadjustment', is_common_misconception: false },
            { id: 'h2', text: 'Increasing step size μ arbitrarily always improves LMS filter accuracy', is_common_misconception: true },
            { id: 'h3', text: 'Polyphase decomposition moves filtering to the lower sampling rate, saving M-fold computations', is_common_misconception: false }
        ],
        interactive_tool_link: {
            title: 'Launch Interactive DSP Lab Portal',
            url: '/course_bootstrap/EE3621/interactive_portal/index.html'
        },
        synthesis_artifact: {
            title: 'Knowledge Cleared: Multirate & Adaptive LMS Signal Processing',
            topic: 'Decimation, Interpolation, Polyphase & LMS Adaptive Filtering',
            summary: 'Multirate polyphase structures reduce computational load by operating at the lowest rate, while LMS adaptive filters track non-stationary signals using stochastic gradient updates bounded by $0 < \\mu < 2/\\lambda_{\\max}$.',
            table: [
                { Concept: 'Decimation ($\\downarrow M$)', Operation: 'Anti-aliasing LPF ($\\omega_c = \\pi/M$) $\\to$ Downsample', SpectrumEffect: 'Stretches spectrum by $M$' },
                { Concept: 'Interpolation ($\\uparrow L$)', Operation: 'Upsample $\\to$ Anti-imaging LPF ($\\omega_c = \\pi/L$)', SpectrumEffect: 'Compresses spectrum by $L$' },
                { Concept: 'LMS Update', Operation: '$\\mathbf{w}[n+1] = \\mathbf{w}[n] + \\mu e[n]\\mathbf{x}[n]$', SpectrumEffect: 'Converges if $0 < \\mu < 2/\\lambda_{\\max}$' }
            ],
            formulas: [
                'e[n] = d[n] - \\mathbf{w}^T[n]\\mathbf{x}[n], \\quad \\mathbf{w}[n+1] = \\mathbf{w}[n] + \\mu e[n]\\mathbf{x}[n]',
                '0 < \\mu < \\frac{2}{\\lambda_{\\max}} < \\frac{2}{N P_x}'
            ]
        },
        masteryRegex: /(lambda_max|λ|2\/λ|misadjustment|convergence.*stability|polyphase)/i
    }
};

// Comprehensive DSP Misconceptions Catalog across all EE3621 units
const DSP_MISCONCEPTIONS = [
    {
        pattern: /(dft|discrete fourier transform).*?(continuous frequency|continuous spectrum|yields a continuous|is continuous in frequency|frequency is continuous)/i,
        topicKey: 'dft_dtft_circular',
        competence_acknowledgement: 'You are right that Fourier transforms map a time-domain signal into its frequency spectrum.',
        rearticulated_nudge: 'Let us reframe your statement about continuous frequency: while the theoretical DTFT has a continuous frequency variable $\\omega$, a digital computer has finite memory registers and can only compute and store discrete frequency bins.',
        concept_anchor: 'Recall that digital computers have finite registers and can only store discrete numbers. If the frequency spectrum were continuous, a computer would require infinite memory to store every single point between $0$ and $2\\pi$.',
        counter_example: 'If DTFT has continuous frequency $\\omega$, how many bits of memory would you need to store every point between $0$ and $2\\pi$? Digital hardware strictly requires discrete values—so the DFT samples $\\omega$ at $N$ equally spaced bins $\\omega_k = 2\\pi k/N$!',
        probe_question: 'What mathematical sampling operation does the DFT perform on the continuous DTFT spectrum so that digital hardware can compute and store it?',
        math_payload: 'X[k] = X(e^{j\\omega})\\Big|_{\\omega = \\frac{2\\pi k}{N}} = \\sum_{n=0}^{N-1} x[n] e^{-j\\frac{2\\pi}{N} kn}'
    },
    {
        pattern: /(dtft|discrete-time fourier transform).*?(processed by a digital computer|run on a computer|computed directly by computer|stored in digital memory|aperiodic in frequency)/i,
        topicKey: 'dft_dtft_circular',
        competence_acknowledgement: 'Good thinking focusing on how discrete-time sequences $x[n]$ are transformed into the frequency domain.',
        rearticulated_nudge: 'To nudge your thought in the right direction: even though the input $x[n]$ is discrete in time, the DTFT evaluates $X(e^{j\\omega})$ over a continuous real frequency variable $\\omega \\in [-\\pi, \\pi]$, which must be sampled into $N$ discrete bins before a computer can store it.',
        concept_anchor: 'The DTFT is a continuous, $2\\pi$-periodic function of $\\omega \\in [-\\pi, \\pi]$. Because $\\omega$ is a continuous real variable, it cannot be stored directly in finite digital memory.',
        counter_example: 'The interval $[-\\pi, \\pi]$ contains uncountably infinite frequencies. Only after sampling $\\omega$ at $N$ discrete points ($\\omega_k = 2\\pi k/N$) do we get the computable DFT!',
        probe_question: 'How do we discretize the continuous frequency variable $\\omega$ to transition from the theoretical DTFT to the computable DFT?',
        math_payload: '\\omega_k = \\frac{2\\pi k}{N}, \\quad k \\in \\{0, 1, \\dots, N-1\\}'
    },
    {
        pattern: /(dft|discrete fourier transform).*?(continuous in time|continuous-time input)/i,
        topicKey: 'dft_dtft_circular',
        competence_acknowledgement: 'You are right that real-world physical signals start out continuous in time before entering a DSP system.',
        rearticulated_nudge: 'Reframing your idea: before the DFT is ever computed, the ADC has already sampled the signal into a finite discrete sequence $x[n]$ of length $N$—so both the time input $x[n]$ and frequency output $X[k]$ of the DFT are strictly discrete.',
        concept_anchor: 'The DFT operates exclusively on discrete-time sequences $x[n]$ of finite length $N$. It never operates in continuous time.',
        counter_example: 'Continuous-time signals $x(t)$ require the continuous Fourier Transform. The DFT requires digitized samples $x[n] = x(nT_s)$.',
        probe_question: 'Both the input and output of the DFT are discrete. What are the discrete indices used for time and frequency?',
        math_payload: 'n \\in \\{0, 1, \\dots, N-1\\} \\; (\\text{time}) \\quad \\longleftrightarrow \\quad k \\in \\{0, 1, \\dots, N-1\\} \\; (\\text{frequency})'
    },
    {
        pattern: /(bin spacing|frequency spacing).*?(remains constant|independent of n|does not depend on n)/i,
        topicKey: 'dft_dtft_circular',
        competence_acknowledgement: 'Good focus on how the total normalized frequency range of a discrete-time signal spans $2\\pi$ radians.',
        rearticulated_nudge: 'To connect your thought to bin spacing: the total span of $2\\pi$ radians stays constant, so dividing that fixed $2\\pi$ circle into $N$ equal slices means each slice width $\\Delta\\omega$ shrinks as $N$ increases.',
        concept_anchor: 'The DFT divides the $2\\pi$ radian unit circle into $N$ equal slices.',
        counter_example: 'If you slice a circle of circumference $2\\pi$ into $N=8$ pieces versus $N=1024$ pieces, the angular width of each slice changes inversely with $N$.',
        probe_question: 'What is the exact formula for the spacing $\\Delta\\omega$ between adjacent DFT frequency bins for an $N$-point transform?',
        math_payload: '\\Delta\\omega = \\frac{2\\pi}{N} \\; \\text{rad/sample}, \\quad \\Delta f = \\frac{f_s}{N} \\; \\text{Hz}'
    },
    {
        pattern: /((increasing|higher|raising|doubling).*?sampling rate|anti-aliasing|double the sqnr|twice as many|sqnr simply doubles).*?(eliminates?.*quantization|fixes?.*quantization|quantization (noise|error)|double the sqnr|sqnr simply doubles)/i,
        topicKey: 'signals_quantization',
        competence_acknowledgement: 'You are spot-on recognizing that the anti-aliasing low-pass filter and the sampling rate $f_s$ are critical front-end stages of the ADC pipeline, and that adding $1\\text{ bit}$ doubles the number of quantization levels ($2^{B+1} = 2 \\cdot 2^B$)!',
        rearticulated_nudge: 'Let us look directly at how the ADC signal chain separates **time/frequency** from **amplitude**:\n' +
            '1. **Why the Anti-Aliasing Filter & Sampling Rate $f_s$ Cannot Remove Quantization Noise 🛡️**: Look at the order of hardware blocks:\n' +
            '$$\\text{Analog Input } x(t) \\longrightarrow \\mathbf{\\text{Anti-Aliasing LPF}} \\longrightarrow \\mathbf{\\text{Sampler } (f_s)} \\longrightarrow \\mathbf{\\text{Quantizer } (2^B)} \\longrightarrow \\text{Digital } x[n]$$\n' +
            'The anti-aliasing LPF operates *upstream* in the analog domain to remove frequencies above $f_s/2$ before sampling. Quantization noise is introduced *downstream* inside the quantizer when continuous sample voltages are rounded to $2^B$ discrete levels with step size $\\Delta = X_{pp}/2^B$.\n' +
            '2. **How We Actually Reduce Quantization Noise 🎚️**: Average quantization noise power is $P_n = \\Delta^2/12$. Adding $1\\text{ bit}$ ($B \\to B+1$) halves $\\Delta \\to \\Delta/2$, which cuts noise power to $(\\Delta/2)^2/12 = \\frac{1}{4}P_n$ and boosts $\\text{SQNR}$ by $10\\log_{10}(4) \\approx +6.02\\text{ dB}$ per bit!',
        concept_anchor: 'Sampling and anti-aliasing act on the **time/frequency axis** ($t \\to nT_s$), whereas quantization acts downstream on the **amplitude axis** (rounding $x[n]$ to $2^B$ levels with noise power $P_n = \\Delta^2/12$).',
        counter_example: 'Even with an ideal analog anti-aliasing filter and a $1\\text{ GHz}$ sampling rate, a $1\\text{-bit}$ quantizer still rounds every sample amplitude into only $2$ levels! Only increasing bit-depth $B$ shrinks step size $\\Delta = X_{pp}/2^B$ (giving $+6.02\\text{ dB}$ per bit).',
        probe_question: 'Let us test this: by how many decibels ($\\text{dB}$) does upgrading an $8\\text{-bit}$ ADC ($\\approx 49.9\\text{ dB}$) to a $10\\text{-bit}$ ADC improve $\\text{SQNR}$, and why can an upstream analog anti-aliasing filter not remove downstream quantization rounding error?',
        math_payload: 'P_{n,\\text{new}} = \\frac{(\\Delta/2)^2}{12} = \\frac{1}{4}P_n \\implies \\Delta\\text{SQNR} = 10\\log_{10}(4) \\approx 6.02\\text{ dB/bit}, \\quad \\text{SQNR}_{\\text{dB}} = 6.02B + 1.76\\text{ dB}'
    },
    {
        pattern: /(any causal.*stable|causal.*automatically.*stable)/i,
        topicKey: 'lti_convolution',
        competence_acknowledgement: 'You are right that causality ($h[n] = 0$ for $n < 0$) is required for any real-time physical filter.',
        rearticulated_nudge: 'To nudge your thought forward: causality only guarantees that the filter does not look into the future ($n < 0$), but for the output to remain bounded (BIBO stability), the impulse response $h[n]$ must also decay fast enough that its absolute sum over all $n \\ge 0$ is finite.',
        concept_anchor: 'Causality ($h[n]=0$ for $n<0$) and BIBO Stability ($\\sum |h[n]| < \\infty$) are completely independent properties!',
        counter_example: 'Consider $h[n] = 2^n u[n]$. It is strictly causal (zero for $n < 0$), yet $\\sum_{n=0}^{\\infty} 2^n = \\infty$, so it explodes for a bounded step input!',
        probe_question: 'What condition on the impulse response $h[n]$ is required for an LTI system to be BIBO stable?',
        math_payload: '\\sum_{n=-\\infty}^{\\infty} |h[n]| < \\infty'
    },
    {
        pattern: /(roc|region of convergence).*?(contain.*pole|must contain all poles|includes? poles)/i,
        topicKey: 'z_transform_roc',
        competence_acknowledgement: 'Good intuition that the pole locations $p_k$ and the Region of Convergence (ROC) together determine system stability.',
        rearticulated_nudge: 'Let us reframe how poles relate to the ROC: because $X(z)$ blows up to infinity at a pole, the ROC can never contain poles—instead, the poles form the inner or outer boundary of the ROC, and for BIBO stability the ROC must contain the unit circle $|z| = 1$.',
        concept_anchor: 'By definition, a pole $p_k$ is a complex value where $|X(p_k)| = \\infty$, meaning the Z-transform sum diverges.',
        counter_example: 'Since the Region of Convergence (ROC) is the region where $|X(z)| < \\infty$, a pole can NEVER lie inside the ROC—poles only form the boundary of the ROC!',
        probe_question: 'Instead of containing poles, what geometric curve in the $z$-plane must the ROC contain for an LTI system to be BIBO stable?',
        math_payload: '|z| = 1 \\quad (\\text{The Unit Circle } z = e^{j\\omega})'
    },
    {
        pattern: /(fft|fast fourier transform).*?(approximation|different spectral values|less accurate than dft)/i,
        topicKey: 'fft_radix2',
        competence_acknowledgement: 'You are right that the FFT dramatically changes how the transform is computed compared to the direct DFT sum.',
        rearticulated_nudge: 'To nudge that idea in the right direction: the Radix-2 FFT rearranges the exact same arithmetic using twiddle-factor symmetries ($W_N^{k+N/2} = -W_N^k$) rather than approximating—so it yields the exact same $X[k]$ spectrum in $(N/2)\\log_2 N$ multiplications.',
        concept_anchor: 'The FFT is NOT an approximation—it is an exact algebraic factoring of the DFT matrix using twiddle factor symmetries.',
        counter_example: 'Just as factoring $a\\cdot b + a\\cdot c = a(b+c)$ gives the exact same number with fewer multiplications, the Radix-2 FFT computes the exact same $X[k]$ values as the DFT.',
        probe_question: 'How does the Radix-2 FFT reduce the number of complex multiplications from $N^2$ down to $\\mathcal{O}(N \\log_2 N)$?',
        math_payload: 'C_{\\text{mult}} = \\frac{N}{2}\\log_2 N \\quad \\text{via } W_N^{k+N/2} = -W_N^k'
    },
    {
        pattern: /(rectangular window).*?(eliminates?.*gibbs|removes?.*overshoot|longer.*eliminates.*ripple)/i,
        topicKey: 'fir_windowing',
        competence_acknowledgement: 'Spot-on intuition that increasing the window length $N$ improves the sharpness of an FIR filter.',
        rearticulated_nudge: 'Reframing how $N$ affects the frequency response: increasing $N$ makes the main lobe narrower (steepening the transition band $\\Delta\\omega \\propto 1/N$), but the $\\approx 9\\%$ Gibbs ripple comes from the sharp rectangular edge—requiring a smooth tapered window like Hamming or Kaiser to suppress the sidelobes.',
        concept_anchor: 'Increasing the length $N$ of a Rectangular window makes the transition band narrower, but the peak sidelobe height remains fixed at $-13\\text{ dB}$ ($\\approx 9\\%$ Gibbs overshoot).',
        counter_example: 'As $N \\to \\infty$, the Gibbs ears compress closer to the cutoff edge but never shrink in height unless you taper the window edges smoothly to zero!',
        probe_question: 'How do tapered windows like Hamming or Kaiser eliminate the Gibbs overshoot, and what is the trade-off in main-lobe width?',
        math_payload: 'w_{\\text{Hamming}}[n] = 0.54 - 0.46\\cos\\left(\\frac{2\\pi n}{N-1}\\right) \\implies \\text{Peak Sidelobe } = -43\\text{ dB}'
    },
    {
        pattern: /(impulse invariance).*?(alias-free|high-pass|band-stop)/i,
        topicKey: 'iir_bilinear',
        competence_acknowledgement: 'Good thinking connecting analog filter prototypes $H_a(s)$ to digital IIR filter design.',
        rearticulated_nudge: 'To nudge your thought toward the right method: because Impulse Invariance samples $h_a(t)$ in time, any high-frequency energy in a High-Pass or Band-Stop filter folds back as aliasing—whereas the Bilinear Transformation maps the entire $j\\Omega$ axis one-to-one onto the unit circle without aliasing.',
        concept_anchor: 'Impulse Invariance maps $s$-plane strips of width $2\\pi/T_s$ onto the same unit circle (many-to-one mapping), causing severe aliasing if $H_a(j\\Omega)$ is not strictly bandlimited.',
        counter_example: 'High-pass and band-stop analog filters have non-zero gain as $\\Omega \\to \\infty$, so sampling their impulse response folds high-frequency energy across the entire digital spectrum!',
        probe_question: 'Which IIR mapping technique maps the entire $j\\Omega$ axis one-to-one onto the unit circle without aliasing, and what frequency pre-warping formula does it use?',
        math_payload: 's = \\frac{2}{T_s}\\left(\\frac{1-z^{-1}}{1+z^{-1}}\\right), \\quad \\Omega = \\frac{2}{T_s}\\tan\\left(\\frac{\\omega}{2}\\right)'
    }
];

function getNextDSPTopicProfile(currentKey = '') {
    const idx = TOPIC_PROGRESSION_ORDER.indexOf(currentKey);
    if (idx === -1 || idx + 1 >= TOPIC_PROGRESSION_ORDER.length) {
        return DSP_TOPICS_CATALOG.lti_convolution;
    }
    const nextKey = TOPIC_PROGRESSION_ORDER[idx + 1];
    return DSP_TOPICS_CATALOG[nextKey] || DSP_TOPICS_CATALOG.lti_convolution;
}

const SPECIFIC_TOPIC_MATCH_ORDER = [
    'multirate_adaptive',
    'iir_bilinear',
    'fir_windowing',
    'filter_structures_wordlength',
    'fft_radix2',
    'dft_dtft_circular',
    'z_transform_roc',
    'dtft_frequency',
    'lti_convolution',
    'signals_quantization'
];

function resolveDSPTopicProfile(topic = '', studentResponse = '', subtopicId = '') {
    // 1. If the student asked a specific technical question in studentResponse, match studentResponse FIRST
    //    in specific-to-general order so default session subtopic (ee3621_l1) never overrides their actual question!
    if (studentResponse && studentResponse.trim().length > 3) {
        for (const item of DSP_MISCONCEPTIONS) {
            if (item.pattern.test(studentResponse) && DSP_TOPICS_CATALOG[item.topicKey]) {
                return DSP_TOPICS_CATALOG[item.topicKey];
            }
        }
        for (const key of SPECIFIC_TOPIC_MATCH_ORDER) {
            const profile = DSP_TOPICS_CATALOG[key];
            if (profile && profile.matchRegex.test(studentResponse)) {
                return profile;
            }
        }
    }
    // 2. Match explicit topic string (e.g. when advancing to nextTopicKey)
    if (topic) {
        for (const profile of Object.values(DSP_TOPICS_CATALOG)) {
            if (profile.key === topic || profile.title.toLowerCase() === topic.toLowerCase()) {
                return profile;
            }
        }
        for (const key of SPECIFIC_TOPIC_MATCH_ORDER) {
            const profile = DSP_TOPICS_CATALOG[key];
            if (profile && profile.matchRegex.test(topic)) {
                return profile;
            }
        }
    }
    // 3. Match subtopicId if neither studentResponse nor topic matched
    if (subtopicId) {
        for (const key of SPECIFIC_TOPIC_MATCH_ORDER) {
            const profile = DSP_TOPICS_CATALOG[key];
            if (profile && profile.matchRegex.test(subtopicId)) {
                return profile;
            }
        }
    }
    return DSP_TOPICS_CATALOG.dft_dtft_circular;
}

/**
 * Inspect student response for known DSP misconceptions.
 */
function checkDSPMisconception(studentResponse = '', topic = '', subtopicId = '') {
    if (!studentResponse || typeof studentResponse !== 'string') return null;
    const text = studentResponse.trim();
    if (/^(teach me|learn|start|let'?s learn|introduce)/i.test(text)) return null;
    for (const item of DSP_MISCONCEPTIONS) {
        if (item.pattern.test(text)) {
            const profile = DSP_TOPICS_CATALOG[item.topicKey] || resolveDSPTopicProfile(topic, studentResponse, subtopicId);
            return {
                ...profile,
                ...item,
                phase: 'MISCONCEPTION_REPAIR',
                bloom_level: 'understanding'
            };
        }
    }
    return null;
}

/**
 * Inspect if student has demonstrated mastery of the current DSP topic.
 */
function checkDSPMastery(studentResponse = '', topic = '', subtopicId = '') {
    if (!studentResponse || typeof studentResponse !== 'string') return false;
    const text = studentResponse.trim();
    if (/^(teach me|learn|start|let'?s learn|introduce)/i.test(text)) {
        return false;
    }
    if (/\?\s*$/.test(text) || /^(why|how|what|when|where|can you|could you|explain|help|tell me|i don't|i am confused)/i.test(text) || /\b(why does|how does|what is)\b/i.test(text)) {
        return false;
    }
    if (checkDSPMisconception(text, topic, subtopicId)) return false;

    const profile = resolveDSPTopicProfile(topic, studentResponse, subtopicId);
    if (profile && profile.masteryRegex && profile.masteryRegex.test(text)) {
        return true;
    }

    const masteryPatterns = [
        /(dtft).*?(continuous).*?(dft).*?(discrete|sampled|bins)/i,
        /(dft).*?(samples|discrete bins|discrete frequency)/i,
        /(2\s*\\?pi\s*\/\s*n|2pi\/n|bin spacing.*?finer)/i,
        /(6\.02\s*b|each extra bit halves step size)/i,
        /(causal iff h\[n\]\s*=\s*0|bibo stable iff.*\|h\[n\]\|)/i,
        /(roc includes the unit circle|poles lie inside the unit circle|\|p_k\|\s*<\s*1)/i,
        /(log_?2\s*n stages|\(n\/2\)\s*log)/i,
        /(direct form ii shares delay|cascade biquads minimize pole sensitivity)/i,
        /(h\[n\]\s*=\s*[±+-]?h\[n-1-n\]|tapered windows.*suppress sidelobes)/i,
        /(bilinear transform maps.*one-to-one|pre-warping.*tan)/i,
        /(0\s*<\s*[μu]\s*<\s*2\/|faster convergence.*misadjustment)/i
    ];
    return masteryPatterns.some(rx => rx.test(text));
}

/**
 * Build a 3-stage Gemini-style "Dissect -> Collate -> Synthesize" thinking trace
 * so both live SSE streaming and the collapsible Thinking Dropdown show structured reasoning.
 */
function buildGeminiThinkingTrace({ profile, studentResponse = '', classification = 'INTRODUCTION', misconception = null, nextProfile = null }) {
    const cleanInput = String(studentResponse || '').trim().slice(0, 110);
    let dissectText = '';
    let collateText = '';
    let synthesizeText = '';

    if (classification === 'INTRODUCTION') {
        dissectText = `Dissecting learning request on "${profile.title}" — identifying core physical axes, prerequisite concepts, and interactive entry points.`;
        collateText = `Collating EE3621 lecture grounding (${profile.defaultSubtopicId}), governing mathematical relationships ($${profile.math_payload.slice(0, 65)}$), and physical signal-chain analogies.`;
        synthesizeText = `Structuring Step ${profile.stepNumber || 1} of ${TOPIC_PROGRESSION_ORDER.length} with dual-axis intuition, KaTeX derivation, and a targeted Guided Learning Check.`;
    } else if (classification === 'MISCONCEPTION') {
        dissectText = `Dissecting student hypothesis ("${cleanInput}") — isolating valid intuition ($2^{B+1}$ levels / system property) from the underlying signal-chain misconception.`;
        collateText = `Collating counter-example and mathematical proof ($${(misconception?.math_payload || profile.math_payload).slice(0, 65)}$) to contrast upstream vs. downstream operations.`;
        synthesizeText = `Synthesizing 4-part Guided Learning repair: (1) Acknowledge competence, (2) Reframe student response, (3) Provide signal-chain hint, and (4) Pose numerical verification check.`;
    } else if (classification === 'CORRECT') {
        dissectText = `Dissecting student explanation ("${cleanInput}") — verified accurate mastery of ${profile.title} governing laws.`;
        collateText = `Collating synthesis summary for ${profile.title} and loading next curriculum module: "${nextProfile?.title || 'Next Subtopic'}" (${nextProfile?.defaultSubtopicId || 'ee3621'}).`;
        synthesizeText = `Affirming mastery with numerical bridge and transitioning to Step ${nextProfile?.stepNumber || 2} of ${TOPIC_PROGRESSION_ORDER.length} with one focused checkpoint question.`;
    } else {
        dissectText = `Dissecting student response ("${cleanInput}") — evaluating current conceptual grasp on "${profile.title}".`;
        collateText = `Collating progressive hint scaffold and governing formula ($${profile.math_payload.slice(0, 65)}$) from EE3621 course notes.`;
        synthesizeText = `Synthesizing supportive competence acknowledgement, reframed nudge, and guided checkpoint question.`;
    }

    const thinking_steps = [
        {
            stepId: 'dissect',
            title: 'Dissecting Query & Student Intuition',
            content: dissectText,
            status: 'completed',
            stepConfidence: 96
        },
        {
            stepId: 'collate',
            title: 'Collating Course Grounding & Governing Math',
            content: collateText,
            status: 'completed',
            stepConfidence: 95
        },
        {
            stepId: 'synthesize',
            title: 'Synthesizing Guided Learning Scaffold',
            content: synthesizeText,
            status: 'completed',
            stepConfidence: 97
        }
    ];

    const thinking_markdown = [
        `1. **🔍 Dissecting Request & Intuition**: ${dissectText}`,
        `2. **📚 Collating Course Grounding**: ${collateText}`,
        `3. **✨ Synthesizing Guided Response**: ${synthesizeText}`
    ].join('\n\n');

    return { thinking_steps, thinking_markdown };
}

/**
 * Build a Gemini-Grade Guided Learning Turn object for ANY DSP topic.
 * Implements:
 *  - Competence acknowledgement + Student response re-articulation + Hint/Guidance on partial/misconception turns
 *  - Competence affirmation + Clear explanation of the NEXT subtopic + Guided Question on correct turns
 */
function generateStructuredTurn({ topic = '', subtopicId = '', studentResponse = '', turnCount = 0, courseName = 'EE3621', isInitialTurn = false }) {
    const turn_id = uuidv4();
    const cleanText = String(studentResponse || '').trim();
    const profile = resolveDSPTopicProfile(topic, cleanText, subtopicId);
    const stepBadge = `🗺️ **Guided Learning Path — Step ${profile.stepNumber || 1} of ${TOPIC_PROGRESSION_ORDER.length}**`;

    // 0A. Priority 1: Adversarial / Role-Spoofing / Answer-Key Extraction Guardrail (CAT_08)
    if (/(system override|ignore all|ignore previous|correctanswer|correctindex|activeassessments|developer debug|answerbot|expectedcorrectoption|roleplay as|put \*\*\* around)/i.test(cleanText)) {
        const trace = buildGeminiThinkingTrace({ profile, studentResponse: cleanText, classification: 'PARTIAL' });
        return {
            turn_id,
            scaffold_phase: 'GUARDRAIL_SCAFFOLD',
            bloom_level: 'understanding',
            competence_acknowledgement: `🔒 **Academic Integrity & Anti-Cheat Guardrail Active**: I cannot output raw answer keys (\`correctAnswer\` / \`correctIndex\`), dump the server-side \`activeAssessments\` vault, or bypass Socratic Guided Learning rules.`,
            rearticulated_nudge: `Let us instead work through the underlying **${profile.title}** concept step-by-step so you can solve any variant on your own!`,
            concept_anchor: `${stepBadge}\n\n📘 **Guided Concept Anchor (${profile.title})**: ${profile.concept_anchor}`,
            guided_hint: profile.hints?.[1]?.content || profile.hints?.[0]?.content || '',
            probe_question: profile.probe_question,
            math_payload: profile.math_payload,
            hints: profile.hints,
            quick_hypotheses: profile.quick_hypotheses,
            interactive_tool_link: profile.interactive_tool_link,
            thinking_steps: trace.thinking_steps,
            thinking_markdown: trace.thinking_markdown,
            isMastered: false,
            classification: 'GUARDRAIL'
        };
    }

    // 0B. Priority 2: Check for Misconception EVEN ON TURN 0 (CAT_02)
    const misconception = checkDSPMisconception(cleanText, topic, subtopicId);
    if (misconception) {
        const compAck = misconception.competence_acknowledgement || profile.competence_template;
        const rearticulate = misconception.rearticulated_nudge || profile.rearticulation_template;
        const guidedHint = `${misconception.counter_example} ${profile.hints?.[1]?.content || ''}`.trim();
        const trace = buildGeminiThinkingTrace({ profile, studentResponse: cleanText, classification: 'MISCONCEPTION', misconception });

        return {
            turn_id,
            scaffold_phase: 'MISCONCEPTION_REPAIR',
            bloom_level: misconception.bloom_level || 'understanding',
            competence_acknowledgement: compAck,
            rearticulated_nudge: rearticulate,
            concept_anchor: misconception.concept_anchor,
            counter_example: misconception.counter_example,
            guided_hint: guidedHint,
            probe_question: misconception.probe_question,
            math_payload: misconception.math_payload,
            hints: misconception.hints || profile.hints,
            quick_hypotheses: misconception.quick_hypotheses || profile.quick_hypotheses,
            interactive_tool_link: misconception.interactive_tool_link || profile.interactive_tool_link,
            thinking_steps: trace.thinking_steps,
            thinking_markdown: trace.thinking_markdown,
            isMastered: false,
            classification: 'MISCONCEPTION'
        };
    }

    // 0C. Priority 3: Direct Homework / Quiz Shortcut Seekers (CAT_01)
    if (/(just give me the final|no explanation|dont ask me|skip the socratic|just reply with 1 letter|just the number please|final answer only|give me the answer directly|quiz question:)/i.test(cleanText)) {
        const trace = buildGeminiThinkingTrace({ profile, studentResponse: cleanText, classification: 'PARTIAL' });
        const isCosPeriod = /cos\(\(3\*pi\/10\)\*n\)/i.test(cleanText);
        return {
            turn_id,
            scaffold_phase: 'HOMEWORK_SCAFFOLD',
            bloom_level: 'applying',
            competence_acknowledgement: `I see you are working on an assessment problem on **${profile.title}**! In Guided Learning Mode, I won't hand over a raw option letter (` + '`A/B/C/D`' + `), because every student receives randomized numerical parameters—instead, let's set up the exact 1-line equation so you can read off the answer immediately.`,
            rearticulated_nudge: isCosPeriod
                ? `For $x[n] = \\cos\\left(\\frac{3\\pi}{10}n\\right)$, the digital angular frequency is $\\omega_0 = \\frac{3\\pi}{10}\\text{ rad/sample}$. A discrete-time sinusoid is periodic with fundamental period $N$ iff $\\frac{\\omega_0}{2\\pi} = \\frac{k}{N}$ is a reduced fraction of integers:`
                : profile.rearticulation_template,
            concept_anchor: isCosPeriod
                ? `Divide $\\omega_0$ by $2\\pi$: $$\\frac{\\omega_0}{2\\pi} = \\frac{3\\pi / 10}{2\\pi} = \\frac{3}{20} = \\frac{k}{N}$$ Since $\\gcd(3, 20) = 1$, the fraction $\\frac{3}{20}$ is already in lowest terms.`
                : profile.concept_anchor,
            guided_hint: isCosPeriod
                ? `Match the denominator of the reduced fraction $\\frac{k}{N} = \\frac{3}{20}$ to find the smallest positive integer number of samples $N$.`
                : (profile.hints?.[1]?.content || profile.hints?.[0]?.content || ''),
            probe_question: isCosPeriod
                ? `Looking at the reduced ratio $\\frac{k}{N} = \\frac{3}{20}$, what is the fundamental period $N$ (in samples) of $x[n] = \\cos\\left(\\frac{3\\pi}{10}n\\right)$?`
                : profile.probe_question,
            math_payload: isCosPeriod
                ? '\\frac{\\omega_0}{2\\pi} = \\frac{3\\pi/10}{2\\pi} = \\frac{3}{20} = \\frac{k}{N} \\; (\\gcd(3,20)=1)'
                : profile.math_payload,
            hints: profile.hints,
            quick_hypotheses: profile.quick_hypotheses,
            interactive_tool_link: profile.interactive_tool_link,
            thinking_steps: trace.thinking_steps,
            thinking_markdown: trace.thinking_markdown,
            isMastered: false,
            classification: 'PARTIAL'
        };
    }

    // 0D. Priority 4: Frustrated / Stuck / "IDK" Learners (CAT_05)
    if (/\b(idk|i don'?t know|completely lost|i give up|makes zero sense|i dont understand|im stuck|i have no idea|i am confused|i failed)\b/i.test(cleanText)) {
        const trace = buildGeminiThinkingTrace({ profile, studentResponse: cleanText, classification: 'PARTIAL' });
        return {
            turn_id,
            scaffold_phase: 'EMPATHETIC_ANALOGY_SCAFFOLD',
            bloom_level: 'understanding',
            competence_acknowledgement: `Take a breath—it is completely normal to feel stuck on **${profile.title}** at first! Let's strip away the dense notation and use one visual picture.`,
            rearticulated_nudge: profile.key === 'z_transform_roc'
                ? `Think of the complex $z$-plane like a flat map with a circular walking track of radius $1$ called the **Unit Circle ($|z| = 1$)**. Every **pole** $p_k$ is a "volcano" where the transfer function $H(z)$ erupts to $\\infty$. The **Region of Convergence (ROC)** is the safe zone where signals stay finite—so the safe zone can *never* step on a volcano (pole), and for a causal system its safe zone extends *outward* from the outermost volcano ($|z| > r_{\\max}$).`
                : profile.rearticulation_template,
            concept_anchor: `${stepBadge}\n\n📘 **Intuitive Anchor (${profile.title})**: ${profile.concept_anchor}`,
            guided_hint: profile.hints?.[0]?.content || '',
            probe_question: profile.key === 'z_transform_roc'
                ? `Using our map analogy: if a causal filter's safe zone (ROC) starts *outside* the furthest pole ($|z| > r_{\\max}$) and must cover the **Unit Circle track ($|z| = 1$)** to be BIBO stable, must all the poles sit **inside** ($r_{\\max} < 1$) or **outside** ($r_{\\max} > 1$) the unit circle?`
                : profile.probe_question,
            math_payload: profile.math_payload,
            hints: profile.hints,
            quick_hypotheses: profile.quick_hypotheses,
            interactive_tool_link: profile.interactive_tool_link,
            thinking_steps: trace.thinking_steps,
            thinking_markdown: trace.thinking_markdown,
            isMastered: false,
            classification: 'PARTIAL'
        };
    }

    // 0E. Priority 5: Multi-Unit System Design & Capstone Synthesis (CAT_09)
    if (/(biomedical|ecg|acquisition system|radar pulse|fixed-point.*elliptic|2-stage multirate|cic.*sigma-delta|hilbert transformer|graphic equalizer|qmf|subband)/i.test(cleanText)) {
        const trace = buildGeminiThinkingTrace({ profile, studentResponse: cleanText, classification: 'INTRODUCTION' });
        const isEcg = /(biomedical|ecg)/i.test(cleanText);
        return {
            turn_id,
            scaffold_phase: 'CAPSTONE_SYSTEM_DESIGN',
            bloom_level: 'evaluating',
            competence_acknowledgement: isEcg
                ? `Excellent end-to-end DSP system design challenge! Designing a biomedical ECG front-end ($0\\text{--}250\\text{ Hz}$ bandwidth, $50\\text{ Hz}$ hum, $>70\\text{ dB}$ dynamic range) links **CO1 (Sampling/ADC)**, **CO3 (Pole-Zero Notch Design)**, and **CO4 (Linear Phase Preservation)**.`
                : `Great multi-unit DSP architecture question connecting **${profile.title}** to real-time hardware constraints!`,
            rearticulated_nudge: isEcg
                ? `Let us break your ECG acquisition architecture into 3 design stages:\n` +
                  `1. **Sampling Rate $f_s$ (CO1)**: By Nyquist, $f_s > 2 f_{\\max} = 2(250\\text{ Hz}) = 500\\text{ Hz}$. In practice we choose $f_s = 1000\\text{ Hz}$ so the analog anti-aliasing filter has a comfortable transition band.\n` +
                  `2. **ADC Bit-Depth $B$ (CO1)**: Since $\\text{SQNR}_{\\text{dB}} = 6.02B + 1.76 > 70\\text{ dB}$, solving $6.02B > 68.24$ gives $B \\ge 12\\text{ bits}$ ($\\approx 74.0\\text{ dB}$).\n` +
                  `3. **Digital $50\\text{ Hz}$ Notch Filter (CO3/CO5)**: Place complex-conjugate zeros directly on the unit circle at $z_0 = e^{\\pm j\\omega_0}$ where $\\omega_0 = 2\\pi f_0 / f_s$, and place poles just inside at $p_0 = r e^{\\pm j\\omega_0}$ ($r \\approx 0.95$) for a sharp, BIBO-stable notch.`
                : profile.detailed_explanation,
            concept_anchor: isEcg
                ? `$$H_{\\text{notch}}(z) = \\frac{1 - 2\\cos(\\omega_0)z^{-1} + z^{-2}}{1 - 2r\\cos(\\omega_0)z^{-1} + r^2 z^{-2}}, \\quad \\omega_0 = \\frac{2\\pi f_0}{f_s}, \\quad 0.90 \\le r < 1$$`
                : profile.concept_anchor,
            probe_question: isEcg
                ? `If we sample the ECG at $f_s = 1000\\text{ Hz}$ to reject $f_0 = 50\\text{ Hz}$ powerline interference, what is the exact digital notch angle $\\omega_0 = \\frac{2\\pi f_0}{f_s}$ (in radians/sample), and why must the pole radius satisfy $r < 1$?`
                : profile.probe_question,
            math_payload: isEcg
                ? 'f_s \\ge 2(250\\text{ Hz}) = 500\\text{ Hz}, \\quad B = \\lceil(70 - 1.76)/6.02\\rceil = 12\\text{ bits}, \\quad \\omega_0 = \\frac{2\\pi(50)}{f_s}'
                : profile.math_payload,
            hints: profile.hints,
            quick_hypotheses: profile.quick_hypotheses,
            interactive_tool_link: profile.interactive_tool_link,
            thinking_steps: trace.thinking_steps,
            thinking_markdown: trace.thinking_markdown,
            isMastered: false,
            classification: 'INTRODUCTION'
        };
    }

    // 0F. Specific Socratic Problem Walkthrough (e.g. P021: H(z) = z / ((z - 0.5)(z - 2)))
    if (/\(z\s*-\s*0\.5\)\s*\(z\s*-\s*2\)/i.test(cleanText)) {
        const trace = buildGeminiThinkingTrace({ profile, studentResponse: cleanText, classification: 'INTRODUCTION' });
        return {
            turn_id,
            scaffold_phase: 'GUIDED_PROBLEM_WALKTHROUGH',
            bloom_level: 'analyzing',
            concept_anchor: `${stepBadge}\n\n📘 **Guided Problem Walkthrough — ${profile.title}**\n\n` +
                `We want to determine whether $H(z) = \\frac{z}{(z - 0.5)(z - 2)}$ can be **both Causal and BIBO Stable**. Let us dissect its pole-zero geometry step-by-step:\n\n` +
                `1. **Locate the Poles**: Setting the denominator to zero gives two poles: one inside the unit circle at $p_1 = 0.5$ ($|p_1| < 1$) and one outside the unit circle at $p_2 = 2$ ($|p_2| > 1$).\n` +
                `2. **Causal ROC Rule**: For $h[n]$ to be causal (right-sided), the ROC must lie outside the outermost pole: $\\text{ROC}_{\\text{causal}}: |z| > 2$.\n` +
                `3. **BIBO Stability Rule**: For $h[n]$ to be BIBO stable, the ROC must include the unit circle $|z| = 1$ (which corresponds to the annular ring $\\text{ROC}_{\\text{stable}}: 0.5 < |z| < 2$).`,
            probe_question: `Look at those two regions: does the causal Region of Convergence ($|z| > 2$) include the unit circle $|z| = 1$, and what does that tell you about whether this system can be *both* causal and BIBO stable at the same time?`,
            math_payload: 'H(z) = \\frac{z}{(z - 0.5)(z - 2)}, \\quad p_1 = 0.5, \\; p_2 = 2, \\quad \\text{Causal ROC: } |z| > 2, \\quad \\text{Stable ROC: } 0.5 < |z| < 2',
            hints: profile.hints,
            quick_hypotheses: profile.quick_hypotheses,
            interactive_tool_link: profile.interactive_tool_link,
            thinking_steps: trace.thinking_steps,
            thinking_markdown: trace.thinking_markdown,
            isMastered: false,
            classification: 'INTRODUCTION'
        };
    }

    const isInit = isInitialTurn || turnCount === 0 || /^(teach me|learn|start|let'?s learn|introduce)/i.test(cleanText);

    // 1. Initial Turn: Clear explanation of the subtopic followed by a Guided Learning Check question
    if (isInit) {
        const trace = buildGeminiThinkingTrace({ profile, studentResponse: cleanText, classification: 'INTRODUCTION' });
        return {
            turn_id,
            scaffold_phase: 'GUIDED_INTRODUCTION',
            bloom_level: 'understanding',
            concept_anchor: `${stepBadge}\n\n📘 **Guided Learning: ${profile.title}**\n\n${profile.detailed_explanation || profile.concept_anchor}`,
            probe_question: profile.probe_question,
            math_payload: profile.math_payload,
            hints: profile.hints,
            quick_hypotheses: profile.quick_hypotheses,
            interactive_tool_link: profile.interactive_tool_link,
            thinking_steps: trace.thinking_steps,
            thinking_markdown: trace.thinking_markdown,
            isMastered: false,
            classification: 'INTRODUCTION'
        };
    }

    // 2. Check for Mastery / Correct Response -> Acknowledge Competence + Clear Explanation of NEXT Subtopic + Question
    if (checkDSPMastery(studentResponse, topic, subtopicId)) {
        const nextProfile = getNextDSPTopicProfile(profile.key);
        const compAck = `Precisely! You nailed **${profile.title}** — ${profile.synthesis_artifact.summary}`;
        const nextStepBadge = `🗺️ **Guided Learning Path — Advancing to Step ${nextProfile.stepNumber || 2} of ${TOPIC_PROGRESSION_ORDER.length}**`;
        const nextExplanation = `${nextStepBadge}\n\n${nextProfile.detailed_explanation || `${nextProfile.concept_anchor} ${nextProfile.hints?.[2]?.content || ''}`}`;
        const trace = buildGeminiThinkingTrace({ profile, studentResponse, classification: 'CORRECT', nextProfile });

        return {
            turn_id,
            scaffold_phase: 'SYNTHESIS',
            bloom_level: 'analyzing',
            competence_acknowledgement: compAck,
            concept_anchor: `✅ **What You Mastered (${profile.title})**: ${compAck}`,
            next_subtopic_title: nextProfile.title,
            next_subtopic_explanation: nextExplanation,
            probe_question: nextProfile.probe_question,
            math_payload: nextProfile.math_payload,
            synthesis_artifact: profile.synthesis_artifact,
            hints: nextProfile.hints,
            quick_hypotheses: nextProfile.quick_hypotheses,
            interactive_tool_link: nextProfile.interactive_tool_link,
            thinking_steps: trace.thinking_steps,
            thinking_markdown: trace.thinking_markdown,
            nextTopicKey: nextProfile.key,
            nextTopicTitle: nextProfile.title,
            nextSubtopicId: nextProfile.defaultSubtopicId,
            isMastered: true,
            classification: 'CORRECT'
        };
    }

    // 3. Partial / Exploratory Response -> Acknowledge competence + Re-articulate to nudge + Hint & Guidance + Question
    const tierIdx = Math.min(Math.max(0, (turnCount || 1) - 1), (profile.hints?.length || 1) - 1);
    const activeHint = profile.hints?.[tierIdx]?.content || profile.hints?.[0]?.content || '';
    const trace = buildGeminiThinkingTrace({ profile, studentResponse, classification: 'PARTIAL' });

    return {
        turn_id,
        scaffold_phase: 'GUIDED_SCAFFOLD',
        bloom_level: 'understanding',
        competence_acknowledgement: profile.competence_template,
        rearticulated_nudge: profile.rearticulation_template,
        concept_anchor: profile.concept_anchor,
        guided_hint: activeHint,
        probe_question: profile.probe_question,
        math_payload: profile.math_payload,
        hints: profile.hints,
        quick_hypotheses: profile.quick_hypotheses,
        interactive_tool_link: profile.interactive_tool_link,
        thinking_steps: trace.thinking_steps,
        thinking_markdown: trace.thinking_markdown,
        isMastered: false,
        classification: 'PARTIAL'
    };
}

/**
 * Format the structured Guided Learning turn into clean, supportive prose.
 */
function formatTurnAsText(turn) {
    const lines = [];
    if (turn.competence_acknowledgement && !turn.isMastered) {
        lines.push(`✅ **Acknowledge Your Competence**: ${turn.competence_acknowledgement}`);
    }
    if (turn.rearticulated_nudge) {
        lines.push(`🔄 **Reframing Your Response**: ${turn.rearticulated_nudge}`);
    }
    if (turn.concept_anchor) {
        lines.push(turn.concept_anchor);
    }
    if (turn.guided_hint) {
        lines.push(`💡 **Guidance & Hint**: ${turn.guided_hint}`);
    } else if (turn.counter_example) {
        lines.push(`💡 **Guided Insight**: ${turn.counter_example}`);
    }
    if (turn.next_subtopic_explanation) {
        lines.push(`📘 **Next Subtopic — ${turn.next_subtopic_title || 'Continuing Your Guided Learning Path'}**:\n\n${turn.next_subtopic_explanation}`);
    }
    if (turn.math_payload) {
        lines.push(`$$${turn.math_payload}$$`);
    }
    if (turn.probe_question) {
        lines.push(`**Guided Learning Check**: ${turn.probe_question}`);
    }
    return lines.join('\n\n');
}

module.exports = {
    TOPIC_PROGRESSION_ORDER,
    DSP_TOPICS_CATALOG,
    DSP_MISCONCEPTIONS,
    getNextDSPTopicProfile,
    resolveDSPTopicProfile,
    checkDSPMisconception,
    checkDSPMastery,
    buildGeminiThinkingTrace,
    generateStructuredTurn,
    formatTurnAsText
};
