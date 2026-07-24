/**
 * Ollama Service
 * Direct HTTP calls to Ollama's API for local LLM generation.
 */
const axios = require('axios');

function resolveOllamaUrl(providedUrl) {
    return providedUrl
        || process.env.OLLAMA_URL
        || process.env.OLLAMA_API_BASE_URL
        || `http://localhost:${process.env.OLLAMA_PORT || 11434}`;
}

function resolveOllamaModel(options = {}) {
    return options.model
        || process.env.OLLAMA_MODEL
        || process.env.OLLAMA_DEFAULT_MODEL
        || 'qwen2.5-coder:7b';
}

async function checkHealth() {
    try {
        const url = resolveOllamaUrl().replace(/\/+$/, '');
        const resp = await axios.get(`${url}/api/tags`, { timeout: 3000 });
        return resp.status === 200 && Array.isArray(resp.data?.models);
    } catch {
        return false;
    }
}

async function generateContentWithHistory(chatHistory, currentUserQuery, systemPromptText = null, options = {}) {
    const baseUrl = resolveOllamaUrl(options.ollamaUrl).replace(/\/+$/, '');
    const model = resolveOllamaModel(options);
    const timeout = options.timeout || 30000;

    const messages = [];
    if (systemPromptText) {
        messages.push({ role: 'system', content: systemPromptText });
    }
    if (Array.isArray(chatHistory)) {
        for (const msg of chatHistory) {
            const role = msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : (msg.role || 'user');
            const content = Array.isArray(msg.parts) ? msg.parts[0].text : (msg.text || msg.content || '');
            if (role && content) messages.push({ role, content });
        }
    }
    if (currentUserQuery) {
        messages.push({ role: 'user', content: currentUserQuery });
    }

    try {
        const resp = await axios.post(`${baseUrl}/api/chat`, {
            model,
            messages,
            stream: false,
            options: {
                temperature: options.temperature ?? 0.7,
                num_predict: options.maxOutputTokens ?? options.maxTokens ?? 4096,
            }
        }, { timeout });

        return resp.data?.message?.content || '';
    } catch (err) {
        throw new Error(`Ollama error: ${err.message}`);
    }
}

async function streamChat(chatHistory, currentUserQuery, systemPromptText = null, options = {}, onToken) {
    const text = await generateContentWithHistory(chatHistory, currentUserQuery, systemPromptText, options);
    if (onToken && typeof onToken === 'function') {
        onToken({ type: 'token', content: text });
    }
    return text;
}

const SGLANG_ENABLED = false;

module.exports = {
    generateContentWithHistory,
    generateContent: (prompt, options = {}) =>
        generateContentWithHistory([], typeof prompt === 'string' ? prompt : prompt.prompt, null, options),
    streamChat,
    checkHealth,
    SGLANG_ENABLED,
    DEFAULT_MAX_OUTPUT_TOKENS_OLLAMA_KG: 2000,
    DEFAULT_MAX_OUTPUT_TOKENS_OLLAMA: 2000,
};
