/**
 * server/services/sglangService.js
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║            SGLang Service — OpenAI-Compatible LLM Wrapper               ║
 * ║   + Gemini-Style Question-Adaptive Thinking Router                      ║
 * ║   + AgentWrite / Multi-Turn Chunked Continuation for Long Context       ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

const log         = require('../utils/logger');
const OpenAI      = require('openai');
const sglangCaps  = require('./sglangCapabilities');
const http        = require('http');
const https       = require('https');

const SGLANG_ENABLED = process.env.SGLANG_ENABLED !== 'false';
const _sglangHttpAgent  = new http.Agent({ keepAlive: true, maxSockets: 250, keepAliveMsecs: 60000 });
const _sglangHttpsAgent = new https.Agent({ keepAlive: true, maxSockets: 250, keepAliveMsecs: 60000 });

// Multi-Turn Chunked Continuation constants (AgentWrite / Progressive Generation)
const DEFAULT_PART_TOKEN_BUDGET = 1400; // Optimal coherence window per part (~1,050 words)
const MAX_CONTINUATION_PARTS    = 3;    // Up to 3 stateful parts (~4,200 tokens / ~3,150 words total)
const CONTEXT_SAFETY_BUFFER     = 512;  // Safety buffer below model max_model_len
let _activeSglangStreams        = 0; // Read-only concurrency telemetry (zero quality throttling)

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
    const isHttps = String(baseURL).toLowerCase().startsWith('https:');
    const apiKey  = process.env.SGLANG_API_KEY || 'sglang-no-auth';
    const opts    = { baseURL, apiKey, timeout: 120_000, httpAgent: isHttps ? _sglangHttpsAgent : _sglangHttpAgent };

    if (type === 'chat')   return _chatClient   || (_chatClient   = new OpenAI(opts));
    if (type === 'reason') return _reasonClient || (_reasonClient = new OpenAI(opts));
    if (type === 'heavy')  return _heavyClient  || (_heavyClient  = new OpenAI(opts));

    return new OpenAI(opts);
}

/**
 * Conservative token estimator that accounts for LaTeX, math symbols, and code punctuation
 * (which tokenize at ~1 token per symbol in Qwen tokenizers).
 */
function estimateTokensConservative(text) {
    if (!text) return 0;
    const str = String(text);
    const specialSymbols = (str.match(/[\\{}()[\]^_+=*/<>|&~`@#$%;:]/g) || []).length;
    return Math.ceil(str.length / 3.2) + Math.ceil(specialSymbols * 0.55);
}

/**
 * Gemini-Style Question-Adaptive Thinking Router:
 * Determines whether to enable `<think>...</think>` dissection based on:
 *   1. Explicit user UI toggle (`options.enableThinking === false` -> Answer Now / No Think)
 *   2. Structured JSON / Socratic Tutor / short utility calls -> No Think
 *   3. Subjective Question Complexity (derivations, proofs, filter design, math calculations,
 *      multi-dimensional trade-off analysis, and algorithm debugging -> Enable Bounded Thinking;
 *      greetings, definitions, conceptual overviews, and simple queries -> Fast Direct Answer).
 */
function evaluateThinkingStrategy(userQuery = '', endpoint = 'chat', options = {}) {
    const q = String(userQuery || '').trim();

    // 1. Explicit override or CPU-only / no-think campus hardware profile
    const hwProfile = String(process.env.HARDWARE_PROFILE || '').toLowerCase();
    if (
        options.enableThinking === false ||
        q.includes('/no_think') ||
        process.env.SGLANG_FORCE_NO_THINK === 'true' ||
        hwProfile === 'cpu_lite' ||
        hwProfile === 'cpu_moe'
    ) {
        return { enableThinking: false, reason: 'explicit_or_cpu_profile_disabled' };
    }
    // 2. Utility / JSON schema / Socratic short turns never use raw <think> blocks
    const effectiveMaxTok = options.maxTokens || options.maxOutputTokens;
    if (options.response_format || options.jsonMode || options.isTutorMode || (effectiveMaxTok && effectiveMaxTok <= 600)) {
        return { enableThinking: false, reason: 'utility_or_short_turn' };
    }
    // 3. Explicit user force-enable
    if (options.enableThinking === true) {
        return { enableThinking: true, reason: 'explicit_enabled' };
    }
    // 3b. Explicit concise/brief request -> Instant Direct Mode (No Think)
    if (/\b(briefly|in \d+ bullet|short|concise|tl;?dr|in brief|2-3 sentences|summary only)\b/i.test(q)) {
        return { enableThinking: false, reason: 'concise_direct_query' };
    }

    // 4. Subjective Question Complexity Analysis (Gemini App adaptive strategy)
    // Short factual definitions, "what is", "define", "explain briefly", greetings -> Instant Direct Mode (No Think)
    const fastDirectPattern = /^(hi|hello|hey|thanks|thank you|ok|okay|what\s+is\s+(the\s+|a\s+|an\s+)?[\w\s-]{2,40}\??$|define\s+[\w\s-]{2,40}\.?$|who\s+|when\s+|list\s+the\s+)/i;
    if (q.length <= 60 && fastDirectPattern.test(q) && !/[=+*/^∑∫]|\s-\s|\d-\d/.test(q) && !/\b(derive|prove|calculate|implement|python|code|step-by-step)\b/i.test(q)) {
        return { enableThinking: false, reason: 'simple_direct_query' };
    }

    const deepReasoningPattern = /\b(derive|derivation|prove|proof|calculate|compute|solve|design\s+a|transfer\s+function|difference\s+equation|z-transform|butterfly|radix-2|region\s+of\s+convergence|bilinear|chebyshev|butterworth|poles?\s+and\s+zeros?|implement|python|matlab|algorithm|debug|why\s+does|compare\s+and\s+contrast|step-by-step|matrix|eigen)/i;
    const hasMathSymbols = /[=^∑∫]|(\b[xXyYhH]\([nNzZωt]\))/.test(q);

    if (deepReasoningPattern.test(q) || hasMathSymbols || (endpoint === 'reason' && q.length >= 45)) {
        return { enableThinking: true, reason: 'complex_analytical_query' };
    }

    return { enableThinking: false, reason: 'standard_conversational_query' };
}

// ── Format history for OpenAI messages array with Radix prefix canonicalization ──
function _formatHistory(chatHistory = [], systemPrompt = null) {
    const messages = [];
    if (systemPrompt) {
        const canonicalSystemPrompt = typeof systemPrompt === 'string'
            ? systemPrompt.replace(/\r\n/g, '\n').trim()
            : systemPrompt;
        messages.push({ role: 'system', content: canonicalSystemPrompt });
    }
    for (const msg of chatHistory) {
        messages.push({
            role:    msg.role === 'model' ? 'assistant' : (msg.role || 'user'),
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
 * Generate a response (non-streaming) with Multi-Turn Chunked Continuation.
 */
async function generateContentWithHistory(chatHistory, userQuery, systemPrompt = null, options = {}) {
    _activeSglangStreams++;
    try {
    const endpoint = options.endpoint || 'chat';
    const model    = options.model
        || (endpoint === 'heavy'  ? process.env.SGLANG_HEAVY_MODEL  : null)
        || (endpoint === 'reason' ? process.env.SGLANG_REASON_MODEL : null)
        || process.env.SGLANG_CHAT_MODEL
        || 'Qwen/Qwen3-8B-AWQ';

    const client   = _getClient(endpoint);
    const tokenOptimizer = require('../utils/tokenOptimizer');
    const thinkingDecision = evaluateThinkingStrategy(userQuery, endpoint, options);

    const effectiveSystemPrompt = systemPrompt || '';
    const optimizedSystemPrompt = tokenOptimizer.minifyPrompt(tokenOptimizer.injectSystemInstruction(effectiveSystemPrompt, options));
    const optimizedUserQuery = tokenOptimizer.minifyPrompt(userQuery);
    const optimizedHistory = tokenOptimizer.optimizeIncomingMessages(chatHistory || []);

    const thinkSuffix = thinkingDecision.enableThinking
        ? '\n[Thinking Strategy: Before answering, briefly dissect the core mathematical/engineering steps in 3-5 concise bullet points (<150 tokens) inside <think>...</think>, then present a clear, structured final response.]'
        : (!optimizedUserQuery.includes('/no_think') ? ' /no_think' : '');
    const messages = _formatHistory(optimizedHistory, optimizedSystemPrompt);
    messages.push({ role: 'user', content: optimizedUserQuery + thinkSuffix });

    const modelMaxContext = sglangCaps.getModelMaxContext(24576);
    const reqMaxTokens = options.maxTokens || options.maxOutputTokens || 2560;
    const allowMultiPart = !options.response_format && !options.jsonMode && !options.tools && reqMaxTokens > 800;
    const maxParts = allowMultiPart ? MAX_CONTINUATION_PARTS : 1;

    let combinedAnswer = '';
    let partIndex = 1;

    try {
        while (partIndex <= maxParts) {
            const allMessagesText = messages.map(m => m.content).join(' ');
            const estimatedInputTokens = estimateTokensConservative(allMessagesText);
            const availableForCompletion = Math.max(512, modelMaxContext - estimatedInputTokens - CONTEXT_SAFETY_BUFFER);
            const targetPartTokens = allowMultiPart
                ? Math.min(options.partTokenBudget || DEFAULT_PART_TOKEN_BUDGET, reqMaxTokens)
                : (options.maxTokens || options.maxOutputTokens || 2048);
            const maxTokens = Math.min(targetPartTokens, availableForCompletion);

            const useThinkingThisPart = partIndex === 1 && thinkingDecision.enableThinking;

            log.info('AI', `[SGLang] generate (Part ${partIndex}/${maxParts}) → endpoint=${endpoint} model=${model} thinking=${useThinkingThisPart} (${thinkingDecision.reason}) budget=${maxTokens}/${availableForCompletion}`);

            const body = {
                model,
                messages,
                max_tokens:  maxTokens,
                temperature: options.temperature || 0.7,
                stream:      false,
                chat_template_kwargs: { enable_thinking: useThinkingThisPart },
            };
            if (options.response_format) body.response_format = options.response_format;
            else if (options.jsonMode) body.response_format = { type: 'json_object' };
            if (options.tools) body.tools = options.tools;
            if (options.tool_choice) body.tool_choice = options.tool_choice;

            const completion = await _retryWithBackoff(() => client.chat.completions.create(body));
            const choice = completion.choices?.[0];
            const rawText = choice?.message?.content?.trim() || '';
            const finishReason = choice?.finish_reason || 'stop';

            const cleanedPart = rawText.replace(/<(?:think|thinking)>[\s\S]*?<\/(?:think|thinking)>\s*/gi, '').trim();
            combinedAnswer += (combinedAnswer && cleanedPart ? '\n\n' : '') + cleanedPart;

            if (finishReason !== 'length' || !allowMultiPart || partIndex >= maxParts || !cleanedPart) {
                break;
            }

            // Stateful Multi-Turn Continuation (AgentWrite rolling window)
            log.info('AI', `[SGLang] Part ${partIndex} hit token boundary (finish_reason=length, ${cleanedPart.length} chars). Auto-continuing Part ${partIndex + 1}...`);
            const tailSnippet = cleanedPart.slice(-140).replace(/\s+/g, ' ');
            messages.push({ role: 'assistant', content: cleanedPart });
            messages.push({
                role: 'user',
                content: `Continue writing Part ${partIndex + 1} seamlessly from the exact point where Part ${partIndex} stopped ("...${tailSnippet}"). Do NOT repeat earlier headings or text; finish all remaining derivations, code blocks, or tables and conclude cleanly. /no_think`,
            });
            partIndex++;
        }

        log.success('AI', `[SGLang] response complete across ${partIndex} part(s) (${combinedAnswer.length} chars)`);
        return tokenOptimizer.expandOutgoingResponse(combinedAnswer);

    } catch (err) {
        log.error('AI', `[SGLang] generate failed: ${err.message}`);
        if (combinedAnswer.length > 0) {
            log.warn('AI', `[SGLang] Returning partial multi-part answer (${combinedAnswer.length} chars)`);
            return tokenOptimizer.expandOutgoingResponse(combinedAnswer);
        }
        const enhanced = new Error(`SGLang error: ${err.message}`);
        enhanced.status = err.status || 503;
        throw enhanced;
    }
    } finally {
        _activeSglangStreams = Math.max(0, _activeSglangStreams - 1);
    }
}

/**
 * Streaming generation with:
 *   1. Gemini-Style Question-Adaptive Thinking (emits `{ type: 'thinking', content }` during `<think>` phase
 *      when thinking is enabled for complex questions, or skips `<think>` completely for fast queries).
 *   2. Stateful Multi-Turn Chunked Continuation (`Part 1 -> Part 2 -> Part 3`) so long-form answers
 *      never get cut off mid-sentence and never overflow the context window.
 */
async function streamChat(chatHistory, userQuery, systemPrompt = null, options = {}, onToken = null) {
    _activeSglangStreams++;
    try {
    await new Promise(r => setImmediate(r));
    const endpoint = options.endpoint || 'chat';
    const model    = options.model
        || (endpoint === 'reason' ? process.env.SGLANG_REASON_MODEL : null)
        || process.env.SGLANG_CHAT_MODEL
        || 'Qwen/Qwen3-8B-AWQ';

    const client   = _getClient(endpoint);
    const tokenOptimizer = require('../utils/tokenOptimizer');
    const thinkingDecision = evaluateThinkingStrategy(userQuery, endpoint, options);

    const effectiveSystemPrompt = systemPrompt || '';
    const optimizedSystemPrompt = tokenOptimizer.minifyPrompt(tokenOptimizer.injectSystemInstruction(effectiveSystemPrompt, options));
    const optimizedUserQuery = tokenOptimizer.minifyPrompt(userQuery);
    const optimizedHistory = tokenOptimizer.optimizeIncomingMessages(chatHistory || []);

    const thinkSuffix = thinkingDecision.enableThinking
        ? '\n[Thinking Strategy: Dissect the problem and outline your plan in 3-5 concise bullet points (<160 tokens) inside <think>...</think>, then write the complete response.]'
        : (!optimizedUserQuery.includes('/no_think') ? ' /no_think' : '');
    const messages = _formatHistory(optimizedHistory, optimizedSystemPrompt);
    messages.push({ role: 'user', content: optimizedUserQuery + thinkSuffix });

    const modelMaxContext = sglangCaps.getModelMaxContext(24576);
    const reqMaxTokens = options.maxTokens || options.maxOutputTokens || 3072;
    const allowMultiPart = !options.response_format && !options.jsonMode && !options.tools && reqMaxTokens > 800;
    const maxParts = allowMultiPart ? MAX_CONTINUATION_PARTS : 1;

    const streamStart = Date.now();
    let firstTokenTime = null;
    let totalTokensCount = 0;
    let combinedAnswer = '';
    let combinedThinking = '';
    let partIndex = 1;

    try {
        while (partIndex <= maxParts) {
            const allText = messages.map(m => m.content).join(' ');
            const estimatedInputTokens = estimateTokensConservative(allText);
            const availableForCompletion = Math.max(512, modelMaxContext - estimatedInputTokens - CONTEXT_SAFETY_BUFFER);
            const targetPartTokens = allowMultiPart
                ? Math.min(options.partTokenBudget || DEFAULT_PART_TOKEN_BUDGET, options.maxTokens || 3072)
                : Math.min(options.maxTokens || options.maxOutputTokens || 2048, availableForCompletion);
            const maxTokensForPart = Math.min(targetPartTokens, availableForCompletion);

            const useThinkingThisPart = partIndex === 1 && thinkingDecision.enableThinking;

            log.info('AI', `[SGLang] stream (Part ${partIndex}/${maxParts}) → endpoint=${endpoint} model=${model} thinking=${useThinkingThisPart} (${thinkingDecision.reason}) budget=${maxTokensForPart}/${availableForCompletion}`);

            const body = {
                model,
                messages,
                max_tokens:  maxTokensForPart,
                temperature: options.temperature || 0.7,
                stream:      true,
                chat_template_kwargs: { enable_thinking: useThinkingThisPart },
            };
            if (options.response_format) body.response_format = options.response_format;
            if (options.tools) body.tools = options.tools;
            if (options.tool_choice) body.tool_choice = options.tool_choice;

            const partChunks = [];
            let finishReason = 'stop';
            let thinkState = 'detecting'; // 'detecting' | 'in_think' | 'done'
            let prefixBuffer = '';
            let emittedThinkLen = 0;

            const stream = await _retryWithBackoff(() => client.chat.completions.create(body));

            for await (const chunk of stream) {
                const choice = chunk.choices?.[0];
                if (choice?.finish_reason) {
                    finishReason = choice.finish_reason;
                }
                const reasoningDelta = choice?.delta?.reasoning_content;
                if (reasoningDelta && typeof onToken === 'function') {
                    combinedThinking += reasoningDelta;
                    onToken({ type: 'thinking', content: reasoningDelta });
                }

                const delta = choice?.delta?.content;
                if (delta) {
                    if (firstTokenTime === null) {
                        firstTokenTime = Date.now() - streamStart;
                        log.info('AI', `[SGLang] TTFT (Time To First Token): ${firstTokenTime}ms`);
                    }
                    totalTokensCount++;
                    partChunks.push(delta);

                    if (typeof onToken === 'function') {
                        if (thinkState === 'detecting') {
                            prefixBuffer += delta;
                            if (/^\s*<(?:think|thinking)>/i.test(prefixBuffer)) {
                                thinkState = 'in_think';
                                const openMatch = prefixBuffer.match(/^\s*<(?:think|thinking)>\s*/i);
                                prefixBuffer = prefixBuffer.slice(openMatch ? openMatch[0].length : 0);
                            } else if (prefixBuffer.trim().length > 10 || (!prefixBuffer.trim().startsWith('<') && prefixBuffer.trim().length > 0)) {
                                thinkState = 'done';
                                onToken({ type: 'token', content: prefixBuffer });
                                prefixBuffer = '';
                            }
                        } else if (thinkState === 'in_think') {
                            prefixBuffer += delta;
                        } else {
                            onToken({ type: 'token', content: delta });
                        }

                        if (thinkState === 'in_think') {
                            const closeMatch = prefixBuffer.match(/<\/(?:think|thinking)>\s*/i);
                            if (closeMatch) {
                                const thinkBody = prefixBuffer.slice(0, closeMatch.index);
                                const unemittedThink = thinkBody.slice(emittedThinkLen);
                                if (unemittedThink && useThinkingThisPart) {
                                    combinedThinking += unemittedThink;
                                    onToken({ type: 'thinking', content: unemittedThink });
                                }
                                const remainder = prefixBuffer.slice(closeMatch.index + closeMatch[0].length);
                                thinkState = 'done';
                                prefixBuffer = '';
                                if (remainder) {
                                    onToken({ type: 'token', content: remainder });
                                }
                            } else {
                                // Stream thinking tokens live while keeping a 12-char lookbehind for '</think>'
                                const safeEnd = Math.max(emittedThinkLen, prefixBuffer.length - 12);
                                if (safeEnd > emittedThinkLen) {
                                    const liveThinkChunk = prefixBuffer.slice(emittedThinkLen, safeEnd);
                                    emittedThinkLen = safeEnd;
                                    if (useThinkingThisPart && liveThinkChunk) {
                                        combinedThinking += liveThinkChunk;
                                        onToken({ type: 'thinking', content: liveThinkChunk });
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (thinkState !== 'done' && prefixBuffer && typeof onToken === 'function') {
                const cleanedPrefix = prefixBuffer.replace(/<\/?(?:think|thinking)>/gi, '');
                if (cleanedPrefix) {
                    onToken({ type: 'token', content: cleanedPrefix });
                }
            }

            const rawPart = partChunks.join('');
            const cleanedPart = rawPart
                .replace(/<(?:think|thinking)>[\s\S]*?<\/(?:think|thinking)>\s*/gi, '')
                .replace(/<(?:think|thinking)>[\s\S]*$/gi, '')
                .replace(/<\/(?:think|thinking)>/gi, '')
                .trim();
            combinedAnswer += (combinedAnswer && cleanedPart ? '\n' : '') + cleanedPart;

            // Check if we need a Multi-Turn Continuation pass
            if (finishReason !== 'length' || !allowMultiPart || partIndex >= maxParts || !cleanedPart) {
                break;
            }

            log.info('AI', `[SGLang] Stream Part ${partIndex} reached length boundary (${cleanedPart.length} chars). Auto-stitching Part ${partIndex + 1}...`);
            if (typeof onToken === 'function') {
                onToken({ type: 'token', content: '\n' });
            }

            const tailSnippet = cleanedPart.slice(-140).replace(/\s+/g, ' ');
            messages.push({ role: 'assistant', content: cleanedPart });
            messages.push({
                role: 'user',
                content: `Continue writing Part ${partIndex + 1} seamlessly from the exact point where Part ${partIndex} stopped ("...${tailSnippet}"). Do NOT repeat any headings or sentences already written; complete the remaining equations, code, or sections and conclude cleanly. /no_think`,
            });
            partIndex++;
        }

        const totalStreamTime = Date.now() - streamStart;
        const speed = totalStreamTime > 0 ? ((totalTokensCount / totalStreamTime) * 1000).toFixed(2) : 0;
        const finalAnswer = tokenOptimizer.expandOutgoingResponse(combinedAnswer.trim());
        log.success('AI', `[SGLang] stream complete (${finalAnswer.length} chars, ${partIndex} part(s)) | Total Time: ${totalStreamTime}ms | TTFT: ${firstTokenTime || totalStreamTime}ms | Speed: ${speed} tok/s`);
        return { finalAnswer, thinking: combinedThinking.trim(), partsGenerated: partIndex };
    } catch (err) {
        log.error('AI', `[SGLang] stream error: ${err.message}`);
        if (combinedAnswer.length > 0) {
            log.warn('AI', `[SGLang] Recovered partial multi-part stream (${combinedAnswer.length} chars) before failure`);
            return { finalAnswer: combinedAnswer, thinking: combinedThinking.trim(), partsGenerated: partIndex };
        }
        throw err;
    }
    } finally {
        _activeSglangStreams = Math.max(0, _activeSglangStreams - 1);
    }
}

/**
 * Check SGLang endpoint health (ping /models).
 */
const _healthCache = new Map();
const HEALTH_CACHE_TTL_MS = 30000;

async function checkHealth(endpoint = 'chat') {
    if (!SGLANG_ENABLED) return false;
    const now = Date.now();
    const cached = _healthCache.get(endpoint);
    const ttl = cached?.ok ? HEALTH_CACHE_TTL_MS : 2000;
    if (cached && (now - cached.ts) < ttl) {
        return cached.ok;
    }
    try {
        const client = _getClient(endpoint);
        await client.models.list({ timeout: 4000 });
        _healthCache.set(endpoint, { ok: true, ts: now });
        return true;
    } catch (e) {
        _healthCache.set(endpoint, { ok: false, ts: now });
        log.warn('AI', `[SGLang] Health check failed for endpoint=${endpoint}: ${e.message}`);
        return false;
    }
}

module.exports = {
    generateContentWithHistory,
    streamChat,
    checkHealth,
    evaluateThinkingStrategy,
    estimateTokensConservative,
    getActiveStreams: () => _activeSglangStreams,
    SGLANG_ENABLED,
};
