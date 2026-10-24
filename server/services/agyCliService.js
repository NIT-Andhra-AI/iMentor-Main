/**
 * server/services/agyCliService.js
 *
 * Executes LLM requests via the local Antigravity CLI (`agy`) binary
 * powered by the Google AI Ultra plan instead of the Gemini REST API.
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const log = require("../utils/logger");
const tokenOptimizer = require("../utils/tokenOptimizer");

const AGY_BIN = process.env.AGY_CLI_BIN || "/home/sri/.local/bin/agy";
const DEFAULT_AGY_MODEL = process.env.AGY_CLI_MODEL || "gemini-3.8-flash-high";

const VALID_AGY_MODELS = new Set([
    "gemini-3.8-flash-high",
    "gemini-3.8-flash-medium",
    "gemini-3.8-flash-low",
    "claude-opus-5-5-low",
    "claude-opus-5-5-medium",
    "claude-opus-5-5-high",
    "claude-sonnet-5-5-low",
    "claude-sonnet-5-5-medium",
    "claude-sonnet-5-5-high",
    "gpt-oss-120b-medium"
]);

function resolveAgyModel(requestedModel) {
    if (!requestedModel || typeof requestedModel !== "string") return DEFAULT_AGY_MODEL;
    const clean = requestedModel.replace(/^models\//, "").trim();
    if (VALID_AGY_MODELS.has(clean)) return clean;
    if (clean.includes("low")) return "gemini-3.8-flash-low";
    if (clean.includes("medium")) return "gemini-3.8-flash-medium";
    return DEFAULT_AGY_MODEL;
}

function isAvailable() {
    try {
        return fs.existsSync(AGY_BIN);
    } catch {
        return false;
    }
}

function stripThinkingTags(text) {
    if (!text || typeof text !== "string") return "";
    return text
        .replace(/<think>[\s\S]*?<\/think>\s*/gi, "")
        .replace(/<thinking>[\s\S]*?<\/thinking>\s*/gi, "")
        .trim();
}

function buildCompiledPrompt(chatHistory = [], currentUserQuery = "", systemPromptText = null) {
    const parts = [];
    if (systemPromptText && typeof systemPromptText === "string" && systemPromptText.trim()) {
        parts.push(`[System Instructions]\n${systemPromptText.trim()}`);
    }
    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
        const formattedHistory = chatHistory
            .map((msg) => {
                const role = msg.role === "model" || msg.role === "assistant" ? "Assistant" : "User";
                const text = Array.isArray(msg.parts)
                    ? msg.parts.map((p) => p.text || "").join(" ")
                    : msg.content || msg.text || "";
                return text ? `${role}: ${text}` : null;
            })
            .filter(Boolean)
            .join("\n\n");
        if (formattedHistory) {
            parts.push(`[Conversation History]\n${formattedHistory}`);
        }
    }
    parts.push(`[User Query]\n${currentUserQuery}`);
    return parts.join("\n\n");
}

function runAgyProcess(prompt, model, onChunk = null, timeoutMs = 120000) {
    return new Promise((resolve, reject) => {
        const resolvedModel = resolveAgyModel(model);
        const args = [
            "--model", resolvedModel,
            "--disable-slash-commands",
            "--print", prompt
        ];

        const env = {
            ...process.env,
            HOME: process.env.HOME || "/home/sri",
            PATH: `/home/sri/.local/bin:/home/sri/.nvm/versions/node/v22.18.0/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ""}`
        };

        const child = spawn(AGY_BIN, args, {
            cwd: "/tmp",
            env,
            stdio: ["ignore", "pipe", "pipe"]
        });

        let stdout = "";
        let stderr = "";
        let finished = false;

        const timer = setTimeout(() => {
            if (!finished) {
                finished = true;
                child.kill("SIGKILL");
                reject(new Error(`AGY CLI timed out after ${timeoutMs}ms`));
            }
        }, timeoutMs);

        child.stdout.on("data", (data) => {
            const chunk = data.toString();
            stdout += chunk;
            if (typeof onChunk === "function") {
                onChunk(chunk);
            }
        });

        child.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        child.on("error", (err) => {
            if (!finished) {
                finished = true;
                clearTimeout(timer);
                reject(err);
            }
        });

        child.on("close", (code) => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);

            const cleaned = stripThinkingTags(stdout);
            if (code === 0 && cleaned) {
                resolve(cleaned);
            } else if (cleaned) {
                resolve(cleaned);
            } else {
                reject(new Error(`AGY CLI exited with code ${code}: ${stderr.trim() || "Empty output"}`));
            }
        });
    });
}

async function generateContentWithHistory(chatHistory, currentUserQuery, systemPromptText = null, options = {}) {
    if (!currentUserQuery || typeof currentUserQuery !== "string" || !currentUserQuery.trim()) {
        throw new Error("currentUserQuery must be a non-empty string.");
    }

    const modelToUse = resolveAgyModel(options.geminiModel || options.model || DEFAULT_AGY_MODEL);
    const optimizedSystemPrompt = tokenOptimizer.minifyPrompt(tokenOptimizer.injectSystemInstruction(systemPromptText, options));
    const optimizedQuery = tokenOptimizer.minifyPrompt(currentUserQuery);
    const optimizedHistory = tokenOptimizer.optimizeIncomingMessages(chatHistory || []);

    const compiledPrompt = buildCompiledPrompt(optimizedHistory, optimizedQuery, optimizedSystemPrompt);
    log.info("AI", `[AGY CLI] Executing prompt with model=${modelToUse}`);

    const rawResponse = await runAgyProcess(compiledPrompt, modelToUse, null, options.timeout || 120000);
    const expanded = tokenOptimizer.expandOutgoingResponse(rawResponse);
    log.success("AI", `[AGY CLI] Response received (${expanded.length} chars)`);
    return expanded;
}

async function generateText(prompt, config = {}) {
    return generateContentWithHistory([], prompt, config.systemPrompt || null, config);
}

async function generateContentWithVision(textPrompt, imageData, options = {}) {
    let tmpFile = null;
    try {
        if (imageData && imageData.data) {
            const ext = (imageData.mimeType || "").includes("png") ? "png" : "jpg";
            tmpFile = path.join(os.tmpdir(), `agy_vision_${crypto.randomBytes(6).toString("hex")}.${ext}`);
            fs.writeFileSync(tmpFile, Buffer.from(imageData.data, "base64"));
        }
        const fullPrompt = tmpFile
            ? `${textPrompt}\n\n[Attached image path: ${tmpFile}]`
            : textPrompt;
        return await generateContentWithHistory([], fullPrompt, options.systemPrompt || null, options);
    } finally {
        if (tmpFile && fs.existsSync(tmpFile)) {
            try { fs.unlinkSync(tmpFile); } catch {}
        }
    }
}

async function streamChat({ messages = [], model = DEFAULT_AGY_MODEL, systemPrompt = null, onToken, options = {} }) {
    const history = messages.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        content: m.content || ""
    }));
    const currentQuery = messages[messages.length - 1]?.content || "";
    const compiledPrompt = buildCompiledPrompt(history, currentQuery, systemPrompt);
    const modelToUse = resolveAgyModel(model);

    log.info("AI", `[AGY CLI] Streaming with model=${modelToUse}`);

    const fullText = await runAgyProcess(
        compiledPrompt,
        modelToUse,
        (chunk) => {
            if (typeof onToken === "function" && chunk) {
                if (options.handleThinkingTags) {
                    onToken(chunk);
                } else {
                    onToken({ type: "token", content: chunk });
                }
            }
        },
        options.timeout || 120000
    );

    return fullText;
}

module.exports = {
    AGY_BIN,
    DEFAULT_AGY_MODEL,
    isAvailable,
    resolveAgyModel,
    stripThinkingTags,
    generateContentWithHistory,
    generateText,
    generateContentWithVision,
    streamChat,
    DEFAULT_MAX_OUTPUT_TOKENS_KG: 8192
};
