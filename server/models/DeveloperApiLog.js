// server/models/DeveloperApiLog.js
const mongoose = require('mongoose');

const DeveloperApiLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
    apiKeyPrefix: {
      type: String,
      index: true,
      default: 'imk_live_***',
    },
    endpoint: {
      type: String,
      required: true,
      index: true, // e.g. "/v1/chat/completions", "/v1/messages"
    },
    httpMethod: {
      type: String,
      default: 'POST',
    },
    statusCode: {
      type: Number,
      default: 200,
      index: true,
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
    // ── Device & Client Telemetry ─────────────────────────────────────────────
    clientIp: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: '',
    },
    device: {
      os: { type: String, default: 'Unknown' },
      browser: { type: String, default: 'Unknown' },
      platform: { type: String, default: 'desktop' },
      isMobile: { type: Boolean, default: false },
      clientLanguage: { type: String, default: 'en' },
    },
    origin: {
      type: String,
      default: '',
    },
    // ── Payloads & Execution Audit ────────────────────────────────────────────
    requestPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    responsePayload: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    toolCalls: [
      {
        type: mongoose.Schema.Types.Mixed,
      }
    ],
    tokenUsage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
    streamed: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast student dashboard queries
DeveloperApiLogSchema.index({ userId: 1, createdAt: -1 });

const DeveloperApiLog = mongoose.model('DeveloperApiLog', DeveloperApiLogSchema);
module.exports = DeveloperApiLog;
