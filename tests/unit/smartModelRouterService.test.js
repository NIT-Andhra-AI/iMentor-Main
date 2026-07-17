/**
 * tests/unit/smartModelRouterService.test.js
 * 
 * Unit tests for smartModelRouterService.js.
 */

const { 
    calculateComplexityScore, 
    tuneParameters, 
    selectModel 
} = require('../../server/services/smartModelRouterService');

describe('Smart Model Router Service Unit Tests', () => {
    
    // ─── COMPLEXITY SCORING TESTS ──────────────────────────────────────────
    describe('calculateComplexityScore()', () => {
        it('should assign a low score to simple chats', () => {
            const score = calculateComplexityScore({ query: 'hello there' });
            expect(score).toBeLessThanOrEqual(35);
        });

        it('should boost score for programming and code snippet queries', () => {
            const simple = calculateComplexityScore({ query: 'how are you' });
            const coding = calculateComplexityScore({ query: 'implement a class with a binary tree node in Javascript:\n```const x = 5;```' });
            expect(coding).toBeGreaterThan(simple);
        });

        it('should boost score for queries with mathematical concepts', () => {
            const simple = calculateComplexityScore({ query: 'how are you' });
            const math = calculateComplexityScore({ query: 'solve target of integral and matrix eigenvalue decomposition' });
            expect(math).toBeGreaterThan(simple);
        });

        it('should handle empty/null queries gracefully', () => {
            expect(calculateComplexityScore({ query: null })).toBe(0);
            expect(calculateComplexityScore({ query: '' })).toBe(0);
        });
    });

    // ─── PARAMETER TUNING TESTS ─────────────────────────────────────────────
    describe('tuneParameters()', () => {
        it('should tune temperature to 0.2 for coding queries to ensure determinism', () => {
            const params = tuneParameters({ query: 'write code for def my_function()' });
            expect(params.temperature).toBe(0.2);
        });

        it('should use maximum output tokens and low temperature for deep research modes', () => {
            const params = tuneParameters({ query: 'compare the paradigms', reasoningMode: 'deep_research' });
            expect(params.temperature).toBe(0.2);
            expect(params.maxOutputTokens).toBe(8192);
        });

        it('should use default creative temperature (0.7) for standard conversation queries', () => {
            const params = tuneParameters({ query: 'tell me a story about coding' });
            expect(params.temperature).toBe(0.7);
        });
    });

    // ─── ROUTING TO PROVIDERS TESTS ─────────────────────────────────────────
    describe('selectModel()', () => {
        beforeAll(() => {
            process.env.GROQ_API_KEY = 'mock_groq_key';
            process.env.GEMINI_API_KEY = 'mock_gemini_key';
        });

        it('should route to local Ollama default for simple queries when Ollama is active', async () => {
            const decision = await selectModel({
                query: 'hello',
                isOllamaActive: true,
                complexityScore: 20
            });
            expect(decision.provider).toBe('ollama');
            expect(decision.strategy).toBe('ollama_default');
        });

        it('should hybrid-route high complexity cases (score >= 75) to cloud providers even if Ollama is up', async () => {
            const decision = await selectModel({
                query: 'solve matrix decomposition and write optimized code',
                isOllamaActive: true,
                complexityScore: 80
            });
            expect(['groq', 'gemini']).toContain(decision.provider);
            expect(decision.strategy).toBe('high_complexity_hybrid_cloud_fallback');
        });

        it('should fallback to cloud providers if Ollama is inactive', async () => {
            const decision = await selectModel({
                query: 'hello',
                isOllamaActive: false,
                complexityScore: 20
            });
            expect(['groq', 'gemini']).toContain(decision.provider);
            expect(decision.strategy).toBe('simple_query_groq_fallback');
        });
    });
});
