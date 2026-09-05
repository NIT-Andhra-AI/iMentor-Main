// server/routes/chat/handlers/standardHandler.js
// Handles standard chat — both advanced reasoning (ToT/ReAct) and agentic paths.
const ChatHistory = require('../../../models/ChatHistory');
const LLMPerformanceLog = require('../../../models/LLMPerformanceLog');
const { processQueryWithToT_Streaming } = require('../../../services/totOrchestrator');
const { processAgenticRequest } = require('../../../services/agentService');
const { generateCues } = require('../../../services/criticalThinkingService');
const { extractAndStoreKgFromText } = require('../../../services/kgExtractionService');
const { processQueryWithReAct } = require('../../../services/toolReactOrchestrator');
const gamificationService = require('../../../services/gamificationService');
const streakService = require('../../../services/streakService');
const energyService = require('../../../services/energyService');
const knowledgeStateService = require('../../../services/knowledgeStateService');
const socketService = require('../../../services/socketService');
const { triggerPeriodicAnalysis } = require('../../../middleware/contextualMemoryMiddleware');
const { isDirectAnswer, isTotRoute, isTotRouteUserExplicit, getSemanticRoute } = require('../../../services/semanticRouterService');
const { ROUTING_THRESHOLDS } = require('../../../config/routingConfig');
const log = require('../../../utils/logger');
const { streamEvent, TUTOR_MODE_TYPES, enforceGeneralSocraticStyle } = require('../helpers');
const { criticalPathDuration, llmCallDuration } = require('../../../utils/metrics');

/**
 * Always handles — this is the final path in the chain.
 *
 * @param {object} res  - Express response
 * @param {object} ctx  - Request context built by index.js
 */
async function handle(res, ctx) {
    const {
        query, sessionId, userId,
        llmConfig, historyForLlm, requestContext,
        user, chatSession, userMessageForDb,
        criticalThinkingEnabled, useReAct,
        tutorMode, tutorModeType,
        documentContextName, bountyId, bountyAnswer,
        chosenModel, routerLogic, queryIntent, classification,
        estimatedComplexityScore, queryTokenCount, simpleFastPath,
        finalSystemPrompt,
        startTime, performanceTracker,
        capturePerformance, captureDebugFromResponse, captureRedisStateFromCache,
        contextualMemory,
        userRequestedToT,  // Issue 1.2: true when user explicitly enabled the ToT toggle
        disabledToggles,   // Issue 1.3: toggles the system silently disabled
        hybridDecomposition,      // sub-query routing plan from hybridQueryDecomposer
        buildHybridContextBlock,  // prompt injection helper
    } = ctx;

    // ── SEMANTIC ROUTE DECISION ─────────────────────────────────────────────
    // Reuse classification result already computed by queryClassifierService (attached to ctx).
    // queryIntent is populated by the chat index.js from classifyQuery() which now embeds semantic route.
    // ctx.semanticRouting comes from semanticRouter.js (routeQuery); ctx.queryIntent is the mapped string
    const { mapIntentToRoute } = require('../../../services/semanticRouter');
    const semanticRoute      = mapIntentToRoute(ctx.semanticRouting?.intent) || classification?.semanticRoute || null;
    const semanticConfidence = ctx.semanticRouting?.confidence  || classification?.semanticConfidence || 0;

    // ── DIRECT ANSWER FAST PATH ───────────────────────────────────────────────
    // Bypass ALL heavy orchestrators — stream answer directly via SGLang / fallback.
    // Triggered when: semantic route is 'direct_answer' AND confidence >= threshold
    // AND user has NOT explicitly enabled advanced reasoning.
    if (
        semanticRoute === 'direct_answer' &&
        semanticConfidence >= ROUTING_THRESHOLDS.SEMANTIC_DIRECT_ANSWER &&
        !criticalThinkingEnabled && !useReAct &&
        !documentContextName &&       // don't skip RAG when document is selected
        !ctx.useWebSearch &&           // don't skip when user enabled web search
        !ctx.useAcademicSearch         // don't skip when user enabled academic search
    ) {
        log.info('AI', `[CRITICAL_PATH] DIRECT_ANSWER route — streaming via fast path (conf=${semanticConfidence.toFixed(2)})`);
        const directStart = Date.now();
        let directSuccess = false;
        
        try {
            res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();

            const sglangService = require('../../../services/sglangService');
            const llmFallback = require('../../../services/llmFallbackService');
            
            let fullDirectText = '';
            
            const isGreeting = /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening|day)|howdy|sup)\b/i.test(query.trim());
            const directSystemPrompt = isGreeting
                ? 'You are iMentor, a warm, highly knowledgeable, and encouraging academic AI tutor. Respond warmly and briefly to the greeting (1-2 sentences), introducing yourself and asking how you can help with their coursework, studies, or technical questions today. Do not output thinking tags.'
                : (finalSystemPrompt || 'You are iMentor, an elite academic AI tutor. Provide a clear, concise, and helpful direct answer.');

            try {
                // Try SGLang streaming first
                if (process.env.SGLANG_ENABLED === 'true') {
                    const sglangStream = await sglangService.streamChat(
                        historyForLlm.slice(-4),
                        query.trim(),
                        directSystemPrompt,
                        { maxTokens: ROUTING_THRESHOLDS.DIRECT_ANSWER_MAX_TOKENS, temperature: 0.7, endpoint: 'chat' },
                        (tokenData) => {
                            const chunk = typeof tokenData === 'string' ? tokenData : tokenData?.content || '';
                            if (chunk) {
                                fullDirectText += chunk;
                                streamEvent(res, { type: 'token', content: chunk });
                            }
                        }
                    );
                    if (sglangStream?.finalAnswer && !fullDirectText) {
                        fullDirectText = sglangStream.finalAnswer;
                    }
                } else {
                    // SGLang not enabled — use universal fallback service
                    const fbResult = await llmFallback.callWithFallback({
                        chatHistory: historyForLlm.slice(-4),
                        userQuery: query.trim(),
                        systemPrompt: directSystemPrompt,
                        options: { maxOutputTokens: ROUTING_THRESHOLDS.DIRECT_ANSWER_MAX_TOKENS, temperature: 0.7 },
                        preferredProvider: chosenModel?.provider || 'sglang',
                        userApiKeys: {
                            gemini: llmConfig?.apiKey && chosenModel?.provider === 'gemini' ? llmConfig.apiKey : process.env.GEMINI_API_KEY,
                            groq: llmConfig?.apiKey && chosenModel?.provider === 'groq' ? llmConfig.apiKey : process.env.GROQ_API_KEY,
                        },
                        onToken: (tokenData) => {
                            const chunk = typeof tokenData === 'string' ? tokenData : tokenData?.content || '';
                            if (chunk) {
                                fullDirectText += chunk;
                                streamEvent(res, { type: 'token', content: chunk });
                            }
                        }
                    });
                    if (fbResult?.text && !fullDirectText) {
                        fullDirectText = fbResult.text;
                    }
                }
            } catch (llmErr) {
                log.warn('AI', `[DIRECT_ANSWER] Primary stream failed: ${llmErr.message}. Attempting self-healing fallback.`);
                // Self-healing: if it's a greeting or simple query, provide a friendly dynamic fallback
                if (isGreeting) {
                    fullDirectText = "Hello! 👋 I'm **iMentor**, your AI academic tutor and research companion. How can I help you with your coursework, coding, or studies today?";
                } else {
                    // Try fallback call
                    const selfHealResult = await llmFallback.callWithFallback({
                        chatHistory: historyForLlm.slice(-2),
                        userQuery: query.trim(),
                        systemPrompt: directSystemPrompt,
                        options: { maxOutputTokens: 512, temperature: 0.5 },
                        preferredProvider: 'sglang',
                    }).catch(() => null);
                    fullDirectText = selfHealResult?.text || `Hello! I'm iMentor. I'm ready to help you with ${query.trim()}. What specific question do you have?`;
                }
                streamEvent(res, { type: 'token', content: fullDirectText });
            }

            const elapsed = Date.now() - directStart;
            log.info('AI', `[CRITICAL_PATH] direct_answer streamed in ${elapsed}ms (${fullDirectText.length} chars)`);

            const finalAiMessage = {
                sender: 'bot',
                role: 'model',
                text: fullDirectText,
                parts: [{ text: fullDirectText }],
                timestamp: new Date(),
                source_pipeline: 'direct_answer',
                confidenceScore: Math.round(semanticConfidence * 100),
                references: [],
                thinking: null,
            };

            streamEvent(res, { type: 'final_answer', content: finalAiMessage });
            res.end();
            directSuccess = true;

            // ── Non-blocking post-response: save to DB + fast XP ──────────────
            setImmediate(async () => {
                try {
                    const words = query.split(/\s+/).filter(Boolean);
                    const uniqueVocab = new Set(words.map(w => w.toLowerCase())).size;
                    const hasQuestion = /\?/.test(query);
                    const xpAwarded = Math.min(20, Math.max(1,
                        Math.round(words.length / 5 + uniqueVocab * 2 + (hasQuestion ? 10 : 0))
                    ));

                    const aiMsgForDb = {
                        role: 'model',
                        parts: [{ text: fullDirectText }],
                        timestamp: new Date(),
                        source_pipeline: 'direct_answer',
                    };
                    await ChatHistory.findOneAndUpdate(
                        { sessionId, userId },
                        {
                            $push: { messages: { $each: [userMessageForDb, aiMsgForDb], $slice: -100 } },
                            $set: { updatedAt: new Date() },
                        },
                        { upsert: true }
                    );

                    if (typeof gamificationService?.awardXP === 'function') {
                        await gamificationService.awardXP(userId, xpAwarded, 'direct_answer').catch(() => {});
                    }
                } catch (e) {
                    log.warn('AI', `[DIRECT_ANSWER] Post-response save failed: ${e.message}`);
                }
            });
            return;
        } catch (directErr) {
            log.warn('AI', `[DIRECT_ANSWER] Outer handler caught (${directErr.message}) — ensuring fallback response`);
            if (!res.headersSent) {
                // Headers not sent yet, proceed to standard path
            } else if (!res.writableEnded) {
                const fallbackGreeting = "Hello! 👋 I'm **iMentor**, your academic tutor. How can I help you today?";
                streamEvent(res, {
                    type: 'final_answer',
                    content: {
                        sender: 'bot',
                        role: 'model',
                        text: fallbackGreeting,
                        parts: [{ text: fallbackGreeting }],
                        timestamp: new Date(),
                        source_pipeline: 'direct_answer_fallback'
                    }
                });
                res.end();
                return;
            }
        }
    }

    // ToT / ReAct only fires when user explicitly toggles — never auto-triggered
    const advancedReasoningRequested = Boolean(criticalThinkingEnabled || userRequestedToT || useReAct);

    // ── TOT STRICT GATE ───────────────────────────────────────────────────────
    // Route user-explicit ToT toggle or high-complexity queries to processQueryWithToT_Streaming
    const totAllowed = advancedReasoningRequested && (
        userRequestedToT || criticalThinkingEnabled || isTotRoute({ route: semanticRoute, confidence: semanticConfidence }, estimatedComplexityScore) || useReAct
    );
    if (userRequestedToT) {
        log.info('AI', '[CRITICAL_PATH] User Thinking Mode active → routing to ToT reasoning stream');
    } else if (advancedReasoningRequested && !totAllowed && !useReAct) {
        const threshold = ROUTING_THRESHOLDS.TOT_MIN_COMPLEXITY;
        log.info('AI', `[CRITICAL_PATH] ToT suppressed: semanticRoute=${semanticRoute} score=${estimatedComplexityScore} < threshold=${threshold} (system-auto) — routing to standard path`);
    }
    const shouldStreamReasoningFlow = totAllowed;

    // ── ADVANCED REASONING: ToT / ReAct ──────────────────────────────────────
    if (shouldStreamReasoningFlow) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
        streamEvent(res, { type: 'status_update', content: 'Activating advanced reasoning...' });

        const accumulatedThoughts = [];

        // Fire ack prefix lookup concurrently — don't block TTFT
        const expertAck = contextualMemory?.expertAcknowledgment;
        const ackPrefixPromise = expertAck
            ? Promise.resolve(expertAck)
            : knowledgeStateService.getAcknowledgmentPrefix(userId, query);

        // Stream the ack prefix as soon as it resolves (non-blocking)
        ackPrefixPromise.then(ackPrefix => {
            if (ackPrefix && !res.writableEnded) {
                streamEvent(res, { type: 'token', content: ackPrefix });
            }
        }).catch(() => { /* ack prefix is optional */ });

        const interceptingStreamCallback = (eventData) => {
            if (eventData.type === 'thought') accumulatedThoughts.push(eventData.content);
            // SSE is the primary transport for the active HTTP connection;
            // Socket.IO is reserved for cross-tab push events only.
            streamEvent(res, eventData);
        };

        let orchestatorResult;
        const orchestrationStart = Date.now();
        if (useReAct) {
            log.info('AI', 'Activating ReAct Orchestrator');
            orchestatorResult = await processQueryWithReAct(query.trim(), historyForLlm, requestContext, interceptingStreamCallback);
        } else {
            log.info('AI', 'Activating ToT Orchestrator');
            orchestatorResult = await processQueryWithToT_Streaming(query.trim(), historyForLlm, requestContext, interceptingStreamCallback);
        }
        performanceTracker.addLlm(Date.now() - orchestrationStart);
        if (orchestatorResult?.performanceDiagnostics) {
            performanceTracker.merge(orchestatorResult.performanceDiagnostics);
        }

        try {
            const endTime = Date.now();

            let agentResponse = { ...orchestatorResult, thinking: accumulatedThoughts.join('') || orchestatorResult.thinking, criticalThinkingCues: null };

            if (tutorMode && tutorModeType === TUTOR_MODE_TYPES.GENERAL_SOCRATIC && agentResponse?.finalAnswer) {
                agentResponse.finalAnswer = enforceGeneralSocraticStyle(agentResponse.finalAnswer, query);
            }

            const logEntry = new LLMPerformanceLog({
                userId, sessionId,
                query: query.trim(),
                response: agentResponse.finalAnswer,
                chosenModelId: chosenModel.modelId,
                routerLogic,
                responseTimeMs: endTime - startTime
            });
            // logEntry._id is assigned by Mongoose immediately on construction (before save)
            agentResponse.logId = logEntry._id;

            const aiMessageForDb = {
                ...agentResponse,
                sender: 'bot', role: 'model',
                text: agentResponse.finalAnswer,
                parts: [{ text: agentResponse.finalAnswer }],
                timestamp: new Date()
            };
            delete aiMessageForDb.criticalThinkingCues;
            delete aiMessageForDb.sender;
            delete aiMessageForDb.text;
            delete aiMessageForDb.action;

            const sessionModeSet = {};
            if (tutorMode) sessionModeSet.isTutorMode = true;
            if (tutorModeType) sessionModeSet.tutorModeType = tutorModeType;
            await ChatHistory.findOneAndUpdate(
                { sessionId, userId },
                {
                    $push: { messages: { $each: [userMessageForDb, aiMessageForDb], $slice: -100 } },
                    ...(Object.keys(sessionModeSet).length > 0 ? { $set: { ...sessionModeSet, updatedAt: new Date() } } : {})
                },
                { upsert: true }
            );

            if (agentResponse.finalAnswer) {
                // [NIGHT_SHIFT] extractAndStoreKgFromText moved to nightlySessionEvaluator.js (2AM cron)
                // extractAndStoreKgFromText(agentResponse.finalAnswer, sessionId, userId, llmConfig, documentContextName || null);
            }

            // Gamification: deferred, non-blocking
            setImmediate(async () => {
                try {
                    const streakUpdate = await streakService.updateStreak(userId);
                    const profile = await gamificationService.getOrCreateProfile(userId);

                    // [NIGHT_SHIFT] Full LLM XP evaluation moved to nightlySessionEvaluator.js (2AM cron).
                    // Live path: deterministic heuristic only — zero extra LLM calls on the critical path.
                    const words = (agentResponse?.finalAnswer || '').split(/\s+/).length;
                    const hasQuestion = /\?/.test(query);
                    const vocabulary = new Set(query.toLowerCase().split(/\W+/).filter(Boolean)).size;
                    const heuristicScore = Math.min(100, Math.round(words / 5 + vocabulary * 2 + (hasQuestion ? 10 : 0)));

                    const creditsMultiplier = streakUpdate.multiplier || 1.0;
                    const finalCredits = Math.round(heuristicScore * creditsMultiplier);

                    await gamificationService.awardLearningCredits(userId, finalCredits, 'understanding', documentContextName || 'general');

                    if (documentContextName) {
                        const currentScore = profile.topicScores.get(documentContextName) || 0;
                        await gamificationService.updateTopicScore(userId, documentContextName, currentScore + finalCredits);
                    }

                    const { fatigueScore } = await energyService.detectFatigue(userId, sessionId);
                    await energyService.updateEnergyBar(userId, fatigueScore);
                } catch (gamError) {
                    log.error('SYSTEM', 'Gamification background error', gamError);
                }
            });

            let bountyResult = null;
            if (bountyId && bountyAnswer) {
                try {
                    const bountyService = require('../../../services/bountyService');
                    bountyResult = await bountyService.submitBountyAnswer(bountyId, userId, bountyAnswer);
                    log.success('SYSTEM', `Bounty submitted for ${bountyId}`);
                } catch (bountyError) {
                    log.error('SYSTEM', 'Bounty submission failed', bountyError);
                }
            }

            const finalAnswerContent = bountyResult ? { ...agentResponse, bountyResult } : agentResponse;
            captureDebugFromResponse(finalAnswerContent);
            await captureRedisStateFromCache();
            capturePerformance({
                intent: queryIntent,
                reasoningDepth: agentResponse?.reasoningMeta?.reasoningDepth || agentResponse?.reasoningMeta?.branchCount || 1,
                llmCallCount: agentResponse?.reasoningMeta?.llmCallCount || 1,
                tokenUsageEstimate: Math.ceil(String(agentResponse?.finalAnswer || '').length / 4),
                branchCount: agentResponse?.totalBranchesGenerated || agentResponse?.reasoningMeta?.branchCount || 1,
                toolCalls: agentResponse?.reasoningMeta?.toolCalls || 0,
            });
            streamEvent(res, { type: 'final_answer', content: finalAnswerContent });
            res.end();

            // Deferred post-response saves (non-blocking — off the critical path)
            setImmediate(() => {
                logEntry.save().catch(e => log.error('PERF', `Log save failed: ${e.message}`));
                // [NIGHT_SHIFT] generateCues moved to nightlySessionEvaluator.js (2AM cron)
                // generateCues(agentResponse.finalAnswer, llmConfig).catch(() => {});
            });
        } catch (postProcessingError) {
            log.error('CHAT', `Post-processing failed after orchestration: ${postProcessingError.message}`);

            const fallbackFinalAnswer = orchestatorResult?.finalAnswer ||
                'I completed the reasoning steps, but couldn\'t finalize the full response metadata. Please try again.';

            const safeResponse = {
                ...orchestatorResult,
                finalAnswer: fallbackFinalAnswer,
                thinking: accumulatedThoughts.join('') || orchestatorResult?.thinking || '',
                criticalThinkingCues: null,
                sourcePipeline: orchestatorResult?.sourcePipeline || 'tot-postprocess-fallback'
            };

            captureDebugFromResponse(safeResponse);
            await captureRedisStateFromCache();
            capturePerformance({
                intent: queryIntent,
                reasoningDepth: safeResponse?.reasoningMeta?.reasoningDepth || safeResponse?.reasoningMeta?.branchCount || 1,
                llmCallCount: safeResponse?.reasoningMeta?.llmCallCount || 1,
                tokenUsageEstimate: Math.ceil(String(safeResponse?.finalAnswer || '').length / 4),
                branchCount: safeResponse?.totalBranchesGenerated || 1,
                toolCalls: safeResponse?.reasoningMeta?.toolCalls || 0,
            });
            streamEvent(res, { type: 'final_answer', content: safeResponse });
            res.end();
        }

        return;
    }

    // ── STANDARD AGENTIC PATH ─────────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    streamEvent(res, { type: 'status_update', content: 'Analyzing your query...' });
    log.info('AI', `[CRITICAL_PATH] PATH_B standard — user=${userId} semantic=${semanticRoute}(${semanticConfidence.toFixed(2)}) complexity=${estimatedComplexityScore}`);

    // Prefetch ack prefix concurrently while LLM generates — removes it from critical path
    const expertAck = contextualMemory?.expertAcknowledgment;
    const ackPrefixPromise = expertAck
        ? Promise.resolve(expertAck)
        : knowledgeStateService.getAcknowledgmentPrefix(userId, query).catch(() => null);

    // ── HYBRID CONTEXT INJECTION ────────────────────────────────────────────
    // When the query was split into conceptual + temporal segments, prepend a
    // context block to the system prompt that tells the LLM:
    //   - which parts to answer from its trained knowledge
    //   - which parts to answer from the retrieved web/academic results
    // The agent will fetch the actual search results; we just give it the plan.
    let effectiveSystemPrompt = finalSystemPrompt;
    let effectiveRequestContext = requestContext;
    if (hybridDecomposition?.isHybrid && typeof buildHybridContextBlock === 'function') {
        const hybridBlock = buildHybridContextBlock(hybridDecomposition, {});
        if (hybridBlock) {
            effectiveSystemPrompt = hybridBlock + '\n\n' + (finalSystemPrompt || '');
            log.info('AI', '[HYBRID] Injected hybrid context block into system prompt');
        }
        // Pass focused per-segment search queries so the agent uses them
        // instead of running the full query through every search tool
        if (hybridDecomposition.searchQueries) {
            effectiveRequestContext = {
                ...requestContext,
                hybridSearchQueries: hybridDecomposition.searchQueries,
                hybridSegments:      hybridDecomposition.segments,
            };
        }
    }

    if (userRequestedToT) {
        effectiveSystemPrompt = (effectiveSystemPrompt || '') + '\n\n[Thinking Mode Active]: Think deeper, analyze step-by-step using internal reasoning (<think> tags), and provide a highly detailed, thorough, and comprehensive answer using relevant tools if needed.';
        log.info('AI', '[THINKING_MODE] Injected deep reasoning directive into system prompt');
    }

    const agentStart = Date.now();
    const agentResponse = await processAgenticRequest(
        query.trim(),
        historyForLlm,
        effectiveSystemPrompt,
        { ...effectiveRequestContext, forceSimple: simpleFastPath || (!requestContext.isWebSearchEnabled && !requestContext.isAcademicSearchEnabled && !documentContextName) },
        (evt) => {
            const event = typeof evt === 'string' ? { type: 'token', content: evt } : evt;
            // SSE is the primary transport — Socket.IO reserved for cross-tab push only
            streamEvent(res, event);
        }
    );
    performanceTracker.addLlm(Date.now() - agentStart);
    if (agentResponse?.reasoningMeta?.performanceDiagnostics) {
        performanceTracker.merge(agentResponse.reasoningMeta.performanceDiagnostics);
    }

    if (tutorMode && tutorModeType === TUTOR_MODE_TYPES.GENERAL_SOCRATIC && agentResponse?.finalAnswer) {
        agentResponse.finalAnswer = enforceGeneralSocraticStyle(agentResponse.finalAnswer, query);
    }

    const endTime = Date.now();

    const logEntry = new LLMPerformanceLog({
        userId, sessionId,
        query: query.trim(),
        response: agentResponse.finalAnswer,
        chosenModelId: chosenModel.modelId,
        routerLogic,
        responseTimeMs: endTime - startTime
    });
    // logEntry._id is assigned by Mongoose on construction (before save)

    let bountyResult = null;
    if (bountyId && bountyAnswer) {
        try {
            const bountyService = require('../../../services/bountyService');
            bountyResult = await bountyService.submitBountyAnswer(bountyId, userId, bountyAnswer);
            log.success('SYSTEM', `Bounty submitted for ${bountyId}`);
        } catch (bountyError) {
            log.error('SYSTEM', 'Bounty submission failed', bountyError);
        }
    }

    // ack prefix was prefetched in parallel — should already be resolved by now
    const ackPrefix = await ackPrefixPromise;

    // Build the response text, optionally appending a Code Executor tip for code-intent queries
    const CODE_TIP = ctx.appendCodeExecutorTip
        ? '\n\n---\n💡 **Tip:** For running or testing this code interactively, try the [Code Executor](/tools/code-executor).'
        : '';

    const baseText = ackPrefix ? ackPrefix + agentResponse.finalAnswer : agentResponse.finalAnswer;
    const responseText = baseText + CODE_TIP;

    const finalAiMessage = {
        sender: 'bot', role: 'model',
        text: responseText,
        parts: [{ text: responseText }],
        timestamp: new Date(),
        thinking: agentResponse.thinking || null,
        references: agentResponse.references || [],
        source_pipeline: agentResponse.sourcePipeline,
        confidenceScore: agentResponse.confidenceScore ?? null,
        reasoningMeta: agentResponse.reasoningMeta || null,
        action: ctx.appendCodeExecutorTip
            ? { type: 'NAVIGATE', payload: { path: '/tools/code-executor', api: '/api/tools/execute' } }
            : (agentResponse.action || null),
        logId: logEntry._id,
        criticalThinkingCues: null,  // populated asynchronously after res.end()
        // Issue 1.3: inform the frontend which toggles were silently disabled so it can show a notice
        disabledToggles: (disabledToggles && disabledToggles.length > 0) ? disabledToggles : undefined,
    };

    captureDebugFromResponse(finalAiMessage);
    capturePerformance({
        intent: queryIntent,
        reasoningDepth: agentResponse?.reasoningMeta?.reasoningDepth || agentResponse?.reasoningMeta?.branchCount || 1,
        llmCallCount: agentResponse?.reasoningMeta?.llmCallCount || 1,
        tokenUsageEstimate: Math.ceil(String(agentResponse?.finalAnswer || '').length / 4),
        branchCount: agentResponse?.reasoningMeta?.branchCount || 1,
        toolCalls: agentResponse?.reasoningMeta?.toolCalls || 0,
    });

    streamEvent(res, { type: 'final_answer', content: finalAiMessage, bountyResult });
    res.end();
    const _totalMs = Date.now() - startTime;
    const _llmMs   = Date.now() - agentStart;
    log.info('AI', `[CRITICAL_PATH] PATH_B done — totalMs=${_totalMs} llmMs=${_llmMs}`);
    criticalPathDuration.observe({ path: 'PATH_B' }, _totalMs);
    llmCallDuration.observe({ provider: chosenModel?.provider || 'unknown', model: chosenModel?.modelId || 'unknown' }, _llmMs);

    // ── ALL post-response work below — user already has the answer ────────────

    const messageForDb = { ...finalAiMessage };
    delete messageForDb.sender;
    delete messageForDb.text;
    delete messageForDb.criticalThinkingCues;
    delete messageForDb.action;

    // DB save + deferred saves + background tasks — all off the critical path
    setImmediate(async () => {
        // Persist chat history
        ChatHistory.findOneAndUpdate(
            { sessionId, userId },
            {
                $push: { messages: { $each: [userMessageForDb, messageForDb], $slice: -100 } },
                $set: { isTutorMode: !!tutorMode, tutorModeType: tutorModeType || null, updatedAt: new Date() }
            },
            { upsert: true }
        ).catch(e => log.warn('DB', `Chat history save failed: ${e.message}`));

        // Performance log + critical thinking cues
        logEntry.save().catch(e => log.error('PERF', `Log save failed: ${e.message}`));
        // [NIGHT_SHIFT] generateCues moved to nightlySessionEvaluator.js (2AM cron)
        // generateCues(agentResponse.finalAnswer, llmConfig).catch(() => {});

        // Redis debug capture (non-critical)
        captureRedisStateFromCache().catch(() => {});

        // Gamification
        try {
            const streakUpdate = await streakService.updateStreak(userId);
            const profile = await gamificationService.getOrCreateProfile(userId);

            // [NIGHT_SHIFT] Full LLM XP evaluation moved to nightlySessionEvaluator.js (2AM cron).
            // Live path: deterministic heuristic only — zero extra LLM calls on the critical path.
            const words = (agentResponse.finalAnswer || '').split(/\s+/).length;
            const hasQuestion = /\?/.test(query);
            const vocabulary = new Set(query.toLowerCase().split(/\W+/).filter(Boolean)).size;
            const heuristicScore = Math.min(100, Math.round(words / 5 + vocabulary * 2 + (hasQuestion ? 10 : 0)));

            const creditsMultiplier = streakUpdate.multiplier || 1.0;
            const finalCredits = Math.round(heuristicScore * creditsMultiplier);

            log.info('SYSTEM', `XP Awarded: ${finalCredits} (Multiplier: ${creditsMultiplier}x)`);

            await gamificationService.awardLearningCredits(userId, finalCredits, 'understanding', documentContextName || 'general');

            if (documentContextName) {
                const currentScore = profile.topicScores.get(documentContextName) || 0;
                await gamificationService.updateTopicScore(userId, documentContextName, currentScore + finalCredits);
            }

            const { fatigueScore } = await energyService.detectFatigue(userId, sessionId);
            await energyService.updateEnergyBar(userId, fatigueScore);
        } catch (gamError) {
            log.error('SYSTEM', 'Gamification background error', gamError);
        }
    });

    // KG extraction and memory analysis — MOVED TO NIGHT SHIFT (2AM cron)
    // [NIGHT_SHIFT] extractAndStoreKgFromText and triggerPeriodicAnalysis now run in nightlySessionEvaluator.js
    // if (agentResponse.finalAnswer) {
    //     extractAndStoreKgFromText(agentResponse.finalAnswer, sessionId, userId, llmConfig, documentContextName || null);
    // }
    // const messageCount = (chatSession?.messages?.length || 0) + 2;
    // triggerPeriodicAnalysis(sessionId, userId, messageCount, llmConfig);
}

module.exports = { handle };
