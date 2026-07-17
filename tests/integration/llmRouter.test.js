/**
 * tests/integration/llmRouter.test.js
 * 
 * Integration tests for llmRouterService and llmFallbackService.
 */

// ─── SETUP MOCKS BEFORE REQUIRING SERVICES ──────────────────────────────
const mockModels = [
    { modelId: 'deepseek-r1-distill-qwen-14b', provider: 'ollama', strengths: ['code', 'reasoning'], maxContextWindow: 16384 },
    { modelId: 'llama3-70b-8192', provider: 'groq', strengths: ['code', 'general'], maxContextWindow: 8192 },
    { modelId: 'gemini-1.5-pro', provider: 'gemini', strengths: ['reasoning', 'research'], maxContextWindow: 1048576 }
];

jest.mock('../../server/models/LLMConfiguration', () => {
    return {
        find: jest.fn().mockImplementation(() => ({
            lean: jest.fn().mockResolvedValue(mockModels)
        })),
        findOne: jest.fn().mockImplementation((query) => ({
            lean: jest.fn().mockResolvedValue(mockModels.find(m => m.modelId === query.modelId))
        }))
    };
});

jest.mock('../../server/models/User', () => {
    return {
        findById: jest.fn().mockImplementation((id) => ({
            lean: jest.fn().mockResolvedValue({
                _id: id,
                modelRoutingMode: 'auto',
                preferredLlmProvider: 'ollama',
                ollamaUrl: 'http://localhost:11434'
            })
        }))
    };
});

// Mock Redis Client
jest.mock('../../server/config/redisClient', () => {
    const store = new Map();
    return {
        redisClient: {
            isOpen: true,
            get: jest.fn().mockImplementation(async (key) => store.get(key) || null),
            set: jest.fn().mockImplementation(async (key, val) => {
                store.set(key, val);
                return 'OK';
            })
        }
    };
});

// Mock Ollama Health
const mockCheckOllamaHealth = jest.fn().mockResolvedValue(true);
jest.mock('../../server/services/ollamaHealthService', () => ({
    checkOllamaHealth: (url) => mockCheckOllamaHealth(url)
}));

// Mock Streaming/LLM Providers
jest.mock('../../server/services/ollamaService', () => ({
    streamChat: jest.fn().mockImplementation((hist, q, sys, opts, onT) => {
        onT("hello from local ollama");
        return Promise.resolve("hello from local ollama");
    }),
    generateContentWithHistory: jest.fn().mockResolvedValue("hello from local ollama")
}));

jest.mock('../../server/services/geminiService', () => ({
    generateContentWithHistory: jest.fn().mockResolvedValue("hello from gemini")
}));

jest.mock('../../server/services/llmStreamingService', () => ({
    streamCompletion: jest.fn().mockImplementation(({ onToken }) => {
        onToken({ type: 'token', content: 'hello from streaming cloud fallback' });
        return Promise.resolve('hello from streaming cloud fallback');
    })
}));

// Require target modules
const { selectLLM, LLMRouter, refreshCatalog } = require('../../server/services/llmRouterService');
const { buildFallbackChain } = require('../../server/services/llmFallbackService');

describe('LLM Router and Fallback Chain Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCheckOllamaHealth.mockResolvedValue(true);
        process.env.GROQ_API_KEY = 'mock_groq';
        process.env.GEMINI_API_KEY = 'mock_gemini';
    });

    // ─── CATALOG LOAD ───────────────────────────────────────────────────────
    it('should pre-load and cache the LLM configurations correctly', async () => {
        await refreshCatalog();
        const { chosenModel } = await selectLLM('write search algorithm', { userId: 'user123' });
        expect(chosenModel).toBeDefined();
        expect(chosenModel.modelId).toBeDefined();
    });

    // ─── ROUTING INTEGRATION ────────────────────────────────────────────────
    it('should route dynamically to local Ollama if healthy', async () => {
        mockCheckOllamaHealth.mockResolvedValue(true);
        const result = await selectLLM('quick question', { userId: 'user123' });
        expect(result.chosenModel.provider).toBe('ollama');
        expect(result.chosenModel.workingUrl).toContain('11434');
    });

    it('should fallback to cloud providers when Ollama is unhealthy', async () => {
        // Mock health check failing
        mockCheckOllamaHealth.mockResolvedValue(false);
        const result = await selectLLM('quick question', { userId: 'user123' });
        expect(['groq', 'gemini']).toContain(result.chosenModel.provider);
    });

    // ─── GENERATION AND STREAMING FLOWS ─────────────────────────────────────
    it('should stream generated tokens to caller from chosen model', async () => {
        mockCheckOllamaHealth.mockResolvedValue(true);
        const tokens = [];
        const onToken = (tkObj) => {
            const tk = typeof tkObj === 'string' ? tkObj : tkObj.content;
            tokens.push(tk);
        };

        await LLMRouter.generate({
            query: 'implement bubble sort',
            userId: 'user123',
            onToken
        });

        expect(tokens.join('')).toContain('hello from local ollama');
    });

    // ─── FALLBACK CHAINS ────────────────────────────────────────────────────
    describe('Fallback Chain Builder', () => {
        it('should correctly prioritize local provider when preferLocalFirst choice is active', () => {
            const apiKeys = { groq: 'somekey', gemini: 'somekey' };
            const chain = buildFallbackChain({
                preferredProvider: 'ollama',
                preferLocalFirst: true,
                isOllamaUp: true,
                userApiKeys: apiKeys
            });

            expect(chain[0]).toBe('ollama');
            expect(chain.slice(1)).toContain('groq');
            expect(chain.slice(1)).toContain('gemini');
        });

        it('should prioritize cloud providers first if local mode is inactive', () => {
            const apiKeys = { groq: 'somekey', gemini: 'somekey' };
            const chain = buildFallbackChain({
                preferredProvider: 'groq',
                preferLocalFirst: false,
                isOllamaUp: true,
                userApiKeys: apiKeys
            });

            expect(chain[0]).toBe('groq');
            expect(chain.slice(1)).toContain('gemini');
        });
    });
});
