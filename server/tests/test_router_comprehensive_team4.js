// server/tests/test_router_comprehensive_team4.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Global test variables
const reportPath = 'N:\\Imentor-Tet report.txt';
const resultsBuffer = [];

function logReport(text) {
    console.log(text);
    resultsBuffer.push(text);
}

logReport('========================================================================');
logReport('               iMentor Platform - Routing & Fallback System             ');
logReport('                        Comprehensive Team-4 Report                      ');
logReport('========================================================================\n');

// Mock memory states to control behavior in tests dynamically
const mockState = {
    ollamaHealthy: true,
    sglangHealthy: true,
    geminiApiKeyPresent: true,
    groqApiKeyPresent: true,
    redisEnabled: true,
    redisStore: {},
    routingCacheStore: {},
    classificationResult: { category: 'chat', confidence: 0.9, strength: 'chat' },
    sglangCallShouldFail: false,
    ollamaCallShouldFail: false,
    groqCallShouldFail: false,
    geminiCallShouldFail: false,
};

// -------------------------------------------------------------
// Pre-populating require.cache with Mocks to isolate Routing
// -------------------------------------------------------------

// Mock logger
require.cache[require.resolve('../utils/logger')] = {
    id: require.resolve('../utils/logger'),
    exports: {
        info: () => {},
        warn: () => {},
        error: () => {},
        success: () => {}
    },
    filename: require.resolve('../utils/logger'),
    loaded: true
};

// Mock axios for direct SGLang REST calls
require.cache[require.resolve('axios')] = {
    id: require.resolve('axios'),
    exports: {
        post: async (url, data, options) => {
            if (mockState.sglangCallShouldFail) {
                throw new Error('Mocked SGLang REST Connection Refused');
            }
            if (url.includes('/chat/completions')) {
                return {
                    data: {
                        choices: [
                            { message: { content: 'Mocked SGLang direct REST success w/' } }
                        ]
                    }
                };
            }
            return { data: {} };
        },
        get: async (url, options) => {
            if (url.includes('/get_server_info')) {
                if (mockState.sglangHealthy) {
                    return { data: { status: 'healthy' } };
                } else {
                    throw new Error('SGLang server info failed');
                }
            }
            return { data: {} };
        }
    },
    filename: require.resolve('axios'),
    loaded: true
};

// Mock LLMConfiguration mongoose model
const mockLLMConfiguration = {
    find: () => ({
        lean: () => Promise.resolve([
            { modelId: 'gemini-2.0-flash', provider: 'gemini', displayName: 'Gemini 2.0 Flash', isDefault: true, strengths: ['general', 'chat'] },
            { modelId: 'llama-3.1-8b-instant', provider: 'groq', displayName: 'Groq Llama 3.1 8B', isDefault: true, strengths: ['chat', 'speed'] },
            { modelId: 'qwen3.5:9b', provider: 'ollama', displayName: 'Ollama Qwen 3.5 9B', isDefault: true, strengths: ['general', 'chat'] },
            { modelId: 'ai-tutor-custom:latest', provider: 'ollama', displayName: 'Custom Tutor Model', isDefault: false, strengths: ['tutor'] },
        ])
    }),
    findOne: (filter) => ({
        lean: () => {
            const list = [
                { modelId: 'gemini-2.0-flash', provider: 'gemini', displayName: 'Gemini 2.0 Flash', isDefault: true, strengths: ['general', 'chat'] },
                { modelId: 'llama-3.1-8b-instant', provider: 'groq', displayName: 'Groq Llama 3.1 8B', isDefault: true, strengths: ['chat', 'speed'] },
                { modelId: 'qwen3.5:9b', provider: 'ollama', displayName: 'Ollama Qwen 3.5 9B', isDefault: true, strengths: ['general', 'chat'] },
                { modelId: 'ai-tutor-custom:latest', provider: 'ollama', displayName: 'Custom Tutor Model', isDefault: false, strengths: ['tutor'] },
            ];
            const found = list.find(m => m.modelId === filter.modelId || m.provider === filter.provider || (filter.strengths && m.strengths.includes(filter.strengths)));
            return Promise.resolve(found || null);
        }
    })
};
require.cache[require.resolve('../models/LLMConfiguration')] = {
    id: require.resolve('../models/LLMConfiguration'),
    exports: mockLLMConfiguration,
    filename: require.resolve('../models/LLMConfiguration'),
    loaded: true
};

// Mock User mongoose model
const mockUser = {
    findById: (id) => ({
        lean: () => Promise.resolve({
            _id: id,
            modelRoutingMode: 'auto',
            preferredLlmProvider: 'ollama',
            ollamaUrl: 'http://localhost:11434'
        })
    })
};
require.cache[require.resolve('../models/User')] = {
    id: require.resolve('../models/User'),
    exports: mockUser,
    filename: require.resolve('../models/User'),
    loaded: true
};

// Mock CourseAdapterMapping mongoose model
const mockCourseAdapterMapping = {
    findOne: () => ({
        lean: () => Promise.resolve(null)
    })
};
require.cache[require.resolve('../models/CourseAdapterMapping')] = {
    id: require.resolve('../models/CourseAdapterMapping'),
    exports: mockCourseAdapterMapping,
    filename: require.resolve('../models/CourseAdapterMapping'),
    loaded: true
};

// Mock redisClient
require.cache[require.resolve('../config/redisClient')] = {
    id: require.resolve('../config/redisClient'),
    exports: {
        redisClient: {
            get isOpen() { return mockState.redisEnabled; },
            get: async (key) => mockState.redisStore[key] || null,
            setEx: async (key, ttl, value) => { mockState.redisStore[key] = value; }
        }
    },
    filename: require.resolve('../config/redisClient'),
    loaded: true
};

// Mock sglangCapabilities
require.cache[require.resolve('../services/sglangCapabilities')] = {
    id: require.resolve('../services/sglangCapabilities'),
    exports: {
        getModelMaxContext: () => 8192
    },
    filename: require.resolve('../services/sglangCapabilities'),
    loaded: true
};

// Mock ollamaHealthService
require.cache[require.resolve('../services/ollamaHealthService')] = {
    id: require.resolve('../services/ollamaHealthService'),
    exports: {
        checkOllamaHealth: async () => mockState.ollamaHealthy
    },
    filename: require.resolve('../services/ollamaHealthService'),
    loaded: true
};

// Mock queryClassifierService
require.cache[require.resolve('../services/queryClassifierService')] = {
    id: require.resolve('../services/queryClassifierService'),
    exports: {
        classifyQuery: async () => mockState.classificationResult
    },
    filename: require.resolve('../services/queryClassifierService'),
    loaded: true
};

// Mock providerPriorityService
require.cache[require.resolve('../services/providerPriorityService')] = {
    id: require.resolve('../services/providerPriorityService'),
    exports: {
        resolveProviderByPreference: async ({ preferredProvider }) => ({
            chosenProvider: preferredProvider,
            workingOllamaUrl: preferredProvider === 'ollama' ? 'http://localhost:11434' : null
        })
    },
    filename: require.resolve('../services/providerPriorityService'),
    loaded: true
};

// Mock routingCacheService
require.cache[require.resolve('../services/routingCacheService')] = {
    id: require.resolve('../services/routingCacheService'),
    exports: {
        getCachedRoutingDecision: async (key) => mockState.routingCacheStore[key] || null,
        cacheRoutingDecision: async (key, val) => { mockState.routingCacheStore[key] = val; }
    },
    filename: require.resolve('../services/routingCacheService'),
    loaded: true
};

// Mock provider services (geminiService, ollamaService, sglangService, groqService)
const mockGeminiService = {
    generateContentWithHistory: async () => {
        if (mockState.geminiCallShouldFail) throw new Error('Gemini service error');
        return 'Mocked Gemini success';
    }
};
require.cache[require.resolve('../services/geminiService')] = {
    id: require.resolve('../services/geminiService'),
    exports: mockGeminiService,
    filename: require.resolve('../services/geminiService'),
    loaded: true
};

const mockOllamaService = {
    generateContentWithHistory: async () => {
        if (mockState.ollamaCallShouldFail) throw new Error('Ollama service error');
        return 'Mocked Ollama success';
    },
    streamChat: async (chatHistory, userQuery, systemPrompt, options, onToken) => {
        if (mockState.ollamaCallShouldFail) throw new Error('Ollama stream error');
        onToken('Mocked ');
        onToken('Ollama ');
        onToken('Stream');
        return 'Mocked Ollama Stream';
    }
};
require.cache[require.resolve('../services/ollamaService')] = {
    id: require.resolve('../services/ollamaService'),
    exports: mockOllamaService,
    filename: require.resolve('../services/ollamaService'),
    loaded: true
};

const mockSglangService = {
    checkHealth: async () => mockState.sglangHealthy,
    generateContentWithHistory: async () => {
        if (mockState.sglangCallShouldFail) throw new Error('SGLang service error');
        return 'Mocked SGLang success';
    }
};
require.cache[require.resolve('../services/sglangService')] = {
    id: require.resolve('../services/sglangService'),
    exports: mockSglangService,
    filename: require.resolve('../services/sglangService'),
    loaded: true
};

const mockGroqService = {
    generateContentWithHistory: async () => {
        if (mockState.groqCallShouldFail) throw new Error('Groq service error');
        return 'Mocked Groq success';
    }
};
require.cache[require.resolve('../services/groqService')] = {
    id: require.resolve('../services/groqService'),
    exports: mockGroqService,
    filename: require.resolve('../services/groqService'),
    loaded: true
};

const mockLlmStreamingService = {
    streamCompletion: async ({ onToken }) => {
        onToken({ type: 'token', content: 'Mocked ' });
        onToken({ type: 'token', content: 'Streaming ' });
        onToken({ type: 'token', content: 'Fallback' });
        return 'Mocked Streaming Fallback';
    }
};
require.cache[require.resolve('../services/llmStreamingService')] = {
    id: require.resolve('../services/llmStreamingService'),
    exports: mockLlmStreamingService,
    filename: require.resolve('../services/llmStreamingService'),
    loaded: true
};

// Load modules being tested
const { calculateComplexityScore, tuneParameters, selectModel } = require('../services/smartModelRouterService');
const { selectLLM } = require('../services/llmRouterService');
const { callWithFallback, isThinkingModel, separateThinking, buildFallbackChain } = require('../services/llmFallbackService');
const { truncateContextToWindow } = require('../utils/tokenOptimizer');

let totalTests = 0;
let passedTests = 0;
const tests = [];

function addTest(name, fn) {
    tests.push({ name, fn, isAsync: false });
}

function addAsyncTest(name, fn) {
    tests.push({ name, fn, isAsync: true });
}

// -------------------------------------------------------------
// Test Section 1: Complexity Scoring Helper & Boundary Inputs
// -------------------------------------------------------------
addTest('Complexity Score - Default empty values', () => {
    const score = calculateComplexityScore({});
    assert.strictEqual(score, 0, 'Empty parameters should result in complexity of 0');
});

addTest('Complexity Score - Long prompt scaling', () => {
    const scoreText = calculateComplexityScore({ query: 'hello', tokenEstimate: 500 });
    assert.strictEqual(scoreText, 25, 'Score should reflect token count divided by 20');
    
    const capScore = calculateComplexityScore({ query: 'hello', tokenEstimate: 10000 });
    assert.strictEqual(capScore, 100, 'Score must cap at 100');
});

addTest('Complexity Score - Math + Code triggers', () => {
    const scoreMathCode = calculateComplexityScore({
        query: 'solve eigenvalue, import numpy as np, def solution()',
        reasoningMode: 'standard'
    });
    assert.strictEqual(scoreMathCode, 3);
});

addTest('Complexity Score - Reasoning mode increments', () => {
    const complexRes = calculateComplexityScore({ query: 'hello', reasoningMode: 'complex_reasoning' });
    assert.strictEqual(complexRes, 20, 'complex_reasoning adds 20 to score');

    const deepRes = calculateComplexityScore({ query: 'hello', reasoningMode: 'deep_research' });
    assert.strictEqual(deepRes, 35, 'deep_research adds 35 to score');
});

// -------------------------------------------------------------
// Test Section 2: Model Parameter Tuning
// -------------------------------------------------------------
addTest('Parameter Tuning - Math / Code queries deterministic temp', () => {
    const paramsMath = tuneParameters({ query: 'differentiation equation solver' });
    assert.strictEqual(paramsMath.temperature, 0.2, 'Math queries must use temperature 0.2');

    const paramsCode = tuneParameters({ query: 'class Node { constructor() {} }' });
    assert.strictEqual(paramsCode.temperature, 0.2, 'Code queries must use temperature 0.2');
});

addTest('Parameter Tuning - Deep Research constraints', () => {
    const paramsDeep = tuneParameters({ reasoningMode: 'deep_research' });
    assert.strictEqual(paramsDeep.temperature, 0.2, 'Deep research temp must be 0.2');
    assert.strictEqual(paramsDeep.maxOutputTokens, 8192, 'Deep research maxOutputTokens must be 8192');
});

addTest('Parameter Tuning - Complex Reasoning vs High Complexity', () => {
    const paramsComplex = tuneParameters({ reasoningMode: 'complex_reasoning' });
    assert.strictEqual(paramsComplex.temperature, 0.4, 'Complex reasoning mode temp must be 0.4');

    const paramsHighComplexity = tuneParameters({ complexityScore: 75 });
    assert.strictEqual(paramsHighComplexity.temperature, 0.4, 'Score >= 70 must trigger temperature 0.4');
});

// -------------------------------------------------------------
// Test Section 3: Smart Model Router (`selectModel`)
// -------------------------------------------------------------
addAsyncTest('selectModel - Local Mode Ollama bypass', async () => {
    process.env.GROQ_API_KEY = 'mock_groq_key';
    const decision = await selectModel({
        query: 'write me code',
        complexityScore: 80,
        localMode: true,
        isOllamaActive: true,
        catalog: []
    });
    assert.strictEqual(decision.provider, 'ollama');
    assert.strictEqual(decision.strategy, 'local_mode_ollama');
});

addAsyncTest('selectModel - Hybrid complex query shift to Cloud (Groq/Gemini)', async () => {
    process.env.GROQ_API_KEY = 'mock_groq_key';
    process.env.GEMINI_API_KEY = 'mock_gemini_key';
    
    const decision = await selectModel({
        query: 'complex query analytics',
        complexityScore: 85,
        tokenEstimate: 500,
        isOllamaActive: true,
    });
    assert.strictEqual(decision.provider, 'groq');
    assert.strictEqual(decision.strategy, 'high_complexity_hybrid_cloud_fallback');
    
    const decisionGemini = await selectModel({
        query: 'complex query analytics',
        complexityScore: 85,
        tokenEstimate: 6000,
        isOllamaActive: true,
    });
    assert.strictEqual(decisionGemini.provider, 'gemini');
});

addAsyncTest('selectModel - Default fallback budget strategy', async () => {
    process.env.GROQ_API_KEY = '';
    process.env.GEMINI_API_KEY = '';
    
    const decision = await selectModel({
        query: 'simple hello',
        complexityScore: 10,
        isOllamaActive: false
    });
    assert.strictEqual(decision.provider, 'ollama');
    assert.strictEqual(decision.strategy, 'simple_query_groq_fallback');
});

// -------------------------------------------------------------
// Test Section 4: History Truncation (tokenOptimizer.js)
// -------------------------------------------------------------
addTest('History Truncation - Preserves system message and final user prompt', () => {
    const list = [
        { role: 'system', content: 'System instruction' },
        { role: 'user', content: 'Turn 1 User' },
        { role: 'model', content: 'Turn 1 Assistant' },
        { role: 'user', content: 'Turn 2 User' },
        { role: 'model', content: 'Turn 2 Assistant' },
        { role: 'user', content: 'Final User Prompt' }
    ];

    const truncated = truncateContextToWindow(list, 50);
    
    assert.strictEqual(truncated[0].role, 'system', 'First message must be system');
    assert.strictEqual(truncated[truncated.length - 1].content, 'Final User Prompt', 'Last message must be the final prompt');
    
    const totalLen = truncated.reduce((acc, m) => acc + m.content.length, 0);
    assert.ok(totalLen <= 50, `Length ${totalLen} must be <= 50`);
});

// -------------------------------------------------------------
// Test Section 5: Universal Fallback Chain Processing
// -------------------------------------------------------------
addTest('Fallback chain priority resolver list', () => {
    const chainL = buildFallbackChain('sglang', true);
    assert.deepStrictEqual(chainL, ['sglang', 'groq', 'gemini']);

    const chainC = buildFallbackChain('gemini', false);
    assert.deepStrictEqual(chainC, ['gemini', 'groq', 'sglang']);
});

addTest('Thinking Model Detection', () => {
    assert.ok(isThinkingModel('deepseek-r1-distill'), 'deepseek-r1 contains r1 thinking signal');
    assert.ok(isThinkingModel('qwen3-7b'), 'qwen3 is thinking pattern');
    assert.ok(!isThinkingModel('gemini-2.0-flash'), 'gemini flash is standard response pattern');
});

addTest('Separation of <thinking> tags', () => {
    const sample = '<thinking>I need to answer the user query.</thinking>Successful outcome content.';
    const parsed = separateThinking(sample);
    assert.strictEqual(parsed.thinking, 'I need to answer the user query.');
    assert.strictEqual(parsed.content, 'Successful outcome content.');
});

addAsyncTest('callWithFallback - Success cascade if preferred fails', async () => {
    mockState.sglangCallShouldFail = true; 
    mockState.groqCallShouldFail = false;    
    mockState.geminiCallShouldFail = false;

    process.env.GROQ_API_KEY = 'mock_key';
    const result = await callWithFallback({
        userQuery: 'test query',
        preferredProvider: 'sglang',
        userApiKeys: { groq: 'mock_key' }
    });

    assert.strictEqual(result.provider, 'groq', 'Should cascade to successful groq service');
    assert.ok(result.text.includes('Mocked Groq success'), 'Fallback result carries Groq output');
    assert.strictEqual(result.wasFailover, true, 'Failover flag should be true');
});

// -------------------------------------------------------------
// Test Section 6: Concurrency Limitation
// -------------------------------------------------------------
addAsyncTest('Provider limiter bottleneck overflow handling', async () => {
    mockState.sglangCallShouldFail = false;
    mockState.sglangHealthy = true;
    process.env.SGLANG_ENABLED = 'true';

    const calls = [];
    for (let i = 0; i < 15; i++) {
        calls.push(callWithFallback({
            userQuery: `query ${i}`,
            preferredProvider: 'sglang',
        }));
    }
    const results = await Promise.all(calls);
    const successList = results.filter(r => r.provider === 'sglang');
    assert.ok(successList.length > 0, 'SGLang should satisfy some requests');
});

// -------------------------------------------------------------
// Runner
// -------------------------------------------------------------
(async () => {
    logReport(`Executing ${tests.length} tests sequentially...\n`);
    let failedNum = 0;
    
    for (const test of tests) {
        totalTests++;
        try {
            if (test.isAsync) {
                await test.fn();
            } else {
                test.fn();
            }
            passedTests++;
            logReport(`[PASS] ${test.name}`);
        } catch (e) {
            failedNum++;
            logReport(`[FAIL] ${test.name}\n       Error: ${e.message}\n       Stack: ${e.stack}`);
        }
    }
    
    logReport('\n========================================================================');
    logReport(`   Execution Finished: ${passedTests}/${totalTests} Tests Passed successfully.`);
    logReport(`   Failures: ${failedNum}`);
    logReport('========================================================================\n');

    try {
        fs.writeFileSync(reportPath, resultsBuffer.join('\n') + '\n', 'utf8');
        console.log(`Successfully wrote Team-4 report to ${reportPath}`);
    } catch (e) {
        console.error(`Failed to write report: ${e.message}`);
    }

    process.exit(failedNum === 0 ? 0 : 1);
})();
