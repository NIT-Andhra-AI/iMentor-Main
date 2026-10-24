/**
 * server/services/agenticPromptAdapter.js
 *
 * Autonomous Agentic Intent, Task & System Prompt Orchestrator for iMentorV2.
 *
 * Dynamically analyzes every incoming user request, classifies its task archetype,
 * automatically grounds it in official university course materials (even when no
 * course dropdown is manually selected), adapts the system prompt to a flagship
 * Gemini / ChatGPT persona, and autonomously triggers the appropriate task pipelines
 * and tools.
 */

const log = require('../utils/logger');
const { safe } = require('../utils/promptSanitizer');
const courseGroundingService = require('./courseGroundingService');

// ============================================================================
// 1. TASK ARCHETYPE DEFINITIONS & GEMINI-GRADE PERSONA PROMPTS
// ============================================================================

const TASK_ARCHETYPES = {
    GUIDED_LEARNING: {
        id: 'GUIDED_LEARNING',
        personaName: 'Gemini Guided Learning Coach',
        description: 'Interactive step-by-step guided learning with competence acknowledgement, re-articulated nudges, hints, and subtopic progression.',
        buildSystemPrompt: (topic, groundingBlock) => `### ACTIVE AGENTIC MODE: GUIDED LEARNING COACH (GEMINI / CHATGPT LEARNING MODE PARITY)
You are **iMentor** operating in **Interactive Guided Learning Mode** for **"${safe(topic || 'Academic Concept')}"**.
Your goal is to guide the student through the topic without causing Q&A mental fatigue.

#### MANDATORY 4-PART GUIDED LEARNING FLOW:
1. **Acknowledge Competence**: Warmly validate what the student already understands, asked well, or got right in their intuition (1-2 sentences).
2. **Re-Articulate & Nudge**: If the student is answering a question, re-articulate their response using clear domain intuition to nudge them in the right direction. If they are starting a new topic, frame the big-picture intuition and physical analogy first.
3. **Clear Teaching Scaffold & Hint (Zero Mental Fatigue)**:
   - Never respond with *only* a question. Always teach a concrete, bite-sized concept (with clean KaTeX math \`$...$\` / \`$$...$$\` or a \`\`\`mermaid\`\`\` diagram with quoted node labels \`A["Label"]\`) and provide a helpful hint toward the checkpoint.
   - If the student answered the previous question **correctly**, affirm mastery and **automatically transition to and clearly explain the next logical subtopic** before asking the next question.
4. **Guided Checkpoint Question**: Conclude with **ONE** focused guided question and 3 interactive multiple-choice hypotheses \`(A) ...\`, \`(B) ...\`, \`(C) ...\` so the student can click or reply effortlessly.
${groundingBlock ? `\n${groundingBlock}\n` : ''}`
    },

    PROBLEM_SOLVING_DERIVATION: {
        id: 'PROBLEM_SOLVING_DERIVATION',
        personaName: 'Gemini Engineering & Mathematical Problem Solver',
        description: 'Rigorous step-by-step mathematical derivation, numerical problem solving, and physical engineering interpretation.',
        buildSystemPrompt: (topic, groundingBlock) => `### ACTIVE AGENTIC MODE: GEMINI ENGINEERING & MATHEMATICAL PROBLEM SOLVER
You are **iMentor**, an elite Engineering & Mathematics Professor solving or deriving **"${safe(topic)}"** with flagship Google Gemini / ChatGPT clarity and rigor.

#### MANDATORY 5-STAGE SOLUTION ARCHITECTURE:
1. **Executive Summary & Problem Formulation**:
   - State the objective or final analytical result upfront in 1-2 crisp sentences.
   - Explicitly list **Given Parameters / Signals** and **Target Unknowns** using clean inline KaTeX (\`$...$\`).
2. **Governing Equations & Theoretical Principle**:
   - Present the foundational governing equation(s) in dedicated display math blocks (\`$$...$$\`).
   - Briefly explain the physical or mathematical meaning of every variable and why this principle applies.
3. **Step-by-Step Analytical Derivation / Calculation**:
   - Execute the derivation or numerical calculation **step by step** using numbered stages (\`### Step 1: ...\`, \`### Step 2: ...\`).
   - Show all intermediate substitutions, limits of summation/integration, Region of Convergence (ROC) conditions, or matrix operations clearly. Never skip algebraic steps.
4. **Final Result & Physical / Engineering Interpretation**:
   - Present the final equation or numerical value clearly highlighted.
   - Explain the **physical significance** (e.g., BIBO stability, causality, frequency selectivity, phase distortion, computational savings, or boundary behavior).
5. **Verification & Next-Step Exploration**:
   - Perform a quick sanity check (e.g., evaluate at $\\omega = 0$, $z = 1$, $t = 0$, or check dimensional consistency).
   - Offer 2-3 tailored follow-up explorations (e.g., *"Would you like to see the Python/MATLAB verification script, explore a harder edge case, or try a practice problem?"*).
${groundingBlock ? `\n${groundingBlock}\n` : ''}`
    },

    CODE_AND_SIMULATION: {
        id: 'CODE_AND_SIMULATION',
        personaName: 'Gemini Senior Software & Simulation Architect',
        description: 'Production-grade code generation, algorithm implementation, DSP/scientific simulation, and complexity analysis.',
        buildSystemPrompt: (topic, groundingBlock) => `### ACTIVE AGENTIC MODE: GEMINI SENIOR SOFTWARE & SIMULATION ARCHITECT
You are **iMentor**, a Principal Software Engineer and Scientific Computing Architect assisting with **"${safe(topic)}"**.

#### MANDATORY RESPONSE STRUCTURE:
1. **Architectural Overview & Algorithmic Intuition**:
   - Start with a concise explanation of the algorithm, design pattern, or numerical simulation strategy and *why* it is the optimal approach.
   - If illustrating an architecture or data pipeline, include a concise \`\`\`mermaid\`\`\` flowchart (\`flowchart LR\` with quoted node labels \`A["Step"]\`).
2. **Complete, Production-Grade Runnable Code**:
   - Provide clean, modular, self-contained, and well-commented code in fenced Markdown blocks with the exact language tag (\`python\`, \`matlab\`, \`c\`, \`cpp\`, \`javascript\`, etc.).
   - Include realistic sample inputs/test drivers so the student can run the code immediately. Never use lazy \`// TODO\` placeholders.
3. **Code-to-Theory Walkthrough**:
   - Connect the critical lines of code directly to the underlying mathematical equations (\`$...$\`) or data-structure invariants.
4. **Complexity & Edge-Case Analysis**:
   - Explicitly state **Time Complexity** $\\mathcal{O}(\\cdot)$ and **Space Complexity** $\\mathcal{O}(\\cdot)$.
   - Highlight practical engineering edge cases (e.g., zero-padding length, numerical precision, off-by-one boundaries, memory allocation).
5. **Expected Output & Verification**:
   - Show the exact expected console output or describe the resulting plot/waveform characteristics.
${groundingBlock ? `\n${groundingBlock}\n` : ''}`
    },

    INTERACTIVE_QUIZ_ASSESSMENT: {
        id: 'INTERACTIVE_QUIZ_ASSESSMENT',
        personaName: 'Gemini Diagnostic Quizmaster & Examiner',
        description: 'Bloom-calibrated interactive practice quizzes, MCQs, hints, and diagnostic rubric explanations.',
        buildSystemPrompt: (topic, groundingBlock) => `### ACTIVE AGENTIC MODE: GEMINI INTERACTIVE DIAGNOSTIC QUIZMASTER
You are **iMentor**, an expert University Examiner and Diagnostic Assessment Coach creating a high-impact practice assessment on **"${safe(topic)}"**.

#### MANDATORY ASSESSMENT STRUCTURE:
1. **Diagnostic Briefing**:
   - Briefly state the core concepts and Bloom's Taxonomy levels (Conceptual Intuition $\\to$ Analytical Application $\\to$ Design/Edge-Cases) covered in this quiz.
2. **Calibrated Questions (3 to 5 Progressive Questions)**:
   - For each question, specify its difficulty badge (e.g., \`[Level 1: Conceptual Intuition]\`, \`[Level 2: Mathematical Application]\`, \`[Level 3: Engineering Design]\`).
   - Provide clear, rigorous question stems using KaTeX math (\`$...$\` / \`$$...$$\`) where appropriate.
   - Include 4 well-crafted options \`(A)\`, \`(B)\`, \`(C)\`, \`(D)\` where distractors target real student misconceptions.
   - Include a brief **Guided Hint** beneath each question.
3. **Interactive Answer Key & Pedagogical Breakdown**:
   - If the student asked for an interactive quiz ("quiz me"), invite them to reply with their choices (e.g., \`1-A, 2-C...\`) so you can grade them and explain each answer, OR provide a clearly separated \`---\` **Answer Key & Conceptual Explanations** section at the bottom explaining *why* the correct option works and *why* common traps fail.
${groundingBlock ? `\n${groundingBlock}\n` : ''}`
    },

    STUDY_PLAN_CURRICULUM: {
        id: 'STUDY_PLAN_CURRICULUM',
        personaName: 'Gemini Academic Curriculum & Roadmap Architect',
        description: 'Structured learning roadmaps, syllabus breakdowns, prerequisite dependency graphs, and milestone schedules.',
        buildSystemPrompt: (topic, groundingBlock) => `### ACTIVE AGENTIC MODE: GEMINI ACADEMIC CURRICULUM & STUDY PLAN ARCHITECT
You are **iMentor**, a Senior Curriculum Designer building an actionable, mastery-oriented learning roadmap for **"${safe(topic)}"**.

#### MANDATORY ROADMAP STRUCTURE:
1. **Executive Learning Strategy**:
   - Define the core learning objective, prerequisite foundations, and target mastery outcome.
2. **Visual Concept Dependency Graph**:
   - Include a clean \`\`\`mermaid\`\`\` diagram (\`flowchart LR\` with quoted node labels \`M1["Module 1: Foundations"] --> M2["Module 2: Core Transforms"]\`) illustrating the optimal progression order.
3. **Structured Phase-by-Phase / Module-by-Module Breakdown**:
   - Organize into clear phases or weeks. For each module include:
     - **Core Subtopics & Mathematical Tools**
     - **Key Intuition to Master**
     - **Hands-On Practice / Simulation Deliverable**
     - **Self-Check Mastery Milestone**
4. **High-Yield Exam & Engineering Pitfalls**:
   - Summarize the top 3 mistakes students make when studying this subject and how to avoid them.
${groundingBlock ? `\n${groundingBlock}\n` : ''}`
    },

    COMPARATIVE_SYNTHESIS: {
        id: 'COMPARATIVE_SYNTHESIS',
        personaName: 'Gemini Comparative Systems & Trade-Off Analyst',
        description: 'Side-by-side technical comparisons, multi-dimensional Markdown tables, mathematical contrasts, and engineering decision matrices.',
        buildSystemPrompt: (topic, groundingBlock) => `### ACTIVE AGENTIC MODE: GEMINI COMPARATIVE SYSTEMS & TRADE-OFF ANALYST
You are **iMentor**, a Senior Systems & Engineering Analyst addressing **"${safe(topic)}"** with flagship Google Gemini clarity, mathematical rigor, and completeness.

#### MANDATORY RESPONSE & COMPARATIVE ARCHITECTURE:
1. **Multi-Part Completeness & Executive Summary (BLUF)**:
   - Open with a crystal-clear 2-sentence Executive Summary answering all parts of the user's request.
   - **CRITICAL COMPLETENESS RULE**: If the user asks about multiple concepts before or alongside the comparison (e.g., explaining Nyquist-Shannon Sampling, Aliasing, and ADC Quantization SQNR *in addition to* comparing DTFT vs. DFT), you MUST dedicate full \`##\` sections with physical intuition, display equations (\`$$...$$\`), derivations, and numerical examples to **EVERY** requested concept before presenting the comparison section!
2. **Physical Intuition, Governing Equations & Derivations for Each Sub-Topic**:
   - For every theorem or mechanism mentioned in the prompt, present:
     - **Physical Analogy & Mental Model** (e.g., strobe/wagon-wheel effect for aliasing; discrete voltage steps $\\Delta = X_{pp}/2^B$ for quantization).
     - **Governing Equations & Step-by-Step Derivation** in clean KaTeX (\`$$...$$\`) with every symbol defined (e.g., $f_s \\ge 2f_{\\max}$, $P_n = \\Delta^2/12$, $\\text{SQNR}_{\\text{dB}} = 6.02B + 1.76\\text{ dB}$, and $+6.02\\text{ dB/bit}$ scaling with a concrete numerical example such as $8\\text{-bit} \\to 10\\text{-bit}$).
3. **Compact Comparison Table (No Cramped Columns)**:
   - Present a clean **3-column Markdown table** (\`| Dimension | Option A | Option B |\`) across **5–6 key dimensions** (*Time Domain*, *Frequency Domain*, *Mathematical Form*, *Periodicity*, *Convolution Property*, *Hardware Computability*).
   - **CRITICAL TABLE RULE**: Keep every cell **concise (6–10 words max per cell)** and never exceed 3–4 columns so the last columns are never cramped or wrapped awkwardly. Place detailed explanations in bullet points outside the table.
4. **Visual Signal Flow & Engineering Decision Guide**:
   - Include a concise \`\`\`mermaid\`\`\` diagram (\`flowchart LR\` with quoted node labels \`A["Analog x(t)"] --> B["Sampler (fs)"]\`) illustrating the signal pipeline or transform relationship.
   - Conclude with crisp bullet points on **When to Choose Which** and a brief **Where to Go Next** prompt.
${groundingBlock ? `\n${groundingBlock}\n` : ''}`
    },

    LIVE_RESEARCH_AND_LITERATURE: {
        id: 'LIVE_RESEARCH_AND_LITERATURE',
        personaName: 'Gemini Deep Research & Literature Synthesizer',
        description: 'Multi-source academic and real-time web research synthesis with inline citations and evidence analysis.',
        buildSystemPrompt: (topic, groundingBlock) => `### ACTIVE AGENTIC MODE: GEMINI RESEARCH & LITERATURE SYNTHESIZER
You are **iMentor**, an expert AI Research Scientist synthesizing scholarly literature and technical evidence on **"${safe(topic)}"**.

#### MANDATORY RESEARCH SYNTHESIS RULES:
1. **Executive Synthesis**: Begin with a high-level synthesis of the state of the art, key findings, or consensus across sources.
2. **Thematic & Methodological Breakdown**: Organize findings by technical theme, methodology, or chronological advancement using clear \`##\` and \`###\` headings.
3. **Comparative Evidence Table**: Where multiple studies, architectures, or approaches are discussed, include a Markdown table comparing their methodology, key findings, and limitations.
4. **Rigorous Citations**: Cite sources inline using bracketed numbers \`[1]\`, \`[2]\` and conclude with a formatted \`## References\` section when search results are provided.
${groundingBlock ? `\n${groundingBlock}\n` : ''}`
    },

    VISUAL_ARCHITECTURE_EXPLANATION: {
        id: 'VISUAL_ARCHITECTURE_EXPLANATION',
        personaName: 'Gemini Flagship Conceptual & Visual Explainer',
        description: 'Deep intuitive explanation combining executive framing, physical analogies, Mermaid visual diagrams, KaTeX math, and worked examples.',
        buildSystemPrompt: (topic, groundingBlock) => `### ACTIVE AGENTIC MODE: GEMINI FLAGSHIP CONCEPTUAL & VISUAL EXPLAINER
You are **iMentor**, a world-class Academic & Engineering AI Tutor explaining **"${safe(topic)}"** with the depth, clarity, and visual polish of Google Gemini and ChatGPT.

#### MANDATORY 6-PART EXPLANATION ARCHITECTURE:
1. **Direct Executive Takeaway**:
   - Start immediately with a crisp, authoritative 1-2 sentence definition and core takeaway so the student grasps the essence right away.
2. **Intuitive Mental Model & Physical Analogy**:
   - Explain *why* this concept exists, what problem it solves, and how to visualize it intuitively using a concrete physical or real-world analogy before introducing heavy equations.
3. **Visual Signal / Architecture Flow (Mermaid Diagram)**:
   - Include a clean, well-structured \`\`\`mermaid\`\`\` diagram (\`flowchart LR\` or \`flowchart TD\`) illustrating the system block diagram, signal flow, or conceptual hierarchy.
   - **Strict Mermaid Rule**: Always wrap node labels containing spaces, parentheses, or brackets in double quotes, e.g., \`A["Input Signal x[n]"] --> B["System H(z)"]\`.
4. **Mathematical & Theoretical Foundation**:
   - Present the governing equations using clean KaTeX (\`$...$\` inline and \`$$...$$\` for display blocks).
   - Define every symbol and explain what each term in the equation physically controls.
5. **Concrete Worked Example & Real-World Engineering Application**:
   - Walk through a concise, concrete numerical or structural example and show where this is used in real systems (e.g., 5G wireless, audio/image compression, radar, biomedical ECG, control systems, or high-performance computing).
6. **Common Misconceptions & Guided Next Steps**:
   - Highlight 1-2 classic pitfalls or misconceptions students often have.
   - End with a brief **"Where to go next"** callout offering 2-3 natural follow-up paths (e.g., step-by-step derivation, Python/MATLAB simulation, or interactive Guided Learning).
${groundingBlock ? `\n${groundingBlock}\n` : ''}`
    }
};

// ============================================================================
// 2. COURSE & TOPIC AUTO-DETECTION (ZERO-LATENCY SYLLABUS / LECTURE MATCHING)
// ============================================================================

const COURSE_KEYWORD_MAP = [
    {
        courseCode: 'EE3621',
        courseTitle: 'Digital Signal Processing',
        keywords: [
            /\b(dsp|digital signal processing|discrete[- ]time|dtft|dft|fft|fast fourier|radix[- ]?[24]|decimation in time|decimation in frequency|dit[- ]?fft|dif[- ]?fft|twiddle factor|butterfly|bit reversal)\b/i,
            /\b(z[- ]?transform|region of convergence|\broc\b|inverse z|partial fraction|poles and zeros|pole[- ]zero|transfer function h\(z\)|bibo stability|difference equation)\b/i,
            /\b(fir\b|iir\b|finite impulse response|infinite impulse response|linear phase|group delay|phase delay|window method|hamming|hanning|blackman|kaiser|gibbs phenomenon|frequency sampling)\b/i,
            /\b(butterworth|chebyshev|bilinear transformation|impulse invariance|frequency warping|pre[- ]?warping|analog prototype|matched z)\b/i,
            /\b(circular convolution|linear convolution|overlap[- ]add|overlap[- ]save|zero[- ]padding|aliasing|nyquist|sampling theorem|sqnr|quantization noise|limit cycle|deadband|direct form|cascade form|parallel form|lattice structure|multirate|decimation|interpolation|polyphase)\b/i
        ],
        topicExtractors: [
            { pattern: /\b(nyquist|sampling|aliasing)\b/i, querySlug: 'Sampling Theorem & Aliasing', noteFile: 'ee3621_l1.md' },
            { pattern: /\b(quantization|finite wordlength|limit cycle|roundoff|sqnr|adc)\b/i, querySlug: 'Finite Wordlength Effects in Digital Filters', noteFile: 'ee3621_l21.md' },
            { pattern: /\b(dtft|discrete[- ]time fourier)\b/i, querySlug: 'Discrete-Time Fourier Transform (DTFT)', noteFile: 'ee3621_l2.md' },
            { pattern: /\b(dft|discrete fourier transform|twiddle)\b/i, querySlug: 'Discrete Fourier Transform (DFT) Fundamentals', noteFile: 'ee3621_l4.md' },
            { pattern: /\b(radix[- ]?2|dit[- ]?fft|decimation[- ]in[- ]time)\b/i, querySlug: 'Radix-2 Decimation-in-Time (DIT) FFT', noteFile: 'ee3621_l5.md' },
            { pattern: /\b(dif[- ]?fft|decimation[- ]in[- ]frequency)\b/i, querySlug: 'Radix-2 Decimation-in-Frequency (DIF) FFT', noteFile: 'ee3621_l6.md' },
            { pattern: /\b(z[- ]?transform|region of convergence|\broc\b)\b/i, querySlug: 'The Z-Transform & Region of Convergence (ROC)', noteFile: 'ee3621_l3.md' },
            { pattern: /\b(fir|window method|hamming|hanning|blackman|kaiser|gibbs|linear phase)\b/i, querySlug: 'FIR Filter Design - Window Method', noteFile: 'ee3621_l10.md' },
            { pattern: /\b(bilinear transformation|frequency warping|pre[- ]?warping|impulse invariance|iir|butterworth|chebyshev)\b/i, querySlug: 'IIR Filter Design & Bilinear Transformation', noteFile: 'ee3621_l14.md' },
            { pattern: /\b(overlap[- ]add|overlap[- ]save|circular convolution|linear convolution)\b/i, querySlug: 'Linear vs Circular Convolution & Fast Convolution', noteFile: 'ee3621_l7.md' },
            { pattern: /\b(direct form|cascade|parallel|realization|filter structure|lattice)\b/i, querySlug: 'Structures for Discrete-Time Systems', noteFile: 'ee3621_l17.md' },
            { pattern: /\b(multirate|decimation|interpolation|downsampling|upsampling|polyphase)\b/i, querySlug: 'Multirate Digital Signal Processing', noteFile: 'ee3621_l25.md' }
        ]
    },
    {
        courseCode: 'EC1521',
        courseTitle: 'Signals and Systems',
        keywords: [
            /\b(signals and systems|continuous[- ]time|lti system|impulse response|step response|dirac delta|fourier series|laplace transform|s[- ]plane|parseval|dirichlet|hilbert transform)\b/i
        ],
        topicExtractors: []
    },
    {
        courseCode: 'EE3601',
        courseTitle: 'Control Systems',
        keywords: [
            /\b(control system|open[- ]loop|closed[- ]loop|feedback control|root locus|bode plot|nyquist plot|routh[- ]hurwitz|gain margin|phase margin|pid controller|lead[- ]lag|state[- ]space|controllability|observability)\b/i
        ],
        topicExtractors: []
    },
    {
        courseCode: 'CS2101',
        courseTitle: 'Data Structures and Algorithms',
        keywords: [
            /\b(binary search tree|avl tree|red[- ]black tree|b[- ]tree|heap sort|merge sort|quick sort|dijkstra|bellman[- ]ford|floyd[- ]warshall|kruskal|prim|dynamic programming|hash table|linked list|graph traversal|bfs|dfs)\b/i
        ],
        topicExtractors: []
    },
    {
        courseCode: 'Machine Learning',
        courseTitle: 'Machine Learning',
        keywords: [
            /\b(gradient descent|backpropagation|support vector machine|\bsvm\b|random forest|decision tree|k[- ]means|principal component analysis|\bpca\b|bias[- ]variance|overfitting|regularization|l1|l2|lasso|ridge|cross[- ]entropy|softmax|attention mechanism|transformer)\b/i
        ],
        topicExtractors: []
    },
    {
        courseCode: 'Operating_Systems',
        courseTitle: 'Operating Systems',
        keywords: [
            /\b(cpu scheduling|round robin|shortest job first|deadlock|banker'?s algorithm|semaphore|mutex|virtual memory|page replacement|lru|tlb|thrashing|inode|context switch|process synchronization)\b/i
        ],
        topicExtractors: []
    }
];

/**
 * Extract clean core topic from a raw user query
 */
function extractCleanTopic(query = '') {
    const cleaned = String(query || '')
        .replace(/^(please\s+)?(can you\s+|could you\s+|would you\s+)?(teach me|help me learn|help me understand|guide me through|walk me through|tutor me on|explain|describe|what is|what are|how does|how do|solve|derive|calculate|compute|prove|write code for|implement|compare|contrast|difference between|quiz me on|test me on|create a study plan for)\s+(about\s+|the\s+)?/i, '')
        .replace(/\?+$/, '')
        .trim();
    return cleaned.length > 2 && cleaned.length <= 100 ? cleaned : String(query || '').trim().substring(0, 80);
}

/**
 * Automatically detect course and resolve official syllabus/lecture grounding
 * even if the user did not manually pick a course in the UI dropdown.
 */
async function autoResolveCourseGrounding(query = '', explicitDocumentContextName = null) {
    const q = String(query || '').trim();
    if (!q || q.length < 4) return null;

    let detectedCourseCode = explicitDocumentContextName || null;
    let detectedCourseTitle = explicitDocumentContextName || null;
    let targetTopic = extractCleanTopic(q);
    const matchedTopics = [];

    for (const entry of COURSE_KEYWORD_MAP) {
        if (entry.keywords.some(rx => rx.test(q))) {
            if (!detectedCourseCode) {
                detectedCourseCode = entry.courseCode;
                detectedCourseTitle = `${entry.courseCode} (${entry.courseTitle})`;
            }
            for (const ex of entry.topicExtractors) {
                if (ex.pattern.test(q)) {
                    matchedTopics.push(ex.querySlug);
                }
            }
            if (matchedTopics.length === 1 && q.length < 65) {
                targetTopic = matchedTopics[0];
            } else if (matchedTopics.length > 1) {
                // Multi-topic query: keep cleanTopic as primary display topic
                targetTopic = extractCleanTopic(q);
            }
            break;
        }
    }

    if (!detectedCourseCode) return null;

    try {
        const topicsToResolve = matchedTopics.length > 0 ? matchedTopics.slice(0, 3) : [targetTopic];
        const groundings = [];
        for (const t of topicsToResolve) {
            const g = await courseGroundingService.resolveCourseGrounding(detectedCourseCode, t, q);
            if (g && g.found) groundings.push(g);
        }
        const primary = groundings[0] || await courseGroundingService.resolveCourseGrounding(detectedCourseCode, targetTopic, q);
        if (primary && primary.found) {
            const isMultiTopic = matchedTopics.length > 1 || q.length >= 65;
            // Keep multi-topic grounding concise (max 900 chars per subtopic) so SGLang TTFT and tok/s remain fast
            const combinedBlocks = Array.from(new Set(groundings.map(g => {
                const blk = g.groundingBlock || '';
                return isMultiTopic ? blk.substring(0, 950) : blk;
            }).filter(Boolean))).join('\n\n');

            // Inject canonical DSP mathematical ground-truth anchors when Sampling/Quantization/DTFT/DFT are queried
            const dspFormulaAnchors = [];
            if (/\b(nyquist|sampling|aliasing)\b/i.test(q)) {
                dspFormulaAnchors.push(`- **Nyquist-Shannon & Aliasing Ground Truth**: Sampling rate must satisfy $f_s \\ge 2f_{\\max}$ (Nyquist rate $= 2f_{\\max}$, Nyquist frequency $= f_s/2$). If $f_0 > f_s/2$, the signal aliases (folds) to apparent frequency $f_{\\text{alias}} = |f_0 - k f_s|$ (or $f_{\\text{alias}} = |f_s - f_0|$ in the first zone)—for example, $f_0 = 10\\text{ kHz}$ sampled at $f_s = 8\\text{ kHz}$ aliases to $|8 - 10| = 2\\text{ kHz}$.`);
            }
            if (/\b(quantization|sqnr|adc)\b/i.test(q)) {
                dspFormulaAnchors.push(`- **ADC Quantization & SQNR Ground Truth**: A $B$-bit uniform ADC has $2^B$ levels, step size $\\Delta = X_{pp}/2^B$, quantization noise power $P_n = \\Delta^2/12$ (assuming uniform error in $[-\\Delta/2, \\Delta/2]$), and $\\text{SQNR}_{\\text{dB}} = 6.02B + 1.76\\text{ dB}$. Each additional bit halves $\\Delta$, reduces $P_n$ by $4\\times$, and improves SQNR by $+6.02\\text{ dB}$ (e.g., $8\\text{-bit} = 49.92\\text{ dB} \\to 10\\text{-bit} = 61.96\\text{ dB}$).`);
            }
            if (/\b(dtft|dft)\b/i.test(q)) {
                dspFormulaAnchors.push(`- **DTFT vs DFT Ground Truth**: Both operate on **discrete-time** sequences $x[n]$! DTFT acts on **discrete, infinite-duration** $x[n]$ and produces a **continuous, $2\\pi$-periodic** spectrum $X(e^{j\\omega}) = \\sum_{n=-\\infty}^{\\infty} x[n]e^{-j\\omega n}$ where multiplication corresponds to **Linear Convolution** ($x[n] * h[n]$). DFT acts on **discrete, finite $N$-point** $x[n]$ and samples the DTFT at $N$ **discrete frequency bins** $\\omega_k = 2\\pi k/N$ ($X[k] = \\sum_{n=0}^{N-1} x[n]e^{-j2\\pi kn/N}$), where multiplication $X[k]H[k]$ corresponds to **$N$-point Circular Convolution** ($x[n] \\circledast_N h[n]$, requiring zero-padding to $N \\ge L+M-1$ for linear convolution).`);
            }
            const anchorHeader = dspFormulaAnchors.length > 0
                ? `### VERIFIED MATHEMATICAL GROUND TRUTH (MUST USE EXACT FORMULAS):\n${dspFormulaAnchors.join('\n')}\n\n`
                : '';

            return {
                courseCode: detectedCourseCode,
                courseTitle: detectedCourseTitle || primary.course,
                topic: isMultiTopic ? targetTopic : (primary.topic || primary.subtopic || targetTopic),
                module: groundings.map(g => g.module).filter(Boolean).join(' + ') || primary.module || '',
                groundingBlock: anchorHeader + (combinedBlocks || primary.groundingBlock || ''),
                groundTruth: groundings.map(g => g.groundTruth).filter(Boolean).join('\n\n') || primary.groundTruth || '',
                hasMcqs: Array.isArray(primary.mcqs) && primary.mcqs.length > 0,
                hasShortAnswers: Array.isArray(primary.shortAnswers) && primary.shortAnswers.length > 0,
                mcqs: (primary.mcqs || []).slice(0, 3),
                shortAnswers: (primary.shortAnswers || []).slice(0, 2),
                source: primary.source
            };
        }
    } catch (err) {
        log.debug('AGENTIC_ADAPTER', `Auto course grounding skipped: ${err.message}`);
    }

    return null;
}

// ============================================================================
// 3. TASK ARCHETYPE CLASSIFIER & AUTONOMOUS ROUTER
// ============================================================================

/**
 * Classify the user query into an Agentic Task Archetype and determine
 * which modes, prompts, and tools should be automatically invoked.
 */
async function adaptRequest(query = '', ctx = {}) {
    const rawQuery = String(query || '').trim();
    const lower = rawQuery.toLowerCase();
    const semanticIntent = ctx.semanticRouting?.intent || null;
    const semanticConf = Number(ctx.semanticRouting?.confidence || 0);

    // 1. Check for trivial greetings first
    const isGreeting = /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening|day)|howdy|sup)\b/i.test(rawQuery) && rawQuery.split(/\s+/).length <= 6;
    if (isGreeting) {
        return {
            taskArchetype: 'GREETING',
            activePersona: 'iMentor Academic Companion',
            confidence: 0.99,
            topic: 'Welcome',
            adaptedSystemPrompt: null,
            autoEnableTutorMode: false,
            autoEnableWebSearch: false,
            autoEnableAcademicSearch: false,
            autoEnableDeepResearch: false,
            autoEnableCodeTip: false,
            autoToolCall: null,
            autoGroundedCourse: null,
            tasksInvoked: ['greeting_fast_path']
        };
    }

    const cleanTopic = extractCleanTopic(rawQuery);

    // 2. Automatically resolve course & syllabus grounding if query touches any academic course topic
    const courseGrounding = await autoResolveCourseGrounding(rawQuery, ctx.documentContextName);
    let groundingBlock = courseGrounding?.groundingBlock || '';

    // 3. Classify Task Archetype based on multi-signal analysis
    let selectedArchetype = TASK_ARCHETYPES.VISUAL_ARCHITECTURE_EXPLANATION;
    let confidence = 0.85;
    const tasksInvoked = ['dynamic_prompt_adaptation'];
    let autoEnableTutorMode = false;
    let autoTutorModeType = null;
    let autoEnableWebSearch = false;
    let autoEnableAcademicSearch = false;
    let autoEnableDeepResearch = false;
    let autoEnableCodeTip = false;
    let autoToolCall = null;

    // Signal A: Explicit Guided Learning / Socratic Study Intent
    const wantsDirectOnly = /\b(just explain|explain fully|full explanation|no questions|just tell me|direct answer|give me the answer|don't ask|do not ask)\b/i.test(rawQuery);
    const isGuidedLearningIntent = !wantsDirectOnly && (
        /\b(teach me|help me learn|guide me through|walk me through|tutor me|let'?s study|step[- ]by[- ]step learning|interactive learning|guided learning|i('m| am) struggling to understand|quiz and teach me)\b/i.test(rawQuery) ||
        lower.startsWith('tutor:') ||
        lower.startsWith('learn ') ||
        (semanticIntent === 'SOCRATIC_TUTORING' && semanticConf >= 0.80)
    );

    // Signal B: Interactive Quiz / Self-Assessment Intent
    const isQuizIntent = /\b(quiz me|test my knowledge|test me on|give me (\d+ )?(practice )?(questions|mcqs|multiple choice)|mock (test|quiz|exam)|practice problems on|check my understanding with questions)\b/i.test(rawQuery);

    // Signal C: Study Plan / Curriculum Roadmap Intent
    const isStudyPlanIntent = /\b(create a study plan|build a study plan|learning roadmap|study schedule|curriculum for|how should i study for|prepare for my exam on|4[- ]week plan|study path)\b/i.test(rawQuery);

    // Signal D: Code / Algorithm / Simulation Intent
    const isCodeIntent = (
        /\b(write (a |the )?(python|matlab|c\+\+|c|java|javascript|js|rust|go|sql|code|script|program|function)|implement (a |an |the )?|simulate .* in (python|matlab|code)|debug this|fix this code|code example for|matplotlib|numpy|scipy\.signal)\b/i.test(rawQuery) ||
        (semanticIntent === 'TECHNICAL_CODING' && semanticConf >= 0.68)
    );

    // Signal E: Mathematical Derivation / Engineering Problem Solving Intent
    const isDerivationOrSolverIntent = (
        /\b(solve|derive|derivation of|prove that|proof of|calculate|compute|find the (z[- ]?transform|inverse z|fourier transform|dtft|dft|fft|laplace|transfer function|impulse response|convolution|poles and zeros|roc|eigenvalues|integral|derivative|differential equation)|design a (butterworth|chebyshev|fir|iir|digital|low[- ]?pass|high[- ]?pass|band[- ]?pass) filter|determine the (stability|nyquist rate|group delay|output y\[n\]))\b/i.test(rawQuery) ||
        (semanticIntent === 'MATHEMATICAL_REASONING' && semanticConf >= 0.70)
    );

    // Signal F: Comparative Analysis / Trade-Off Synthesis Intent
    const isComparativeIntent = /\b(compare|contrast|difference between|differences between|distinguish between|vs\.?|versus|pros and cons of|trade[- ]?offs? between|when to use .* (vs|or|instead of))\b/i.test(rawQuery);

    // Signal G: Live Research / Literature Synthesis Intent
    const isResearchIntent = (
        /\b(find (recent |latest )?(research |academic |scholarly |arxiv )?papers|literature review|systematic review|peer[- ]reviewed|state[- ]of[- ]the[- ]art papers|citations for)\b/i.test(rawQuery) ||
        semanticIntent === 'ACADEMIC_SEARCH' ||
        semanticIntent === 'DEEP_RESEARCH'
    );

    if (ctx.tutorMode || isGuidedLearningIntent) {
        selectedArchetype = TASK_ARCHETYPES.GUIDED_LEARNING;
        confidence = 0.95;
        autoEnableTutorMode = true;
        autoTutorModeType = courseGrounding ? 'structured' : 'general';
        tasksInvoked.push('guided_learning_orchestrator');
    } else if (isQuizIntent) {
        selectedArchetype = TASK_ARCHETYPES.INTERACTIVE_QUIZ_ASSESSMENT;
        confidence = 0.94;
        tasksInvoked.push('diagnostic_quiz_generator');
        if (courseGrounding && (courseGrounding.hasMcqs || courseGrounding.hasShortAnswers)) {
            const qBankSection = [
                courseGrounding.mcqs.length > 0
                    ? `### Verified Course MCQ Bank (Adapt or Include These):\n` +
                      courseGrounding.mcqs.map((q, i) => `${i + 1}. ${q.question}\n   Options: ${(q.options || []).join(' | ')}\n   Correct: ${q.correct_answer || q.answer}\n   Explanation: ${q.explanation || ''}`).join('\n\n')
                    : '',
                courseGrounding.shortAnswers.length > 0
                    ? `### Verified Course Conceptual Questions:\n` +
                      courseGrounding.shortAnswers.map((q, i) => `${i + 1}. ${q.question}\n   Model Answer: ${q.model_answer}`).join('\n\n')
                    : ''
            ].filter(Boolean).join('\n\n');
            groundingBlock = `${groundingBlock}\n\n${qBankSection}`;
            tasksInvoked.push('course_question_bank_injection');
        }
    } else if (isStudyPlanIntent) {
        selectedArchetype = TASK_ARCHETYPES.STUDY_PLAN_CURRICULUM;
        confidence = 0.92;
        tasksInvoked.push('curriculum_roadmap_architect');
    } else if (isCodeIntent) {
        selectedArchetype = TASK_ARCHETYPES.CODE_AND_SIMULATION;
        confidence = 0.93;
        autoEnableCodeTip = true;
        tasksInvoked.push('code_simulation_architect');
    } else if (isDerivationOrSolverIntent) {
        selectedArchetype = TASK_ARCHETYPES.PROBLEM_SOLVING_DERIVATION;
        confidence = 0.92;
        tasksInvoked.push('engineering_math_solver');
    } else if (isComparativeIntent) {
        selectedArchetype = TASK_ARCHETYPES.COMPARATIVE_SYNTHESIS;
        confidence = 0.91;
        tasksInvoked.push('comparative_matrix_synthesizer');
    } else if (isResearchIntent) {
        selectedArchetype = TASK_ARCHETYPES.LIVE_RESEARCH_AND_LITERATURE;
        confidence = 0.90;
        if (!ctx.documentContextName) {
            autoEnableAcademicSearch = true;
        }
        tasksInvoked.push('literature_synthesis_pipeline');
    } else {
        selectedArchetype = TASK_ARCHETYPES.VISUAL_ARCHITECTURE_EXPLANATION;
        confidence = 0.88;
        tasksInvoked.push('multimodal_visual_explainer');
    }

    if (courseGrounding) {
        tasksInvoked.push(`auto_course_grounding:${courseGrounding.courseCode}`);
    }

    const adaptedTaskPrompt = selectedArchetype.buildSystemPrompt(
        courseGrounding?.topic || cleanTopic,
        groundingBlock
    );

    const adaptationMeta = {
        taskArchetype: selectedArchetype.id,
        activePersona: selectedArchetype.personaName,
        description: selectedArchetype.description,
        confidence,
        topic: courseGrounding?.topic || cleanTopic,
        autoGroundedCourse: courseGrounding ? courseGrounding.courseTitle : null,
        autoGroundedModule: courseGrounding?.module || null,
        groundingSource: courseGrounding?.source || null,
        tasksInvoked,
        autoActivatedFlags: {
            tutorMode: autoEnableTutorMode,
            tutorModeType: autoTutorModeType,
            academicSearch: autoEnableAcademicSearch,
            webSearch: autoEnableWebSearch,
            deepResearch: autoEnableDeepResearch,
            codeExecutorTip: autoEnableCodeTip
        }
    };

    log.info(
        'AGENTIC_ADAPTER',
        `[Archetype: ${adaptationMeta.taskArchetype}] Persona="${adaptationMeta.activePersona}" Course="${adaptationMeta.autoGroundedCourse || 'General'}" Tasks=[${tasksInvoked.join(', ')}]`
    );

    return {
        ...adaptationMeta,
        adaptedTaskPrompt,
        autoEnableTutorMode,
        autoTutorModeType,
        autoEnableWebSearch,
        autoEnableAcademicSearch,
        autoEnableDeepResearch,
        autoEnableCodeTip,
        autoToolCall,
        courseGrounding
    };
}

module.exports = {
    TASK_ARCHETYPES,
    extractCleanTopic,
    autoResolveCourseGrounding,
    adaptRequest
};
