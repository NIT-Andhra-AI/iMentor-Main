// server/services/geminiService.js
// Delegated to local Antigravity CLI (agyCliService) — Gemini REST API fallback removed.
const agyCliService = require("./agyCliService");

module.exports = {
    generateContentWithHistory: agyCliService.generateContentWithHistory,
    generateText: agyCliService.generateText,
    generateContentWithVision: agyCliService.generateContentWithVision,
    DEFAULT_MAX_OUTPUT_TOKENS_KG: agyCliService.DEFAULT_MAX_OUTPUT_TOKENS_KG
};
