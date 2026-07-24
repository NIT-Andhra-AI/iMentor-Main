/**
 * Ollama Health Service
 * Checks if Ollama server is reachable by querying its API endpoint.
 */
const axios = require('axios');

async function checkOllamaHealth(url) {
    const baseUrl = (url || process.env.OLLAMA_API_BASE_URL || `http://localhost:${process.env.OLLAMA_PORT || 11434}`).replace(/\/+$/, '');
    try {
        const resp = await axios.get(`${baseUrl}/api/tags`, { timeout: 3000 });
        return resp.status === 200 && Array.isArray(resp.data?.models);
    } catch {
        return false;
    }
}

module.exports = { checkOllamaHealth };