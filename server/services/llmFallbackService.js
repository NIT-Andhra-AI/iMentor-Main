// server/services/llmFallbackService.js
/**
 * Universal LLM Fallback Service
 * 
 * Guarantees a response regardless of provider availability:
 *   1. Respects user preference (local-first or cloud-first)
 *   2. If preferred provider fails → tries full chain automatically
 *   3. Local-first:  sglang → groq → gemini
 *   4. Cloud-first:  gemini → groq → sglang
 *   5. Works for chat, Socratic, tools, research — every call site
 *   6. Supports thinking models (qwen3, gemma3, deepseek-r1) with native think flag
 *   7. [Optimization] Per-provider concurrency control via Bottleneck
 *
 * Usage:
 *   const { callWithFallback, streamWithFallback } = require('./llmFallbackService');
 *   const result = await callWithFallback({ messages, systemPrompt, options, onToken });
 */

const log = require('../utils/logger');
const Bottleneck = require('bottleneck'); // [Optimization] Per-provider concurrency control

// Lazy-load provider services to avoid circular deps
let _gemini, _streaming, _sglang, _groq, _openai, _claude, _anthropic;
function geminiService()    { return _gemini    || (_gemini    = require('./geminiService'));    }
function sglangService()    { return _sglang    || (_sglang    = require('./sglangService'));    }
function groqService()      { return _groq      || (_groq      = require('./groqService'));      }
function openaiService()    { return _openai    || (_openai    = require('./openaiService'));    }
function claudeService()    { return _claude    || (_claude    = require('./claudeService'));    }
function anthropicService() { return _anthropic || (_anthropic = require('./anthropicService')); }
function streamingService() { return _streaming || (_streaming = require('./llmStreamingService')); }

// ─── PER-PROVIDER CONCURRENCY LIMITERS ─────────────────────────────────────
// [Optimization] Prevents concurrent users from hammering the same provider.
// Each provider gets its own limiter. When one provider's queue is full,
// the request overflows to the next provider in the fallback chain.
const LOCAL_GPU_ONLY     = process.env.LOCAL_GPU_ONLY !== 'false';
const CONCURRENCY_SGLANG = parseInt(process.env.LLM_CONCURRENCY_SGLANG, 10) || 50;
const CONCURRENCY_GEMINI = parseInt(process.env.LLM_CONCURRENCY_GEMINI, 10) || 3;
const CONCURRENCY_GROQ   = parseInt(process.env.LLM_CONCURRENCY_GROQ,   10) || 3;
const HIGH_WATER_MARK    = parseInt(process.env.LLM_QUEUE_MAX_DEPTH,     10) || 150;
const QUEUE_WARN_THRESHOLD = 10;

const providerLimiters = {
    sglang: new Bottleneck({
        maxConcurrent: CONCURRENCY_SGLANG,
        highWater: HIGH_WATER_MARK,
        strategy: Bottleneck.strategy.OVERFLOW,
    }),
    gemini: new Bottleneck({
        maxConcurrent: CONCURRENCY_GEMINI,
        highWater: HIGH_WATER_MARK,
        strategy: Bottleneck.strategy.OVERFLOW,
    }),
    groq: new Bottleneck({
        maxConcurrent: CONCURRENCY_GROQ,
        highWater: HIGH_WATER_MARK,
        strategy: Bottleneck.strategy.OVERFLOW,
    }),
};

// Queue depth monitoring — warn when approaching capacity
for (const [name, limiter] of Object.entries(providerLimiters)) {
    limiter.on('queued', () => {
        const queued = limiter.queued();
        if (queued >= QUEUE_WARN_THRESHOLD) {
            log.warn('AI', `[Bottleneck] ${name} queue depth: ${queued}/${HIGH_WATER_MARK} — approaching capacity`);
        }
    });
    limiter.on('dropped', () => {
        log.warn('AI', `[Bottleneck] ${name} queue FULL (${HIGH_WATER_MARK}) — request overflowing to next provider`);
    });
}

// ─── THINKING MODEL DETECTION ──────────────────────────────────────────────
const THINKING_MODEL_PATTERNS = /qwen3|qwq|deepseek.*r1|gemma3|gemma-3/i;

function isThinkingModel(modelId) {
    return THINKING_MODEL_PATTERNS.test(modelId || '');
}

/**
 * Strip <thinking>…</thinking> blocks from final output for clean user-facing text.
 * Returns { thinking, content }.
 */
function separateThinking(text) {
    if (!text || typeof text !== 'string') return { thinking: null, content: text || '' };
    const match = text.match(/<(?:think|thinking)>([\s\S]*?)<\/(?:think|thinking)>/i);
    if (!match) return { thinking: text.thinking || null, content: String(text) };
    return {
        thinking: match[1].trim(),
        content: text.replace(/<(?:think|thinking)>[\s\S]*?<\/(?:think|thinking)>\s*/gi, '').trim(),
    };
}

// ─── SGLANG AVAILABILITY CACHE ─────────────────────────────────────────────
let _sglangHealthy = null;
let _sglangHealthTs = 0;
const SGLANG_HEALTH_CACHE_MS = 60_000; // 1 minute cache

async function isSglangUp() {
    if (process.env.SGLANG_ENABLED === 'false') {
        return false;
    }
    const now = Date.now();
    if (_sglangHealthy !== null && (now - _sglangHealthTs) < SGLANG_HEALTH_CACHE_MS) {
        return _sglangHealthy;
    }
    try {
        const sglangUrl = process.env.SGLANG_CHAT_URL || 'http://localhost:8000/v1';
        const baseUrl = sglangUrl.replace(/\/chat\/completions\/?$/, '');
        const axios = require('axios');
        const modelsUrl = baseUrl.endsWith('/v1') ? `${baseUrl}/models` : `${baseUrl}/v1/models`;
        await axios.get(modelsUrl, { timeout: 1500 });
        _sglangHealthy = true;
        _sglangHealthTs = now;
        return true;
    } catch (e) {
        // Fallback to SDK health check if quick HTTP check fails
        try {
            const healthy = await sglangService().checkHealth('chat');
            _sglangHealthy = healthy;
            _sglangHealthTs = now;
            return healthy;
        } catch (e2) {
            _sglangHealthy = false;
            _sglangHealthTs = now;
            return false;
        }
    }
}

function invalidateSglangHealth() {
    _sglangHealthy = null;
    _sglangHealthTs = 0;
}

// ─── API KEY AVAILABILITY ──────────────────────────────────────────────────
const PLACEHOLDER_KEYS = new Set([
    'your_gemini_api_key',
    'your_groq_api_key_here',
    'your_api_key_here',
    'placeholder',
    '',
]);

function isValidKey(key) {
    return Boolean(key) && !PLACEHOLDER_KEYS.has(key.trim().toLowerCase());
}

function hasApiKey(provider, userKeys = {}) {
    switch (provider) {
        case 'agy':
        case 'gemini': return require('./agyCliService').isAvailable();
        case 'groq':   return isValidKey(userKeys.groq) || isValidKey(process.env.GROQ_API_KEY);
        case 'openai': return isValidKey(userKeys.openai) || isValidKey(process.env.OPENAI_API_KEY);
        case 'ollama': return true;
        case 'sglang': return true;
        default:       return false;
    }
}

function getApiKey(provider, userKeys = {}) {
    switch (provider) {
        case 'agy':
        case 'gemini': return 'agy-cli-local';
        case 'groq':   return isValidKey(userKeys.groq) ? userKeys.groq : (isValidKey(process.env.GROQ_API_KEY) ? process.env.GROQ_API_KEY : null);
        case 'openai': return isValidKey(userKeys.openai) ? userKeys.openai : (isValidKey(process.env.OPENAI_API_KEY) ? process.env.OPENAI_API_KEY : null);
        default:       return null;
    }
}

// ─── PER-PROVIDER TIMEOUTS (ms) ────────────────────────────────────────────
const PROVIDER_TIMEOUTS = {
    sglang: 180_000,
    groq:   15_000,
    gemini: 90_000,
    agy:    90_000,
    openai: 15_000,
};

// ─── FALLBACK CHAIN BUILDER ────────────────────────────────────────────────
// SGLang (local GPU) is the default. Groq/Gemini only if user explicitly chooses and provides key.
const LOCAL_FIRST_CHAIN  = ['sglang'];
const CLOUD_FIRST_CHAIN  = ['sglang'];

/**
 * Build an ordered provider chain with user preference first.
 */
function buildFallbackChain(preferredProvider = 'sglang', preferLocalFirst = true) {
    if (LOCAL_GPU_ONLY) {
        return ['sglang'];
    }
    const norm = (preferredProvider || 'sglang').toLowerCase().trim();
    let chain = [];

    if (norm === 'groq') {
        chain = preferLocalFirst ? ['groq', 'sglang', 'gemini'] : ['groq', 'gemini', 'sglang'];
    } else if (norm === 'gemini') {
        chain = preferLocalFirst ? ['gemini', 'sglang', 'groq'] : ['gemini', 'groq', 'sglang'];
    } else {
        chain = ['sglang', 'gemini', 'groq'];
    }

    return chain;
}

// ─── PROVIDER SERVICE MAP ──────────────────────────────────────────────────
function getServiceForProvider(provider) {
    switch (provider) {
        case 'gemini': return geminiService();
        case 'groq':   return groqService();
        case 'openai': return openaiService();
        case 'sglang':
        case 'local_llm':
        case 'ollama': return sglangService();
        case 'claude': return claudeService();
        case 'anthropic': return anthropicService();
        default:       return sglangService();
    }
}

// Providers that support streaming in llmStreamingService
const UNIFIED_STREAM_PROVIDERS = new Set(['gemini', 'groq', 'openai']);

// ─── CORE: CALL WITH FALLBACK ──────────────────────────────────────────────
/**
 * Make an LLM call with automatic fallback through the provider chain.
 */
async function callWithFallback({
    chatHistory = [],
    userQuery,
    systemPrompt = null,
    options = {},
    preferredProvider = 'sglang',
    preferLocalFirst = false,
    userApiKeys = {},
    onToken = null,
}) {
    const chain = buildFallbackChain(preferredProvider, preferLocalFirst);
    const errors = [];
    let attemptedAny = false;

    for (const provider of chain) {
        // Skip cloud providers without user-provided API keys
        if (provider !== 'sglang' && provider !== 'local_llm' && !hasApiKey(provider, userApiKeys)) {
            log.info('AI', `[Fallback] Skipping ${provider} — API key missing or is placeholder`);
            continue;
        }

        // For SGLang, check health first
        if (provider === 'sglang' || provider === 'local_llm') {
            const healthy = await isSglangUp();
            if (!healthy) {
                log.warn('AI', `[Fallback] Skipping sglang — not reachable or disabled`);
                continue;
            }
        }

        const apiKey = getApiKey(provider, userApiKeys);
        const model = resolveModelForProvider(provider, options);
        const thinkEnabled = isThinkingModel(model);
        const providerTimeout = PROVIDER_TIMEOUTS[provider] || 30_000;

        const callOptions = {
            ...options,
            apiKey,
            model,
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxOutputTokens ?? 4096,
            timeout: Math.max(providerTimeout, options.timeout || 0),
            ...(provider === 'gemini' && { geminiModel: model }),
            ...(thinkEnabled && { think: true }),
        };

        attemptedAny = true;
        log.info('AI', `[Fallback] Attempting ${provider}/${model} (timeout: ${providerTimeout}ms)`);

        try {
            const limiter = providerLimiters[provider];
            const executeLlmCall = async () => {
                if (onToken && (provider === 'sglang' || provider === 'local_llm')) {
                    // SGLang via unified streaming service
                    const messages = [
                        ...chatHistory.map(m => ({
                            role: m.role === 'model' ? 'assistant' : m.role,
                            content: Array.isArray(m.parts) ? m.parts[0].text : (m.text || m.content || '')
                        })),
                        { role: 'user', content: userQuery }
                    ];
                    return await streamingService().streamCompletion({
                        messages, provider: 'sglang', model, apiKey, systemPrompt, onToken,
                        options: { ...callOptions, handleThinkingTags: thinkEnabled }
                    });
                } else if (onToken && UNIFIED_STREAM_PROVIDERS.has(provider)) {
                    // Gemini/Groq/OpenAI via unified streaming service
                    const messages = [
                        ...chatHistory.map(m => ({
                            role: m.role === 'model' ? 'assistant' : m.role,
                            content: Array.isArray(m.parts) ? m.parts[0].text : (m.text || m.content || '')
                        })),
                        { role: 'user', content: userQuery }
                    ];
                    return await streamingService().streamCompletion({
                        messages, provider, model, apiKey, systemPrompt, onToken,
                        options: { ...callOptions, handleThinkingTags: thinkEnabled }
                    });
                } else if (provider === 'sglang' || provider === 'local_llm') {
                    const sglangService = require('./sglangService');
                    return await sglangService.generateContentWithHistory(chatHistory, userQuery, systemPrompt, {
                        ...callOptions,
                        model,
                        maxOutputTokens: options.maxOutputTokens ?? 2048,
                        enableThinking: options.think === true
                    });
                } else {
                    const svc = getServiceForProvider(provider);
                    if (!svc) throw new Error(`No service implementation for provider "${provider}"`);
                    return svc.generateContentWithHistory(chatHistory, userQuery, systemPrompt, callOptions);
                }
            };

            // Schedule through limiter if one exists for this provider, otherwise call directly
            const result = limiter
                ? await limiter.schedule(executeLlmCall)
                : await executeLlmCall();

            const text = typeof result === 'string' ? result : String(result || '');
            const { thinking, content } = separateThinking(text);

            log.info('AI', `[Fallback] ✓ ${provider}/${model} succeeded (${content.length} chars)`);

            return {
                text: content,
                thinking: thinking || result?.thinking || null,
                provider,
                model,
                wasFailover: provider !== preferredProvider,
                apiKey,
            };
        } catch (err) {
            const msg = err.message || String(err);
            // [Optimization] Bottleneck OVERFLOW produces a specific error message.
            // Treat it as "provider busy" — log and continue to the next provider.
            if (msg === 'This job has been dropped by Bottleneck') {
                errors.push({ provider, model, error: `Queue full (${HIGH_WATER_MARK} pending) — overflowed to next provider` });
                log.warn('AI', `[Fallback] ⏳ ${provider} queue full — overflowing to next provider`);
            } else {
                errors.push({ provider, model, error: msg });
                log.warn('AI', `[Fallback] ✗ ${provider} failed: ${msg.slice(0, 120)}`);
                if (provider === 'ollama') invalidateOllamaHealth();
                if (provider === 'sglang') invalidateSglangHealth();
            }
        }
    }

    // All providers failed — return a graceful self-healing response
    log.error('AI', `[Fallback] ALL providers exhausted`, errors);
    const isGreeting = /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening|day))\b/i.test(String(userQuery || '').trim());
    const selfHealedText = isGreeting
        ? "Hello! 👋 I'm **iMentor**, your AI academic tutor and research assistant. How can I help you with your coursework, coding, or studies today?"
        : "I am temporarily experiencing higher latency or reconnection with the inference engine. Let me help you work through the fundamentals of your question. Please try asking your question again in a moment!";

    return {
        text: selfHealedText,
        thinking: null,
        provider: 'self_heal',
        model: 'offline_fallback',
        wasFailover: true,
        errors,
    };
}

// ─── MODEL RESOLUTION ──────────────────────────────────────────────────────
function resolveModelForProvider(provider, options = {}) {
    if (options.geminiModel && provider === 'gemini') return options.geminiModel;
    if (options.groqModel && provider === 'groq') return options.groqModel;

    const optModel = options.model;
    if (provider === 'gemini') {
        if (optModel && optModel.toLowerCase().startsWith('gemini')) return optModel;
        return process.env.GEMINI_MODEL || 'gemini-3.8-flash-high';
    }
    if (provider === 'groq') {
        const isNotGroq = optModel && (optModel.includes('/') || optModel.toLowerCase().startsWith('gemini'));
        if (optModel && !isNotGroq) return optModel;
        return process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    }
    if (provider === 'sglang') {
        if (optModel && optModel.includes('/')) return optModel;
        return process.env.SGLANG_CHAT_MODEL || 'Qwen/Qwen3-8B-AWQ';
    }
    if (provider === 'openai') {
        if (optModel && optModel.toLowerCase().startsWith('gpt')) return optModel;
        return process.env.OPENAI_MODEL || 'gpt-4o';
    }
    return optModel || process.env.SGLANG_CHAT_MODEL || 'Qwen/Qwen3-8B-AWQ';
}

// ─── FAST MODEL SELECTOR (for overhead calls) ──────────────────────────────
/**
 * Returns the fastest available provider+model for low-latency overhead calls.
 * Priority: SGLang (local GPU) → Groq (fast cloud) → Gemini.
 */
async function getFastModel(userApiKeys = {}, ollamaUrlHint = null) {
    if (LOCAL_GPU_ONLY) {
        return {
            provider: 'sglang',
            model: process.env.SGLANG_CHAT_MODEL || 'Qwen/Qwen3-8B-AWQ',
            sglangUrl: process.env.SGLANG_CHAT_URL || 'http://127.0.0.1:8000/v1',
        };
    }
    // 1) SGLang — primary for all LLM calls
    if (process.env.SGLANG_ENABLED === 'true') {
        const sglangUrl = process.env.SGLANG_CHAT_URL || 'http://localhost:8000/v1';
        const isUp = await isSglangUp();
        if (isUp) {
            return {
                provider: 'sglang',
                model: process.env.SGLANG_CHAT_MODEL || 'Qwen/Qwen3-8B-AWQ',
                sglangUrl,
            };
        }
    }

    // 2) Groq — fast cloud fallback
    if (hasApiKey('groq', userApiKeys)) {
        return {
            provider: 'groq',
            model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
            apiKey: getApiKey('groq', userApiKeys),
        };
    }

    // 3) Gemini — cloud fallback
    if (hasApiKey('gemini', userApiKeys)) {
        return {
            provider: 'gemini',
            model: process.env.GEMINI_MODEL || 'gemini-3.8-flash-high',
            apiKey: getApiKey('gemini', userApiKeys),
        };
    }

    // 4) OpenAI — cloud fallback
    if (hasApiKey('openai', userApiKeys)) {
        return {
            provider: 'openai',
            model: process.env.OPENAI_MODEL || 'gpt-4o',
            apiKey: getApiKey('openai', userApiKeys),
        };
    }

    return null; // nothing available
}

/**
 * Quick non-streaming LLM call using the fastest available model.
 * Ideal for decomposition, classification, critique — overhead calls.
 */
async function callFast({ prompt, systemPrompt = null, userApiKeys = {}, ollamaUrl = null, options = {} }) {
    const fast = await getFastModel(userApiKeys, ollamaUrl);
    if (!fast) {
        throw new Error('No LLM provider available for fast call');
    }

    // SGLang uses OpenAI-compatible REST — call directly via axios
    if (fast.provider === 'sglang') {
        const axios = require('axios');
        const messages = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: prompt });
        const resp = await axios.post(`${fast.sglangUrl}/chat/completions`, {
            model: fast.model,
            messages,
            max_tokens: options.maxOutputTokens ?? 2048,
            temperature: options.temperature ?? 0.3,
            stream: false,
            chat_template_kwargs: { enable_thinking: false }
        }, { timeout: 45000 });
        const rawText = resp.data?.choices?.[0]?.message?.content?.trim() || '';
        const text = separateThinking(rawText).content;
        if (!text) throw new Error('SGLang fast call returned empty response');
        return text;
    }

    // Groq — use SDK directly for non-streaming fast calls
    if (fast.provider === 'groq') {
        const Groq = require('groq-sdk');
        const groq = new Groq({ apiKey: fast.apiKey });
        const messages = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: prompt });
        const resp = await groq.chat.completions.create({
            model: fast.model,
            messages,
            max_tokens: options.maxOutputTokens ?? 2048,
            temperature: options.temperature ?? 0.3,
            stream: false,
        });
        const text = resp.choices?.[0]?.message?.content?.trim() || '';
        if (!text) throw new Error('Groq fast call returned empty response');
        return text;
    }

    const svc = getServiceForProvider(fast.provider);
    const callOpts = {
        ...options,
        apiKey: fast.apiKey,
        model: fast.model,
        ollamaUrl: fast.ollamaUrl,
        temperature: options.temperature ?? 0.3, // low temp for structural calls
        maxOutputTokens: options.maxOutputTokens ?? 2048,
        think: false, // overhead calls must NEVER trigger thinking — saves 15-40s per call
        ...(fast.provider === 'gemini' && { geminiModel: fast.model }),
        ...(fast.provider === 'groq' && { groqModel: fast.model }),
    };

    return svc.generateContentWithHistory([], prompt, systemPrompt, callOpts);
}

// ─── PARALLEL PROVIDER DISPATCH ────────────────────────────────────────
/**
 * Call multiple LLM providers in parallel; first valid response wins.
 * Uses AbortController to cancel remaining in-flight requests.
 *
 * @param {Object} params - Same as callWithFallback, plus:
 * @param {string[]} params.parallelProviders - Pre-filtered healthy providers to try in parallel
 * @param {number} params.staggerMs - Stagger between starts (default 200)
 * @returns {Promise<{text: string, provider: string, model: string}>}
 */
async function parallelCallWithFallback({
    chatHistory = [],
    userQuery,
    systemPrompt = null,
    options = {},
    parallelProviders = [],
    staggerMs = 200,
    preferredProvider = 'sglang',
    userApiKeys = {},
}) {
    if (!parallelProviders.length) {
        return callWithFallback({ chatHistory, userQuery, systemPrompt, options, preferredProvider, userApiKeys });
    }

    const logCtx = `parallel(${parallelProviders.join(',')})`;
    log.info('AI', `[Parallel] Starting ${logCtx}`);

    const aborted = new Set();
    const errors = [];

    const attemptProvider = (provider, index) => {
        return new Promise(async (resolve) => {
            const controller = new AbortController();
            const signal = controller.signal;
            const delay = index * staggerMs;
            if (delay > 0) {
                await new Promise(r => setTimeout(r, delay));
            }

            if (aborted.has(provider) || signal.aborted) {
                resolve(null);
                return;
            }

            if (provider !== 'sglang' && provider !== 'local_llm' && !hasApiKey(provider, userApiKeys)) {
                log.info('AI', `[Parallel] Skipping ${provider} — missing key`);
                resolve(null);
                return;
            }

            if (provider === 'sglang' || provider === 'local_llm') {
                const healthy = await isSglangUp();
                if (!healthy) {
                    log.info('AI', `[Parallel] Skipping sglang — not reachable`);
                    resolve(null);
                    return;
                }
            }

            const apiKey = getApiKey(provider, userApiKeys);
            const model = resolveModelForProvider(provider, options);
            const thinkEnabled = isThinkingModel(model);
            const providerTimeout = PROVIDER_TIMEOUTS[provider] || 30_000;

            const callOptions = {
                ...options,
                apiKey,
                model,
                temperature: options.temperature ?? 0.7,
                maxOutputTokens: options.maxOutputTokens ?? 4096,
                timeout: Math.max(providerTimeout, options.timeout || 0),
                signal,
                ...(provider === 'gemini' && { geminiModel: model }),
                ...(thinkEnabled && { think: true }),
            };

            const providerStartTime = Date.now();
            log.info('AI', `[Parallel] Attempting ${provider}/${model} (timeout: ${providerTimeout}ms)`);

            try {
                let result;
                if (provider === 'sglang') {
                    const ax = require('axios');
                    const messages = [];
                    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
                    messages.push(...chatHistory.map(m => ({
                        role: m.role === 'model' ? 'assistant' : (m.role || 'user'),
                        content: Array.isArray(m.parts) ? m.parts[0].text : (m.text || m.content || '')
                    })));
                    const userContent = options.think === true ? userQuery : `${userQuery} /no_think`;
                    messages.push({ role: 'user', content: userContent });
                    const sglangUrl = process.env.SGLANG_CHAT_URL || 'http://localhost:8000/v1';
                    const resp = await ax.post(`${sglangUrl}/chat/completions`, {
                        model, messages,
                        max_tokens: options.maxOutputTokens ?? 1024,
                        temperature: callOptions.temperature ?? 0.7,
                        stream: false,
                        ...(options.think === true ? {} : { chat_template_kwargs: { enable_thinking: false } })
                    }, { timeout: providerTimeout, signal });
                    result = resp.data?.choices?.[0]?.message?.content || '';
                } else {
                    const svc = getServiceForProvider(provider);
                    result = await svc.generateContentWithHistory(chatHistory, userQuery, systemPrompt, callOptions);
                }

                const text = typeof result === 'string' ? result : String(result || '');
                const { thinking, content } = separateThinking(text);

                if (aborted.has(provider)) {
                    resolve(null);
                    return;
                }

                const elapsed = Date.now() - providerStartTime;
                log.info('AI', `[Parallel] ✓ ${provider}/${model} succeeded (${content.length} chars, ${elapsed}ms)`);
                try { const h = require('./providerHealthCache'); h.recordSuccess(provider, elapsed); } catch {}
                resolve({ text: content, thinking, provider, model });
            } catch (err) {
                const msg = err.message || String(err);
                errors.push({ provider, model, error: msg });
                if (!aborted.has(provider)) {
                    log.warn('AI', `[Parallel] ✗ ${provider} failed: ${msg.slice(0, 120)}`);
                }
                try { const h = require('./providerHealthCache'); h.recordFailure(provider, msg); } catch {}
                if (provider === 'ollama') invalidateOllamaHealth();
                if (provider === 'sglang') invalidateSglangHealth();
                resolve(null);
            }
        });
    };

    const promises = parallelProviders.map((p, i) => attemptProvider(p, i));

    return new Promise((resolve) => {
        let settled = 0;
        for (const promise of promises) {
            promise.then((result) => {
                if (result && !aborted.has('_done')) {
                    aborted.add('_done');
                    for (const p of parallelProviders) aborted.add(p);
                    resolve(result);
                }
                settled++;
                if (settled === parallelProviders.length) {
                    resolve(null);
                }
            });
        }
    }).then(async (winner) => {
        if (winner) return { ...winner, wasFailover: winner.provider !== preferredProvider };

        log.error('AI', `[Parallel] ALL providers exhausted`, errors);
        return callWithFallback({ chatHistory, userQuery, systemPrompt, options, preferredProvider, preferLocalFirst: false, userApiKeys });
    });
}

module.exports = {
    callWithFallback,
    parallelCallWithFallback,
    callFast,
    getFastModel,
    buildFallbackChain,
    isThinkingModel,
    separateThinking,
    hasApiKey,
    getApiKey,
    isSglangUp,
    invalidateSglangHealth,
    resolveModelForProvider,
};