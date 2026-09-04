/**
 * server/tests/test_student_experience_innovator.js
 * 
 * Comprehensive Unit and Pedagogical Verification Test Suite
 * Tests:
 * 1. 5 Mutually-Exclusive Focus Tracks (STANDARD_BTECH, GATE_ASPIRANT, PLACEMENT_PREP, ENTREPRENEURSHIP, RESEARCHER)
 * 2. Code-as-Visual Scaffolding (Inline SVGs, Mermaid state DAGs, Waveforms, HTML5 sliders)
 * 3. Strict Socratic Formatter with visual code-fence protection
 * 4. Karpathy-style Adaptive Test-Time Compute & Boundary Self-Verification
 */

const assert = require('assert');

const {
    FOCUS_TRACKS,
    FOCUS_TRACK_METADATA,
    normalizeFocusTrack,
    getFocusTrackPromptDecoration
} = require('../services/focusTrackService');

const {
    generateSvgCircuit,
    generateWaveformDiagram,
    generateInteractiveSlider,
    generateMermaidDag
} = require('../services/visualScaffoldService');

const {
    cleanResponse,
    formatSocraticStrict
} = require('../services/socraticTutorStrictFormatter');

const testTimeComputeService = require('../services/testTimeComputeService');

describe('Student Experience & Pedagogy Innovator', () => {
    it('1: Verify all 5 Focus Tracks exist and normalize properly', () => {
        assert.strictEqual(FOCUS_TRACKS.STANDARD_BTECH, 'STANDARD_BTECH');
        assert.strictEqual(FOCUS_TRACKS.GATE_ASPIRANT, 'GATE_ASPIRANT');
        assert.strictEqual(FOCUS_TRACKS.PLACEMENT_PREP, 'PLACEMENT_PREP');
        assert.strictEqual(FOCUS_TRACKS.ENTREPRENEURSHIP, 'ENTREPRENEURSHIP');
        assert.strictEqual(FOCUS_TRACKS.RESEARCHER, 'RESEARCHER');

        assert.strictEqual(normalizeFocusTrack('gate_aspirant'), 'GATE_ASPIRANT');
        assert.strictEqual(normalizeFocusTrack('unknown_track'), 'STANDARD_BTECH');
        assert.strictEqual(normalizeFocusTrack(null), 'STANDARD_BTECH');

        const gatePrompt = getFocusTrackPromptDecoration(FOCUS_TRACKS.GATE_ASPIRANT);
        assert.ok(gatePrompt.includes('GATE ASPIRANT'), 'GATE prompt must specify GATE track');
        assert.ok(gatePrompt.includes('boundary conditions'), 'GATE prompt must include boundary conditions');

        const placementPrompt = getFocusTrackPromptDecoration(FOCUS_TRACKS.PLACEMENT_PREP);
        assert.ok(placementPrompt.includes('Big-O analysis'), 'Placement prompt must emphasize Big-O complexity');

        const researcherPrompt = getFocusTrackPromptDecoration(FOCUS_TRACKS.RESEARCHER);
        assert.ok(researcherPrompt.includes('mathematical proofs'), 'Researcher prompt must emphasize proofs');
    });

    it('2: Verify Code-as-Visual Scaffolding generation', () => {
        const rcCircuit = generateSvgCircuit('RC_LOWPASS', { r: '2.2kΩ', c: '4.7μF' });
        assert.ok(rcCircuit.startsWith('```svg'), 'Must wrap in svg code fence');
        assert.ok(rcCircuit.includes('2.2kΩ'), 'Must inject parameter R');
        assert.ok(rcCircuit.includes('4.7μF'), 'Must inject parameter C');

        const rlcCircuit = generateSvgCircuit('RLC_SERIES', { r: '100Ω', l: '50mH', c: '10μF' });
        assert.ok(rlcCircuit.includes('RLC'), 'Must include RLC series components');

        const waveform = generateWaveformDiagram('STEP_RESPONSE', { tau: '10ms' });
        assert.ok(waveform.includes('```svg'), 'Must produce svg waveform');
        assert.ok(waveform.includes('63.2% V₀'), 'Must show 63.2% exponential threshold');

        const slider = generateInteractiveSlider('RLC Resonance');
        assert.ok(slider.includes('```html'), 'Must produce html slider');
        assert.ok(slider.includes('type="range"'), 'Must have input range slider');

        const dag = generateMermaidDag(['StateA --> StateB', 'StateB --> StateC']);
        assert.ok(dag.includes('```mermaid'), 'Must produce mermaid block');
        assert.ok(dag.includes('StateA --> StateB'), 'Must include edges');
    });

    it('3: Verify Strict Formatter preserves visual code blocks and strips thinking tags', () => {
        const input = `<thinking>Need to explain RLC circuit</thinking>
### Explanation:
An RLC circuit contains a resistor, inductor, and capacitor.

\`\`\`mermaid
flowchart TD
    A[Input Voltage] --> B[RLC Network]
    B --> C[Resonance Peak]
\`\`\`

Here is the key relationship: at resonance, inductive reactance equals capacitive reactance.

What happens to the circuit impedance when the frequency matches the resonant frequency?`;

        const output = formatSocraticStrict(input);

        assert.ok(!output.includes('<thinking>'), 'Must strip <thinking> tags');
        assert.ok(!output.includes('### Explanation:'), 'Must strip meta headers');
        assert.ok(output.includes('```mermaid'), 'Must PRESERVE mermaid code fence');
        assert.ok(output.includes('flowchart TD'), 'Must preserve mermaid body');
        assert.ok(output.endsWith('resonant frequency?'), 'Must preserve final Socratic question');
    });

    it('4: Verify Karpathy-style Test-Time Compute & Self-Verification', () => {
        const rawText = "In this RC circuit, the time constant is given by tau = R / C, which determines decay.";
        const result = testTimeComputeService.verifyEngineeringBoundary('RC circuit', rawText);

        assert.strictEqual(result.isValid, false, 'Should flag invalid tau=R/C formula');
        assert.ok(result.correctedResponse.includes('τ = R · C'), 'Should correct formula to R·C');
        assert.strictEqual(result.corrections.length, 1);

        const rawText2 = "For an inverting op-amp, the closed loop gain = Rf / Rin.";
        const result2 = testTimeComputeService.verifyEngineeringBoundary('inverting op-amp', rawText2);

        assert.strictEqual(result2.isValid, false);
        assert.ok(result2.correctedResponse.includes('gain = -(Rf / Rin)'), 'Should correct negative sign on gain');

        const goodResponse = "The cutoff frequency fc = 1 / (2*pi*R*C).\n```mermaid\nflowchart TD\nA-->B\n```\nWhat is the 3dB point?";
        const conf = testTimeComputeService.computeVerificationConfidence(goodResponse, 'cutoff frequency RC filter 3dB point');
        assert.ok(conf >= 0.8, `Confidence should be high, got ${conf}`);
    });
});
