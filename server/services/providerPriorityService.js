const sglangService = require('./sglangService');

const BASE_PROVIDER_PRIORITY = ['gemini', 'groq', 'sglang'];
const PROVIDER_FALLBACK_ORDER = BASE_PROVIDER_PRIORITY.slice();

function normalizeProvider(provider) {
    if (process.env.LOCAL_GPU_ONLY !== 'false') return 'sglang';
    if (typeof provider !== 'string') return 'sglang';
    const normalized = provider.trim().toLowerCase();
    if (normalized === 'local_llm' || normalized === 'ollama') return 'sglang';
    if (BASE_PROVIDER_PRIORITY.includes(normalized)) return normalized;
    return 'sglang';
}

function getProviderChain(preferredProvider) {
    if (process.env.LOCAL_GPU_ONLY !== 'false') return ['sglang'];
    const preferred = normalizeProvider(preferredProvider);
    // Build chain starting with preferred, then append remaining providers in BASE_PROVIDER_PRIORITY order.
    const list = BASE_PROVIDER_PRIORITY.slice();
    // Ensure uniqueness and preferred-first ordering
    const ordered = [preferred, ...list.filter(p => p !== preferred)];
    return ordered;
}

function getApiKeyForProvider(provider, preferredProvider, userApiKey) {
    const preferred = normalizeProvider(preferredProvider);
    if (provider === 'gemini') {
        return process.env.GEMINI_API_KEY || (preferred === 'gemini' ? userApiKey : null) || null;
    }
    return null;
}

async function resolveProviderByPreference({
    preferredProvider,
    userApiKey = null,
    userLocalLlmUrl = null,
}) {
    const preferred = normalizeProvider(preferredProvider);
    const chain = getProviderChain(preferred);

    const isSglangHealthy = await sglangService.checkHealth('chat');

    const availability = {
        gemini: Boolean(process.env.GEMINI_API_KEY || (preferred === 'gemini' && userApiKey)),
        groq: Boolean(process.env.GROQ_API_KEY || (preferred === 'groq' && userApiKey)),
        sglang: isSglangHealthy
    };

    return {
        chosenProvider: preferred,
        chain,
        availability,
        workingLocalLlmUrl: process.env.SGLANG_CHAT_URL || 'http://localhost:8000/v1',
        apiKey: getApiKeyForProvider(preferred, preferredProvider, userApiKey),
    };
}

module.exports = {
    PROVIDER_FALLBACK_ORDER,
    normalizeProvider,
    getProviderChain,
    getApiKeyForProvider,
    resolveProviderByPreference,
};
