// server/routes/developerApi.js
// Student Developer API Engine: Drop-in replacement for OpenAI and Claude APIs.
const express = require('express');
const crypto = require('crypto');
const { verifyApiKey } = require('../middleware/apiKeyAuth');
const log = require('../utils/logger');

const router = express.Router();

// Apply API Key Verification & Telemetry tracking to all /api/v1 routes
router.use(verifyApiKey);

function getFallbackService() {
  try {
    return require('../services/llmFallbackService');
  } catch (e) {
    return null;
  }
}

function estimateTokenCount(text) {
  if (!text) return 0;
  return Math.ceil(String(text).length / 4);
}

// ── Models Registry ──────────────────────────────────────────────────────────
router.get('/models', (req, res) => {
  const models = [
    { id: 'imentor-default', object: 'model', created: 1787300000, owned_by: 'iMentor', description: 'Primary academic reasoning and multi-modal tutor engine' },
    { id: 'imentor-v2', object: 'model', created: 1787300000, owned_by: 'iMentor', description: 'High-speed conversational agent with tool-calling support' },
    { id: 'imentor-academic', object: 'model', created: 1787300000, owned_by: 'iMentor', description: 'Deep academic synthesis grounded in IEEE papers and textbooks' },
    { id: 'imentor-socratic', object: 'model', created: 1787300000, owned_by: 'iMentor', description: 'Guided pedagogy that uses questions to lead students to answers' },
    { id: 'imentor-coder', object: 'model', created: 1787300000, owned_by: 'iMentor', description: 'Python, Java, C++, and Web Development assistant' }
  ];

  res.json({
    object: 'list',
    data: models
  });
});

// ── 1. OpenAI Compatible: POST /api/v1/chat/completions ───────────────────────
router.post('/chat/completions', async (req, res) => {
  const reqId = `chatcmpl-${crypto.randomBytes(12).toString('hex')}`;
  const {
    model = 'imentor-default',
    messages = [],
    temperature = 0.7,
    max_tokens = 2048,
    stream = false,
    tools = null,
    tool_choice = 'auto',
    response_format = null
  } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: {
        message: 'Invalid request: "messages" must be a non-empty array of message objects.',
        type: 'invalid_request_error',
        param: 'messages',
        code: 'missing_required_parameter'
      }
    });
  }

  // Academic Course Grounding header (Optional)
  const courseContext = req.headers['x-imentor-course-context'] || req.headers['x-imentor-document'] || null;

  // Extract system prompt, chat history, and last user query
  let systemInstruction = 'You are iMentor AI, a high-performance academic engineering and developer assistant.';
  if (courseContext) {
    systemInstruction += `\n[Academic Grounding Context: Ground all explanations in the course/subject "${courseContext}"].`;
  }

  const chatHistory = [];
  let userQuery = '';

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === 'system') {
      systemInstruction = msg.content || systemInstruction;
    } else if (i === messages.length - 1 && msg.role === 'user') {
      userQuery = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
    } else {
      chatHistory.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }]
      });
    }
  }

  if (!userQuery && messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    userQuery = typeof lastMsg.content === 'string' ? lastMsg.content : JSON.stringify(lastMsg.content);
  }

  // If tools are provided, add tool calling instruction to system prompt
  let toolInstruction = '';
  if (Array.isArray(tools) && tools.length > 0) {
    toolInstruction = `\n\n[TOOL CALLING AVAILABLE]\nYou have access to the following tools:\n${JSON.stringify(tools, null, 2)}\nIf you need to call a tool, respond with a JSON object format:\n\`\`\`json\n{"tool_calls": [{"id": "call_123", "type": "function", "function": {"name": "func_name", "arguments": "{\\"arg\\": \\"val\\"}"}}]}\n\`\`\``;
    systemInstruction += toolInstruction;
  }

  const fbService = getFallbackService();
  if (!fbService) {
    req.logApiTransaction({ statusCode: 500, requestPayload: req.body, errorMessage: 'LLM service unavailable' });
    return res.status(500).json({ error: { message: 'LLM engine backend unavailable.', type: 'server_error' } });
  }

  const promptTokens = estimateTokenCount(systemInstruction + userQuery + JSON.stringify(chatHistory));

  // ── Streaming Path (SSE) ───────────────────────────────────────────────────
  if (stream === true) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let fullGeneratedText = '';

    try {
      await fbService.callWithFallback({
        chatHistory,
        userQuery,
        systemPrompt: systemInstruction,
        options: { maxOutputTokens: max_tokens, temperature },
        onToken: (tokenData) => {
          const chunk = typeof tokenData === 'string' ? tokenData : tokenData?.content || '';
          if (chunk) {
            fullGeneratedText += chunk;
            const ssePayload = {
              id: reqId,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model,
              choices: [
                {
                  index: 0,
                  delta: { content: chunk },
                  finish_reason: null
                }
              ]
            };
            res.write(`data: ${JSON.stringify(ssePayload)}\n\n`);
          }
        }
      });

      // Final stop chunk
      const finalChunk = {
        id: reqId,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: 'stop'
          }
        ]
      };
      res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();

      const completionTokens = estimateTokenCount(fullGeneratedText);
      req.logApiTransaction({
        statusCode: 200,
        requestPayload: { model, messages, temperature, max_tokens, stream: true },
        responsePayload: { content: fullGeneratedText },
        tokenUsage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
        streamed: true
      });
    } catch (streamErr) {
      log.error('DEVELOPER_API', `Streaming error: ${streamErr.message}`);
      res.write(`data: {"error": {"message": "${streamErr.message}", "type": "api_error"}}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();

      req.logApiTransaction({
        statusCode: 500,
        requestPayload: req.body,
        errorMessage: streamErr.message,
        streamed: true
      });
    }
    return;
  }

  // ── Non-Streaming Path ─────────────────────────────────────────────────────
  try {
    const result = await fbService.callWithFallback({
      chatHistory,
      userQuery,
      systemPrompt: systemInstruction,
      options: { maxOutputTokens: max_tokens, temperature }
    });

    const completionText = typeof result === 'string' ? result : (result?.finalAnswer || result?.text || '');
    const completionTokens = estimateTokenCount(completionText);

    // Check for JSON tool calls in the output
    let toolCalls = null;
    if (Array.isArray(tools) && tools.length > 0) {
      const match = completionText.match(/"tool_calls"\s*:\s*(\[[^\]]+\])/);
      if (match) {
        try {
          toolCalls = JSON.parse(match[1]);
        } catch (e) {}
      }
    }

    const responseData = {
      id: reqId,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: toolCalls ? null : completionText,
            ...(toolCalls ? { tool_calls: toolCalls } : {})
          },
          finish_reason: toolCalls ? 'tool_calls' : 'stop'
        }
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens
      }
    };

    res.json(responseData);

    req.logApiTransaction({
      statusCode: 200,
      requestPayload: { model, messages, temperature, max_tokens, stream: false },
      responsePayload: responseData,
      toolCalls: toolCalls || [],
      tokenUsage: responseData.usage,
      streamed: false
    });
  } catch (err) {
    log.error('DEVELOPER_API', `Completions error: ${err.message}`);
    res.status(500).json({
      error: {
        message: err.message || 'Error generating AI completion.',
        type: 'api_error'
      }
    });

    req.logApiTransaction({
      statusCode: 500,
      requestPayload: req.body,
      errorMessage: err.message,
      streamed: false
    });
  }
});

// ── 2. Claude / Anthropic Compatible: POST /api/v1/messages ──────────────────
router.post('/messages', async (req, res) => {
  const reqId = `msg_${crypto.randomBytes(12).toString('hex')}`;
  const {
    model = 'claude-3-5-sonnet-20241022',
    messages = [],
    system = 'You are iMentor Claude AI, a structured and articulate academic tutor.',
    max_tokens = 2048,
    temperature = 0.7,
    stream = false,
    tools = null
  } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      type: 'error',
      error: {
        type: 'invalid_request_error',
        message: 'messages: must be a non-empty array'
      }
    });
  }

  const chatHistory = [];
  let userQuery = '';

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const textContent = typeof msg.content === 'string'
      ? msg.content
      : Array.isArray(msg.content)
        ? msg.content.map(c => c.text || JSON.stringify(c)).join(' ')
        : JSON.stringify(msg.content);

    if (i === messages.length - 1 && msg.role === 'user') {
      userQuery = textContent;
    } else {
      chatHistory.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: textContent }]
      });
    }
  }

  const fbService = getFallbackService();
  if (!fbService) {
    req.logApiTransaction({ statusCode: 500, requestPayload: req.body, errorMessage: 'LLM engine unavailable' });
    return res.status(500).json({ type: 'error', error: { message: 'LLM engine backend unavailable.' } });
  }

  const promptTokens = estimateTokenCount(system + userQuery + JSON.stringify(chatHistory));

  // ── Claude Streaming (SSE Events) ──────────────────────────────────────────
  if (stream === true) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let fullGeneratedText = '';

    try {
      // 1. message_start
      res.write(`event: message_start\ndata: ${JSON.stringify({
        type: 'message_start',
        message: {
          id: reqId,
          type: 'message',
          role: 'assistant',
          content: [],
          model,
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: promptTokens, output_tokens: 0 }
        }
      })}\n\n`);

      // 2. content_block_start
      res.write(`event: content_block_start\ndata: ${JSON.stringify({
        type: 'content_block_start',
        index: 0,
        content_block: { type: 'text', text: '' }
      })}\n\n`);

      await fbService.callWithFallback({
        chatHistory,
        userQuery,
        systemPrompt: system,
        options: { maxOutputTokens: max_tokens, temperature },
        onToken: (tokenData) => {
          const chunk = typeof tokenData === 'string' ? tokenData : tokenData?.content || '';
          if (chunk) {
            fullGeneratedText += chunk;
            res.write(`event: content_block_delta\ndata: ${JSON.stringify({
              type: 'content_block_delta',
              index: 0,
              delta: { type: 'text_delta', text: chunk }
            })}\n\n`);
          }
        }
      });

      // 3. content_block_stop
      res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: 0 })}\n\n`);

      const completionTokens = estimateTokenCount(fullGeneratedText);

      // 4. message_delta
      res.write(`event: message_delta\ndata: ${JSON.stringify({
        type: 'message_delta',
        delta: { stop_reason: 'end_turn', stop_sequence: null },
        usage: { output_tokens: completionTokens }
      })}\n\n`);

      // 5. message_stop
      res.write(`event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`);
      res.end();

      req.logApiTransaction({
        statusCode: 200,
        requestPayload: { model, messages, system, stream: true },
        responsePayload: { content: fullGeneratedText },
        tokenUsage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
        streamed: true
      });
    } catch (err) {
      log.error('DEVELOPER_API', `Claude stream error: ${err.message}`);
      res.write(`event: error\ndata: {"error": {"message": "${err.message}"}}\n\n`);
      res.end();

      req.logApiTransaction({
        statusCode: 500,
        requestPayload: req.body,
        errorMessage: err.message,
        streamed: true
      });
    }
    return;
  }

  // ── Claude Non-Streaming ───────────────────────────────────────────────────
  try {
    const result = await fbService.callWithFallback({
      chatHistory,
      userQuery,
      systemPrompt: system,
      options: { maxOutputTokens: max_tokens, temperature }
    });

    const completionText = typeof result === 'string' ? result : (result?.finalAnswer || result?.text || '');
    const completionTokens = estimateTokenCount(completionText);

    const responseData = {
      id: reqId,
      type: 'message',
      role: 'assistant',
      model,
      content: [
        {
          type: 'text',
          text: completionText
        }
      ],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: promptTokens,
        output_tokens: completionTokens
      }
    };

    res.json(responseData);

    req.logApiTransaction({
      statusCode: 200,
      requestPayload: { model, messages, system, stream: false },
      responsePayload: responseData,
      tokenUsage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
      streamed: false
    });
  } catch (err) {
    log.error('DEVELOPER_API', `Claude messages error: ${err.message}`);
    res.status(500).json({
      type: 'error',
      error: {
        type: 'api_error',
        message: err.message
      }
    });

    req.logApiTransaction({
      statusCode: 500,
      requestPayload: req.body,
      errorMessage: err.message,
      streamed: false
    });
  }
});

module.exports = router;
