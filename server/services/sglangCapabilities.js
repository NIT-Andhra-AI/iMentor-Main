'use strict';

const log = require('../utils/logger');

let _maxContextTokens = Number.parseInt(process.env.SGLANG_MAX_CONTEXT || '24576', 10) || 24576;
let _fetchPromise     = null;
let _fetched          = false;
let _cachedModelId    = null;
let _runtimeBackend   = 'sglang';

function _baseUrl() {
    const raw =
        process.env.SGLANG_CHAT_URL  ||
        process.env.SGLANG_HEAVY_URL ||
        'http://localhost:8000/v1';
    return raw.replace(/\/v1\/?$/, '');
}

function getModelMaxContext(fallback = 24576) {
    if (process.env.SGLANG_MAX_CONTEXT) {
        const envLimit = Number.parseInt(process.env.SGLANG_MAX_CONTEXT, 10);
        if (Number.isFinite(envLimit) && envLimit >= 2048) return envLimit;
    }
    return _fetched ? _maxContextTokens : fallback;
}

function getModelId() {
    return _cachedModelId;
}

function getRuntimeBackend() {
    return _runtimeBackend;
}

async function fetchModelCapabilities() {
    if (_fetchPromise) return _fetchPromise;

    _fetchPromise = (async () => {
        const base = _baseUrl();
        const modelsUrl = `${base}/v1/models`;
        const headers = process.env.SGLANG_API_KEY
            ? { Authorization: `Bearer ${process.env.SGLANG_API_KEY}` }
            : {};

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const res = await fetch(modelsUrl, {
                    headers,
                    signal: AbortSignal.timeout(5000),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const data = await res.json();
                const model = data?.data?.[0];
                if (model?.id) _cachedModelId = model.id;

                // 1. SGLang / vLLM native max_model_len
                if (model?.max_model_len) {
                    _maxContextTokens = model.max_model_len;
                    _runtimeBackend   = 'sglang';
                    _fetched          = true;
                    log.info('AI', `[SGLang Caps] runtime=sglang model=${_cachedModelId} max_context=${_maxContextTokens} tokens`);
                    return _maxContextTokens;
                }

                // 2. llama-server (llama.cpp ROCm / Vulkan / CPU / OpenVINO) exposes per-slot n_ctx on /props
                try {
                    const propsRes = await fetch(`${base}/props`, {
                        headers,
                        signal: AbortSignal.timeout(3000),
                    });
                    if (propsRes.ok) {
                        const props = await propsRes.json();
                        const slotCtx = props?.default_generation_settings?.n_ctx;
                        if (Number.isFinite(slotCtx) && slotCtx >= 2048) {
                            _maxContextTokens = slotCtx;
                            _runtimeBackend   = 'llama-server';
                            _fetched          = true;
                            log.info('AI', `[SGLang Caps] runtime=llama-server model=${_cachedModelId || 'gguf'} slot_n_ctx=${_maxContextTokens} tokens`);
                            return _maxContextTokens;
                        }
                    }
                } catch (_) {}

                // 3. Fallback to llama.cpp meta.n_ctx_train capped to 24576
                if (model?.meta?.n_ctx_train) {
                    _maxContextTokens = Math.min(24576, model.meta.n_ctx_train);
                    _runtimeBackend   = 'llama-server';
                    _fetched          = true;
                    log.info('AI', `[SGLang Caps] runtime=llama-server model=${_cachedModelId} capped_ctx=${_maxContextTokens} tokens`);
                    return _maxContextTokens;
                }

                throw new Error('max_model_len and /props n_ctx missing from inference server');
            } catch (err) {
                log.warn('AI', `[SGLang Caps] fetch attempt ${attempt}/3 failed: ${err.message}`);
                if (attempt < 3) {
                    await new Promise(r => setTimeout(r, 2000 * attempt));
                }
            }
        }

        log.warn('AI', `[SGLang Caps] Could not reach inference server; using fallback context=${_maxContextTokens}`);
        _fetched = true;
        return _maxContextTokens;
    })();

    return _fetchPromise;
}

fetchModelCapabilities().catch(() => {});

module.exports = { getModelMaxContext, getModelId, getRuntimeBackend, fetchModelCapabilities };
