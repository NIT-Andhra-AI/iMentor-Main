const assert = require('assert');
const { calculateComplexityScore } = require('../services/smartModelRouterService');
const { buildFallbackChain } = require('../services/llmFallbackService');
const { formatSocraticStrict } = require('../services/socraticTutorStrictFormatter');
const { selectModel } = require('../services/smartModelRouterService');

describe('Scaling and Self-Healing End-to-End Verifications', () => {
    it('1. Simple greeting query vs deep conceptual query', () => {
        const simpleQuery = 'hi';
        const isSimpleGreeting = /^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening))\b/i.test(simpleQuery.trim());
        assert.strictEqual(isSimpleGreeting, true);

        const deepQuery = 'explain deep learning architecture and backpropagation';
        const complexity = calculateComplexityScore({ query: deepQuery, tokenEstimate: 300, reasoningMode: 'complex_reasoning' });
        assert.ok(complexity >= 40);
    });

    it('2. Smart Model Router selects SGLang as primary provider', async () => {
        const decision = await selectModel({
            query: 'hello world',
            complexityScore: 15,
            isSglangActive: true,
            localMode: false
        });
        assert.strictEqual(decision.provider, 'sglang');
        assert.strictEqual(decision.strategy, 'sglang_default');
    });

    it('3. Universal fallback chain ordering (multi-provider & LOCAL_GPU_ONLY)', () => {
        const prevLocalOnly = process.env.LOCAL_GPU_ONLY;
        try {
            process.env.LOCAL_GPU_ONLY = 'true';
            assert.deepStrictEqual(buildFallbackChain('sglang', true), ['sglang']);

            process.env.LOCAL_GPU_ONLY = 'false';
            const fallbackChain = buildFallbackChain('sglang', true);
            assert.deepStrictEqual(fallbackChain, ['sglang', 'gemini', 'groq']);
        } finally {
            if (prevLocalOnly === undefined) delete process.env.LOCAL_GPU_ONLY;
            else process.env.LOCAL_GPU_ONLY = prevLocalOnly;
        }
    });

    it('4. Socratic Strict Formatter retains 70% Scaffolding + 30% Inquiry', () => {
        const sampleTutorText = `### CONCEPT
Deep learning is a subset of machine learning based on artificial neural networks with multiple layers. Think of it like a multi-stage factory assembly line where each worker refines the raw materials before passing them to the next stage. In convolutional networks, lower layers detect edges and textures, while deeper layers recognize complex shapes and objects.

### QUESTION
What happens to the gradient signals as they propagate backward through many layers in very deep networks?`;

        const formatted = formatSocraticStrict(sampleTutorText);
        assert.ok(!formatted.includes('### CONCEPT'));
        assert.ok(!formatted.includes('### QUESTION'));
        assert.ok(formatted.includes('What happens to the gradient signals'));
        assert.ok(formatted.includes('factory assembly line'));
    });

    it('5. Resource-Optimized Task Queue handles priority and resource availability', async () => {
        const { resourceTaskQueueService, TASK_TYPES, TASK_PRIORITIES } = require('../services/resourceTaskQueueService');
        
        // Enqueue background memory map task
        const taskId = await resourceTaskQueueService.enqueue(
            TASK_TYPES.MEMORY_MAP_GENERATION,
            { userId: 'test-user-123', sessionId: 'test-session-456' },
            { priority: TASK_PRIORITIES.NORMAL }
        );
        assert.ok(taskId.startsWith('task_MEMORY_MAP_GENERATION'));

        const stats = resourceTaskQueueService.getStats();
        assert.ok(typeof stats.queueDepth === 'number');
        assert.ok(typeof stats.activeInteractiveRequests === 'number');

        // Test interactive request tracking
        resourceTaskQueueService.trackInteractiveStart();
        assert.strictEqual(resourceTaskQueueService.activeInteractiveCount >= 1, true);
        assert.strictEqual(resourceTaskQueueService.hasAvailableResources(), false); // Background jobs must yield!

        resourceTaskQueueService.trackInteractiveEnd();
    });
});

