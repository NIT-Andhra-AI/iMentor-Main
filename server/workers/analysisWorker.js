const log = require('../utils/logger');
// server/workers/analysisWorker.js
const { workerData, parentPort } = require('worker_threads');
const mongoose = require('mongoose');
const path = require('path');

const KnowledgeSource = require('../models/KnowledgeSource');
const connectDB = require('../config/db');
const geminiService = require('../services/geminiService');
const sglangService = require('../services/sglangService');
const groqService = require('../services/groqService');
const { ANALYSIS_PROMPTS } = require('../config/promptTemplates');
const { checkAndUpdateJobCompletion } = require('../utils/jobTracker');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

async function performFullAnalysis(sourceId, textForAnalysis, llmProvider, localLlmModel, apiKey, localLlmUrl) {
    const logPrefix = `[AnalysisWorker ${process.pid}, SourceID: ${sourceId}]`;
    log.info('DB', `Analysis Task: Starting (Provider: ${llmProvider})`);

    const analysisResults = { faq: "", topics: "", mindmap: "" };
    let allIndividualAnalysesSuccessful = true; // We still track this for logging/reasoning

    if (llmProvider === 'gemini' && !apiKey) {
        const errorMessage = "Error: Analysis failed because no valid Gemini API key was provided to the worker.";
        analysisResults.faq = errorMessage;
        analysisResults.topics = errorMessage;
        analysisResults.mindmap = errorMessage;
        allIndividualAnalysesSuccessful = false;
    } else {
        async function generateSingleAnalysis(type, promptContentForLLM) {
            try {
                log.info('DB', `Generating ${type}...`);
                const historyForLLM = [{ role: 'user', parts: [{ text: "Perform the requested analysis based on the system instruction provided." }] }];
                
                const llmOptions = { 
                    apiKey,
                    localLlmUrl,
                    model: llmProvider === 'groq' ? (process.env.GROQ_MODEL || 'llama-3.1-8b-instant') : localLlmModel,
                    maxOutputTokens: 4096 
                };

                const generatedText = llmProvider === 'sglang'
                    ? await sglangService.generateContentWithHistory(historyForLLM, promptContentForLLM, null, llmOptions)
                    : (llmProvider === 'groq'
                        ? await groqService.generateContentWithHistory(historyForLLM, promptContentForLLM, null, llmOptions)
                        : await geminiService.generateContentWithHistory(historyForLLM, promptContentForLLM, null, llmOptions));

                if (!generatedText || typeof generatedText !== 'string' || generatedText.trim() === "") {
                    log.warn('DB', `LLM returned empty content for ${type}`);
                    allIndividualAnalysesSuccessful = false; // Mark that one part failed
                    return { success: false, content: `Notice: No content generated for ${type}.` };
                }
                // log.info('DB', `${type} generated successfully`);
                return { success: true, content: generatedText.trim() };
            } catch (error) {
                log.error('DB', `Error generating ${type}: ${error.message}`);
                allIndividualAnalysesSuccessful = false; // Mark that one part failed
                return { success: false, content: `Notice: Error generating ${type}: ${error.message}` };
            }
        }
        
        // Run all three analyses in parallel (FAQ generation, Topic extraction, Mindmap schema)
        // using Promise.all to save latency (~3-5s reduction depending on LLM load).
        const [faqRes, topicsRes, mindmapRes] = await Promise.all([
            generateSingleAnalysis("faq", ANALYSIS_PROMPTS.faq.getPrompt(textForAnalysis)),
            generateSingleAnalysis("topics", ANALYSIS_PROMPTS.topics.getPrompt(textForAnalysis)),
            generateSingleAnalysis("mindmap", ANALYSIS_PROMPTS.mindmap.getPrompt(textForAnalysis))
        ]);

        analysisResults.faq = faqRes.content;
        analysisResults.topics = topicsRes.content;
        analysisResults.mindmap = mindmapRes.content;
    }

    try {
        const updatePayload = {
            status: allIndividualAnalysesSuccessful ? "completed" : "failed",
            "analysis.faq": analysisResults.faq,
            "analysis.topics": analysisResults.topics,
            "analysis.mindmap": analysisResults.mindmap
        };
        if (!allIndividualAnalysesSuccessful) {
            updatePayload.failureReason = "One or more analysis generation steps failed or returned empty content.";
        }
        await KnowledgeSource.updateOne({ _id: sourceId }, { $set: updatePayload });
        log.success('DB', `Analysis Task: Finished (Status: ${updatePayload.status})`);
        
        // Trigger downstream tasks (e.g. sync state / broadcast completed) if needed
        await checkAndUpdateJobCompletion(workerData.jobId, sourceId);

    } catch (dbError) {
        log.error('DB', `DB Error storing analysis: ${dbError.message}`, dbError);
        // If DB update fails, we should throw to indicate a critical failure
        throw new Error(`DB Error storing analysis: ${dbError.message}`);
    }
}


async function run() {
    const { sourceId, textForAnalysis, llmProvider, localLlmModel, apiKey, localLlmUrl } = workerData;
    let dbConnected = false;

    try {
        if (!process.env.MONGO_URI || !sourceId) {
            throw new Error("Worker started with incomplete data (MONGO_URI or sourceId missing).");
        }
        
        await connectDB(process.env.MONGO_URI);
        dbConnected = true;

        if (!textForAnalysis || textForAnalysis.trim() === '') {
            await KnowledgeSource.updateOne({ _id: sourceId }, {
                $set: { status: "failed", failureReason: "Analysis skipped: No text content was extracted." }
            });
        } else {
            await performFullAnalysis(
                sourceId, textForAnalysis, llmProvider, localLlmModel, apiKey, localLlmUrl
            );
        }

    } catch (error) {
        log.error('DB', `Analysis Worker Critical error: ${error.message}`, error);
        if (dbConnected && sourceId) {
            try {
                await KnowledgeSource.updateOne(
                    { _id: sourceId },
                    { $set: { status: "failed", failureReason: `Critical worker error: ${error.message}` } }
                );
                await checkAndUpdateJobCompletion(workerData.jobId, sourceId);
            } catch (dbUpdateError) {
                log.error('DB', 'Failed to update status to failed');
            }
        }
    } finally {
        if (dbConnected) {
            await mongoose.disconnect();
        }
        log.success('DB', `Analysis task finished (Source: ${sourceId})`);
    }
}

run();