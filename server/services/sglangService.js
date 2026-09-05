/**
 * server/services/sglangService.js
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║            SGLang Service — OpenAI-Compatible LLM Wrapper               ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * SGLang exposes an OpenAI-compatible REST API. This service wraps the standard
 * OpenAI SDK with a configurable baseURL pointing to SGLang endpoints.
 *
 * Models (AWQ 4-bit quantized — ~2x smaller VRAM, near-identical quality):
 *   SGLANG_CHAT_URL    — Day-shift 14B-AWQ  (~9 GB, GPU 0)   standard + direct_answer
 *   SGLANG_REASON_URL  — Day-shift 14B-AWQ  (~9 GB, GPU 1)   ToT / complex reasoning
 *   SGLANG_HEAVY_URL   — Night-shift 32B-AWQ (~18 GB, GPU 2)  offline STN + KG jobs
 *                      (single GPU — no tensor-parallel needed vs old 35B FP on 2 GPUs)
 *
 * This service is a DROP-IN PEER to sglangService.js — it exposes the same
 * interface so llmRouterService.js can switch between them with a flag.
 *
 * Guard: SGLANG_ENABLED must be 'true' in .env or all calls throw a clear error.
 * During migration, keep Ollama as fallback; flip SGLANG_ENABLED=true when ready.
 */

const log         = require('../utils/logger');
const OpenAI      = require('openai');
const sglangCaps  = require('./sglangCapabilities');
const http        = require('http');

const SGLANG_ENABLED = process.env.SGLANG_ENABLED !== 'false';
const _sglangHttpAgent = new http.Agent({ keepAlive: true, maxSockets: 250, keepAliveMsecs: 60000 });

// ── Lazy-initialized clients per endpoint ────────────────────────────────────
let _chatClient   = null;
let _reasonClient = null;
let _heavyClient  = null;

function _getClient(type = 'chat') {
    if (!SGLANG_ENABLED) {
        throw new Error('[SGLang] SGLANG_ENABLED is set to false in environment.');
    }

    const urlMap = {
        chat:   process.env.SGLANG_CHAT_URL   || 'http://127.0.0.1:8000/v1',
        reason: process.env.SGLANG_REASON_URL || 'http://127.0.0.1:8000/v1',
        heavy:  process.env.SGLANG_HEAVY_URL  || 'http://127.0.0.1:8000/v1',
    };

    const baseURL = urlMap[type] || urlMap.chat;

    // SGLang doesn't require an API key but the OpenAI SDK mandates one — use dummy
    const opts = { baseURL, apiKey: 'sglang-no-auth', timeout: 120_000, httpAgent: _sglangHttpAgent };

    if (type === 'chat')   return _chatClient   || (_chatClient   = new OpenAI(opts));
    if (type === 'reason') return _reasonClient || (_reasonClient = new OpenAI(opts));
    if (type === 'heavy')  return _heavyClient  || (_heavyClient  = new OpenAI(opts));

    return new OpenAI(opts);
}

// ── Format history for OpenAI messages array with Radix prefix canonicalization ──
function _formatHistory(chatHistory = [], systemPrompt = null) {
    const messages = [];
    if (systemPrompt) {
        // Canonicalize system prompt (normalize line endings and trim) to maximize SGLang Radix-tree cache hits
        const canonicalSystemPrompt = typeof systemPrompt === 'string'
            ? systemPrompt.replace(/\r\n/g, '\n').trim()
            : systemPrompt;
        messages.push({ role: 'system', content: canonicalSystemPrompt });
    }
    for (const msg of chatHistory) {
        messages.push({
            role:    msg.role === 'model' ? 'assistant' : 'user',
            content: msg.parts?.[0]?.text || msg.content || '',
        });
    }
    return messages;
}

/**
 * Helper to retry transient network/server glitches with exponential backoff.
 */
async function _retryWithBackoff(fn, maxRetries = 2, baseDelayMs = 400) {
    let lastError = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            const isRetryable = err.code === 'ECONNRESET' ||
                                err.code === 'ECONNREFUSED' ||
                                err.code === 'ETIMEDOUT' ||
                                err.code === 'ENOTFOUND' ||
                                err.status === 502 ||
                                err.status === 503 ||
                                err.status === 504 ||
                                err.status === 429;
            if (attempt < maxRetries && isRetryable) {
                const delay = baseDelayMs * Math.pow(2, attempt);
                log.warn('AI', `[SGLang] Transient error (${err.message}). Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
                await new Promise(r => setTimeout(r, delay));
            } else {
                throw err;
            }
        }
    }
    throw lastError;
}

/**
 * Generate a response (non-streaming).
 * Interface matches OpenAI / standard LLM service.
 *
 * @param {Array}   chatHistory     - [{ role, parts: [{ text }] }]
 * @param {string}  userQuery       - Current user message
 * @param {string}  systemPrompt    - Optional system instruction
 * @param {object}  options         - { model, maxTokens, temperature, endpoint: 'chat'|'reason'|'heavy' }
 * @returns {Promise<string>} The assistant's response text
 */
async function generateContentWithHistory(chatHistory, userQuery, systemPrompt = null, options = {}) {
    const endpoint = options.endpoint || 'chat';
    const model    = options.model
        || (endpoint === 'heavy'  ? process.env.SGLANG_HEAVY_MODEL  : null)
        || (endpoint === 'reason' ? process.env.SGLANG_REASON_MODEL : null)
        || process.env.SGLANG_CHAT_MODEL
        || 'Qwen/Qwen2.5-7B-Instruct-AWQ';

    const client   = _getClient(endpoint);
    const tokenOptimizer = require('../utils/tokenOptimizer');
    const optimizedSystemPrompt = tokenOptimizer.minifyPrompt(tokenOptimizer.injectSystemInstruction(systemPrompt, options));
    const optimizedUserQuery = tokenOptimizer.minifyPrompt(userQuery);
    const optimizedHistory = tokenOptimizer.optimizeIncomingMessages(chatHistory || []);

    const messages = _formatHistory(optimizedHistory, optimizedSystemPrompt);
    messages.push({ role: 'user', content: optimizedUserQuery });

    // Estimate input tokens and adjust maxTokens to prevent context overflow
    const allMessagesText = messages.map(m => m.content).join(' ');
    const estimatedInputTokens = Math.ceil(allMessagesText.length / 3.5); // ~3.5 chars/token for Qwen
    const modelMaxContext = sglangCaps.getModelMaxContext(); // live from /v1/models
    const safetyBuffer = 256;
    const availableForCompletion = Math.max(512, modelMaxContext - estimatedInputTokens - safetyBuffer);
    const maxTokens = Math.min(options.maxTokens || 4096, availableForCompletion);

    log.info('AI', `[SGLang] generate → endpoint=${endpoint} model=${model}`);
    log.info('AI', `[SGLang] Token budget: input≈${estimatedInputTokens} + completion=${maxTokens} ≈ ${estimatedInputTokens + maxTokens} / ${modelMaxContext}`);

    try {
        const body = {
            model,
            messages,
            max_tokens:  maxTokens,
            temperature: options.temperature || 0.7,
            stream:      false,
        };
        if (options.response_format) body.response_format = options.response_format;
        if (options.tools) body.tools = options.tools;
        if (options.tool_choice) body.tool_choice = options.tool_choice;

        const completion = await _retryWithBackoff(() => client.chat.completions.create(body));

        const text = completion.choices?.[0]?.message?.content?.trim() || '';
        log.success('AI', `[SGLang] response received (${text.length} chars)`);
        return tokenOptimizer.expandOutgoingResponse(text);

    } catch (err) {
        log.error('AI', `[SGLang] generate failed: ${err.message}`);
        const enhanced = new Error(`SGLang error: ${err.message}`);
        enhanced.status = err.status || 503;
        throw enhanced;
    }
}

/**
 * Streaming generation.
 * Yields tokens via onToken callback.
 *
 * @param {Array}    chatHistory
 * @param {string}   userQuery
 * @param {string}   systemPrompt
 * @param {object}   options       - { model, maxTokens, temperature, endpoint }
 * @param {Function} onToken       - Called with each token string or event object
 * @returns {Promise<{ finalAnswer: string }>}
 */
async function streamChat(chatHistory, userQuery, systemPrompt = null, options = {}, onToken = null) {
    const endpoint = options.endpoint || 'chat';
    const model    = options.model
        || (endpoint === 'reason' ? process.env.SGLANG_REASON_MODEL : null)
        || process.env.SGLANG_CHAT_MODEL
        || 'Qwen/Qwen2.5-7B-Instruct-AWQ';

    const client   = _getClient(endpoint);
    const tokenOptimizer = require('../utils/tokenOptimizer');
    const optimizedSystemPrompt = tokenOptimizer.minifyPrompt(tokenOptimizer.injectSystemInstruction(systemPrompt, options));
    const optimizedUserQuery = tokenOptimizer.minifyPrompt(userQuery);
    const optimizedHistory = tokenOptimizer.optimizeIncomingMessages(chatHistory || []);

    const messages = _formatHistory(optimizedHistory, optimizedSystemPrompt);
    messages.push({ role: 'user', content: optimizedUserQuery });

    log.info('AI', `[SGLang] stream → endpoint=${endpoint} model=${model}`);

    // Compute safe token budget using live SGLang model capabilities
    const allText = messages.map(m => m.content).join(' ');
    const estimatedInputTokens = Math.ceil(allText.length / 3.5);
    const modelMaxContext = sglangCaps.getModelMaxContext(16384);
    const safetyBuffer = 256;
    const availableForCompletion = Math.max(1024, modelMaxContext - estimatedInputTokens - safetyBuffer);
    const maxTokensForStream = Math.min(options.maxTokens || 8192, availableForCompletion);

    const chunks   = [];
    const body = {
        model,
        messages,
        max_tokens:  maxTokensForStream,
        temperature: options.temperature || 0.7,
        stream:      true,
    };
    if (options.response_format) body.response_format = options.response_format;
    if (options.tools) body.tools = options.tools;
    if (options.tool_choice) body.tool_choice = options.tool_choice;

    const streamStart = Date.now();
    let firstTokenTime = null;

    try {
        const stream = await _retryWithBackoff(() => client.chat.completions.create(body));

        for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
                if (firstTokenTime === null) {
                    firstTokenTime = Date.now() - streamStart;
                    log.info('AI', `[SGLang] TTFT (Time To First Token): ${firstTokenTime}ms`);
                }
                chunks.push(delta);
                if (typeof onToken === 'function') {
                    onToken({ type: 'token', content: delta });
                }
            }
        }

        const totalStreamTime = Date.now() - streamStart;
        const tokensCount = chunks.length;
        const speed = totalStreamTime > 0 ? ((tokensCount / totalStreamTime) * 1000).toFixed(2) : 0;
        const rawAnswer = chunks.join('');
        const finalAnswer = tokenOptimizer.expandOutgoingResponse(rawAnswer);
        log.success('AI', `[SGLang] stream complete (${finalAnswer.length} chars) | Total Time: ${totalStreamTime}ms | TTFT: ${firstTokenTime || totalStreamTime}ms | Speed: ${speed} tok/s`);
        return { finalAnswer };
    } catch (err) {
        log.error('AI', `[SGLang] stream error: ${err.message}`);
        if (chunks.length > 0) {
            // Self-healing: return what we got so far instead of losing complete output
            const partial = chunks.join('');
            log.warn('AI', `[SGLang] Recovered partial stream (${partial.length} chars) before failure`);
            return { finalAnswer: partial };
        }
        throw err;
    }
}

/**
 * Check SGLang endpoint health (ping /models).
 *
 * @param {'chat'|'reason'|'heavy'} endpoint
 * @returns {Promise<boolean>}
 */
async function checkHealth(endpoint = 'chat') {
    if (!SGLANG_ENABLED) return false;
    try {
        const client = _getClient(endpoint);
        await client.models.list({ timeout: 2000 });
        return true;
    } catch (e) {
        log.warn('AI', `[SGLang] Health check failed for endpoint=${endpoint}: ${e.message}`);
        return false;
    }
}

module.exports = {
    generateContentWithHistory,
    streamChat,
    checkHealth,
    SGLANG_ENABLED,
};
