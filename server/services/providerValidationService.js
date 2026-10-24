const axios = require("axios");
const log = require("../utils/logger");
const agyCliService = require("./agyCliService");

async function fetchSglangModels() {
  const base = (process.env.SGLANG_CHAT_URL || "http://127.0.0.1:8000/v1").replace(/\/+$/, "");
  const response = await axios.get(`${base}/models`, { timeout: 5000 });
  const models = Array.isArray(response.data?.data)
    ? response.data.data.map(m => m.id).filter(Boolean)
    : ["Qwen/Qwen3-8B-AWQ"];
  return { provider: "sglang", endpoint: base, models };
}

async function fetchAgyModels() {
  if (!agyCliService.isAvailable()) {
    throw new Error("AGY CLI binary not found on server.");
  }
  return {
    provider: "gemini",
    endpoint: agyCliService.AGY_BIN,
    models: [
      "gemini-3.8-flash-high",
      "gemini-3.8-flash-medium",
      "gemini-3.8-flash-low",
      "claude-sonnet-5-5-high",
      "claude-opus-5-5-high",
      "gpt-oss-120b-medium"
    ]
  };
}

async function fetchGroqModels(apiKey) {
  const response = await axios.get("https://api.groq.com/openai/v1/models", {
    timeout: 7000,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    }
  });
  const models = Array.isArray(response.data?.data)
    ? response.data.data.map(m => m.id).filter(Boolean)
    : [];
  return { provider: "groq", models };
}

async function fetchAvailableModels({ provider, apiKey, ollamaUrl }) {
  if (provider === "sglang" || provider === "local_llm" || provider === "ollama") {
    return fetchSglangModels();
  }
  if (provider === "gemini" || provider === "agy") {
    return fetchAgyModels();
  }
  if (provider === "groq") {
    if (!apiKey) throw new Error("API key required for Groq validation.");
    return fetchGroqModels(apiKey);
  }
  throw new Error(`Unsupported provider: ${provider}`);
}

async function validateProviderConnection({ provider, apiKey, ollamaUrl }) {
  try {
    const data = await fetchAvailableModels({ provider, apiKey, ollamaUrl });
    return {
      ok: true,
      provider,
      endpoint: data.endpoint,
      models: data.models || [],
      message: "Connection validated successfully."
    };
  } catch (error) {
    const msg = error.response?.data?.error?.message || error.response?.data?.error || error.message;
    log.warn("AI", `Provider validation failed for ${provider}: ${msg}`);
    return {
      ok: false,
      provider,
      models: [],
      message: msg || "Validation failed."
    };
  }
}

module.exports = {
  validateProviderConnection,
  fetchAvailableModels,
};
