/**
 * tests/unit/intelligentRouterService.test.js
 * 
 * Unit tests for intelligentRouterService.js.
 */

const {
    TASK_TYPES,
    COMPLEXITY_LEVELS,
    classifyTaskType,
    estimateComplexity,
    scoreProvider,
    selectBestProvider,
    getIntelligentRoutingDecision
} = require('../../server/services/intelligentRouterService');

describe('Intelligent Router Service Unit Tests', () => {

    // ─── TASK CLASSIFICATION TESTS ──────────────────────────────────────────
    describe('classifyTaskType()', () => {
        it('should classify coding queries as coding_tasks', () => {
            const queries = [
                'write a binary search in js',
                'find the bug in this python function:\n```def x(): pass```',
                'explain React useEffect Hook lifecycle'
            ];
            queries.forEach(q => {
                expect(classifyTaskType(q)).toBe(TASK_TYPES.CODING_TASK);
            });
        });

        it('should classify mathematical complexity as math_reasoning', () => {
            const queries = [
                'solve differential equation y\' + y = 0',
                'compute eigenvalue of matrix [[1,2],[3,4]]',
                'what is the sum of infinite geometric series'
            ];
            queries.forEach(q => {
                expect(classifyTaskType(q)).toBe(TASK_TYPES.MATH_REASONING);
            });
        });

        it('should classify long synthesis calls as research_deep_dive', () => {
            const longQuery = 'analyze the comparative advantages of monolithic versus microservices architectures in enterprise banking applications including scalability, transactions, and security policies. ' + 'word '.repeat(100);
            expect(classifyTaskType(longQuery)).toBe(TASK_TYPES.RESEARCH_DEEP_DIVE);
        });

        it('should classify short general inputs as simple_conversation', () => {
            expect(classifyTaskType('hello')).toBe(TASK_TYPES.SIMPLE_CONVERSATION);
            expect(classifyTaskType('how is the weather?')).toBe(TASK_TYPES.SIMPLE_CONVERSATION);
        });
    });

    // ─── COMPLEXITY ESTIMATION TESTS ────────────────────────────────────────
    describe('estimateComplexity()', () => {
        it('should estimate short simple conversations as low complexity', () => {
            const est = estimateComplexity('hi');
            expect(est.level).toBe(COMPLEXITY_LEVELS.LOW);
            expect(est.score).toBeLessThan(30);
            expect(est.reasoningDepth).toBe('shallow');
        });

        it('should estimate coding and complex prompts as high/medium complexity', () => {
            const est = estimateComplexity('write an interface representing neural network training loops for TensorFlow in Python');
            expect([COMPLEXITY_LEVELS.MEDIUM, COMPLEXITY_LEVELS.HIGH]).toContain(est.level);
            expect(est.score).toBeGreaterThan(40);
        });
    });

    // ─── PROVIDER SCORING TESTS ─────────────────────────────────────────────
    describe('scoreProvider()', () => {
        const modelRequirements = {
            minContextWindow: 8192,
            type: TASK_TYPES.CODING_TASK
        };

        const providerHealth = {
            sglang: { ratio: 1.0, latencyMs: 200, errorRate: 0 },
            groq: { ratio: 0.95, latencyMs: 300, errorRate: 0.01 },
            gemini: { ratio: 0.99, latencyMs: 800, errorRate: 0 },
            ollama: { ratio: 0.5, latencyMs: 1500, errorRate: 0.2 } // degraded
        };

        it('should rank healthy and fast local serving (sglang) highly for coding tasks', () => {
            const scoreSglang = scoreProvider('sglang', modelRequirements, providerHealth.sglang);
            const scoreOllama = scoreProvider('ollama', modelRequirements, providerHealth.ollama);
            expect(scoreSglang.score).toBeGreaterThan(scoreOllama.score);
        });
    });

    // ─── PROVIDER SELECTION TESTS ───────────────────────────────────────────
    describe('selectBestProvider()', () => {
        it('should choose the highest ranked healthy provider', () => {
            const candidateProviders = ['sglang', 'gemini', 'groq'];
            const providerHealth = {
                sglang: { status: 'healthy', latencyMs: 150, errorRate: 0 },
                gemini: { status: 'healthy', latencyMs: 900, errorRate: 0.05 },
                groq: { status: 'healthy', latencyMs: 350, errorRate: 0 }
            };
            const requirements = { minContextWindow: 2048, type: TASK_TYPES.SIMPLE_CONVERSATION };

            const decision = selectBestProvider(candidateProviders, requirements, providerHealth);
            expect(decision.provider).toBe('sglang'); // Fast, healthy local option
        });

        it('should skip degraded providers and pick available healthy cloud backup', () => {
            const candidateProviders = ['sglang', 'gemini'];
            const providerHealth = {
                sglang: { status: 'degraded', latencyMs: 2500, errorRate: 0.5 },
                gemini: { status: 'healthy', latencyMs: 600, errorRate: 0 }
            };
            const requirements = { minContextWindow: 2048, type: TASK_TYPES.SIMPLE_CONVERSATION };

            const decision = selectBestProvider(candidateProviders, requirements, providerHealth);
            expect(decision.provider).toBe('gemini');
        });
    });

    // ─── ENTIRE ROUTING FLOW TESTS ──────────────────────────────────────────
    describe('getIntelligentRoutingDecision()', () => {
        it('should compile complete metadata and choice maps in standard structure', async () => {
            const context = {
                historyLength: 3,
                latencyBudget: 'high_quality'
            };

            const decision = getIntelligentRoutingDecision('explain structural recursive subtyping in rust compiler', context);
            
            expect(decision).toHaveProperty('taskType');
            expect(decision).toHaveProperty('complexity');
            expect(decision).toHaveProperty('provider');
            expect(decision).toHaveProperty('model');
            expect(decision).toHaveProperty('routingTimeMs');
            expect(decision.providerScore).toBeGreaterThanOrEqual(0);
        });
    });
});
