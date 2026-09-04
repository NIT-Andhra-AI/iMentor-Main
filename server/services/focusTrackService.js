/**
 * server/services/focusTrackService.js
 * 
 * 5 Mutually-Exclusive Student Focus Tracks Service
 * 
 * Tracks:
 * 1. STANDARD_BTECH (Default): University syllabus mastery, clear concept building, derivation step-by-step, intuitive analogies, exam-oriented practice.
 * 2. GATE_ASPIRANT: Speed tricks, boundary condition edge-cases, rigorous mathematical formulations, previous year GATE question styles, multi-concept integrated problems.
 * 3. PLACEMENT_PREP: Big-O time/space complexity analysis, algorithmic edge cases, system design tradeoffs, leetcode-style constraints, mock interview questioning.
 * 4. ENTREPRENEURSHIP: Real-world technology stack decisions, scalability, unit economics, product architecture, deployment constraints.
 * 5. RESEARCHER: First-principles theoretical proofs, mathematical boundaries, foundational literature references, open research problems, critique and synthesis.
 */

const log = require('../utils/logger');

const FOCUS_TRACKS = {
    STANDARD_BTECH: 'STANDARD_BTECH',
    GATE_ASPIRANT: 'GATE_ASPIRANT',
    PLACEMENT_PREP: 'PLACEMENT_PREP',
    ENTREPRENEURSHIP: 'ENTREPRENEURSHIP',
    RESEARCHER: 'RESEARCHER'
};

const FOCUS_TRACK_METADATA = {
    [FOCUS_TRACKS.STANDARD_BTECH]: {
        name: 'Standard B.Tech Engineering',
        description: 'Comprehensive curriculum mastery, step-by-step derivations, intuitive analogies, and university exam preparation.',
        emphasis: 'Conceptual clarity, textbook derivations, fundamental problem solving',
        questionStyle: 'Curriculum-aligned conceptual and numerical questions with clear steps',
        targetBloomMin: 1,
        targetBloomMax: 4,
        allowVisualAids: true
    },
    [FOCUS_TRACKS.GATE_ASPIRANT]: {
        name: 'GATE Aspirant Track',
        description: 'High-speed problem solving, boundary condition traps, numerical accuracy, and multi-concept synthesis.',
        emphasis: 'Formula shortcuts, trap avoidance, extreme value analysis, standard GATE pattern rigor',
        questionStyle: 'Multiple-Choice (MCQ) and Numerical Answer Type (NAT) style questions with trick boundary cases',
        targetBloomMin: 3,
        targetBloomMax: 5,
        allowVisualAids: true
    },
    [FOCUS_TRACKS.PLACEMENT_PREP]: {
        name: 'Placement & Technical Interview Prep',
        description: 'Algorithmic efficiency, Big-O trade-offs, corner cases, data structures, and system design interviews.',
        emphasis: 'Time/space complexity, edge cases, clean pseudocode, interview communication and defense',
        questionStyle: 'Coding scenarios, constraint-heavy questions, optimization probes, and dry runs',
        targetBloomMin: 3,
        targetBloomMax: 6,
        allowVisualAids: true
    },
    [FOCUS_TRACKS.ENTREPRENEURSHIP]: {
        name: 'Tech Entrepreneurship & Product Architecture',
        description: 'Practical technology stack selection, unit economics, scalability bottlenecks, and engineering trade-offs.',
        emphasis: 'System scalability, cost vs performance, production reliability, MVP architecture',
        questionStyle: 'Architecture scenario analysis, failure mode impact, technology trade-off evaluations',
        targetBloomMin: 4,
        targetBloomMax: 6,
        allowVisualAids: true
    },
    [FOCUS_TRACKS.RESEARCHER]: {
        name: 'Engineering Researcher & Academic Track',
        description: 'Rigorous formal proofs, theoretical boundaries, mathematical foundations, and state-of-the-art literature analysis.',
        emphasis: 'Formal derivations, asymptotic behavior, fundamental limits, open problem formulations',
        questionStyle: 'Proof sketching, theorem boundary verification, counterexample construction, comparative critique',
        targetBloomMin: 4,
        targetBloomMax: 6,
        allowVisualAids: true
    }
};

/**
 * Validates and normalizes focus track string
 */
function normalizeFocusTrack(track) {
    if (!track) return FOCUS_TRACKS.STANDARD_BTECH;
    const upper = String(track).trim().toUpperCase();
    return FOCUS_TRACKS[upper] || FOCUS_TRACKS.STANDARD_BTECH;
}

/**
 * Returns prompt injection block customized for the student's active focus track
 */
function getFocusTrackPromptDecoration(track = FOCUS_TRACKS.STANDARD_BTECH) {
    const activeTrack = normalizeFocusTrack(track);

    switch (activeTrack) {
        case FOCUS_TRACKS.GATE_ASPIRANT:
            return `
=== FOCUS TRACK: GATE ASPIRANT ===
- Calibrate question difficulty and explanations for the GATE examination standard.
- Emphasize boundary conditions, shortcut techniques, formula derivations, and edge cases.
- Highlight common traps where students make sign or unit errors.
- Frame check questions in rigorous technical format (MCQ/NAT style) requiring precision.
`;

        case FOCUS_TRACKS.PLACEMENT_PREP:
            return `
=== FOCUS TRACK: PLACEMENT & INTERVIEW PREP ===
- Focus heavily on algorithmic time/space complexity (Big-O analysis).
- Demand consideration of corner cases (null inputs, empty sets, overflow, negative values).
- Frame check questions like technical interviewers probing trade-offs and code structure.
- Challenge the student to optimize their mental models for performance and scale.
`;

        case FOCUS_TRACKS.ENTREPRENEURSHIP:
            return `
=== FOCUS TRACK: TECH ENTREPRENEURSHIP & ARCHITECTURE ===
- Connect technical concepts to production scalability, unit economics, and architectural resilience.
- Emphasize practical trade-offs (e.g. latency vs consistency, build vs buy, resource cost).
- Ask real-world application questions simulating tech-lead decision making.
`;

        case FOCUS_TRACKS.RESEARCHER:
            return `
=== FOCUS TRACK: RESEARCHER & ADVANCED THEORY ===
- Emphasize first-principles theoretical rigor and mathematical proofs.
- Probe fundamental limitations, asymptotic behaviors, and assumptions behind models.
- Challenge the student to explore boundary violations and formulate hypotheses.
`;

        case FOCUS_TRACKS.STANDARD_BTECH:
        default:
            return `
=== FOCUS TRACK: STANDARD B.TECH ENGINEERING (FOUNDATIONAL) ===
- Focus on comprehensive university syllabus understanding, intuitive real-world analogies, and step-by-step derivations.
- Ensure foundational clarity before increasing complexity.
- Encourage self-explanation and clear conceptual visualization.
`;
    }
}

module.exports = {
    FOCUS_TRACKS,
    FOCUS_TRACK_METADATA,
    normalizeFocusTrack,
    getFocusTrackPromptDecoration
};
