const log = require('../utils/logger');
// server/routes/kg.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../models/User');
const AdminDocument = require('../models/AdminDocument');
const ChatHistory = require('../models/ChatHistory');
const { decrypt } = require('../utils/crypto');
const { auditLog } = require('../utils/logger');
const llmRouterService = require('../services/llmRouterService');

function extractConceptsFallbackFromText(transcript) {
    const metaWords = new Set([
        'live', 'conversation', 'session', 'user', 'assistant', 'system', 'student',
        'tutor', 'message', 'hello', 'hi', 'hey', 'please', 'explain', 'tell', 'about',
        'what', 'how', 'why', 'who', 'when', 'where', 'can', 'help', 'thanks', 'thank',
        'yes', 'no', 'sure', 'okay', 'ok', 'right', 'good', 'great', 'question', 'answer'
    ]);

    // Extract multi-word technical phrases first
    const rawPhrases = transcript.match(/\b[A-Z][a-zA-Z0-9#+.]*(?:\s+[A-Z][a-zA-Z0-9#+.]*)+\b/g) || [];
    const cleanPhrases = [];
    const seen = new Set();

    rawPhrases.forEach(p => {
        const clean = p.trim();
        const words = clean.toLowerCase().split(/\s+/);
        if (!words.some(w => metaWords.has(w)) && clean.length > 3 && !seen.has(clean.toLowerCase())) {
            seen.add(clean.toLowerCase());
            cleanPhrases.push(clean);
        }
    });

    // Extract single technical capitalized terms or domain words
    const singleWords = [];
    const words = transcript.split(/[\s,.:;!?()\[\]"']/);
    words.forEach(w => {
        const clean = w.trim();
        const lower = clean.toLowerCase();
        if (clean.length > 3 && !metaWords.has(lower) && !/^\d+$/.test(clean)) {
            const existsInPhrase = cleanPhrases.some(p => p.toLowerCase().includes(lower));
            if (!existsInPhrase && !seen.has(lower)) {
                seen.add(lower);
                const formatted = clean.charAt(0).toUpperCase() + clean.slice(1);
                singleWords.push(formatted);
            }
        }
    });

    const candidateList = [...cleanPhrases, ...singleWords].slice(0, 6);

    if (candidateList.length === 0) {
        candidateList.push("Core Topic", "Learning Concept", "Academic Knowledge");
    }

    const nodes = candidateList.map(name => ({
        id: name,
        type: "Concept",
        description: `Topic node extracted from conversation`
    }));

    const edges = [];
    for (let i = 0; i < nodes.length - 1; i++) {
        edges.push({
            from: nodes[i].id,
            to: nodes[i + 1].id,
            relationship: "DEPENDS_ON"
        });
    }

    return { nodes, edges };
}

router.get('/visualize/:documentName', async (req, res) => {
    const { documentName } = req.params;
    const currentUserId = req.user?._id;
    if (!currentUserId) {
        return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!documentName) {
        return res.status(400).json({ message: 'Document name is required.' });
    }

    try {
        let sourceDocumentText = null;
        let apiKeyForRequest = null;

        const user = await User.findById(currentUserId).select('uploadedDocuments.filename uploadedDocuments.text +encryptedApiKey');
        const userDoc = user?.uploadedDocuments ? user.uploadedDocuments.find(doc => doc.filename === documentName) : null;

        if (userDoc?.text) {
            sourceDocumentText = userDoc.text;
            if (user.encryptedApiKey) {
                apiKeyForRequest = decrypt(user.encryptedApiKey);
            }
        }

        if (!sourceDocumentText) {
            const adminDoc = await AdminDocument.findOne({ $or: [{ originalName: documentName }, { filename: documentName }] }).select('text');
            if (adminDoc?.text) {
                sourceDocumentText = adminDoc.text;
            }
        }

        if (!sourceDocumentText) {
            return res.status(404).json({ message: `Source document '${documentName}' not found.` });
        }

        apiKeyForRequest = apiKeyForRequest || process.env.GEMINI_API_KEY;

        const pythonServiceUrl = process.env.PYTHON_RAG_SERVICE_URL;
        if (pythonServiceUrl) {
            try {
                const getKgUrl = `${pythonServiceUrl}/generate_kg_from_text`;
                const pythonResponse = await axios.post(getKgUrl, {
                    document_text: sourceDocumentText.slice(0, 8000),
                    api_key: apiKeyForRequest
                }, { timeout: 15000 });

                if (pythonResponse.data && pythonResponse.data.success && pythonResponse.data.graph_data) {
                    return res.status(200).json(pythonResponse.data.graph_data);
                }
            } catch (pyErr) {
                log.warn('KG', `Python KG service failed, using NLP fallback: ${pyErr.message}`);
            }
        }

        // NLP Fallback for Document KG Visualization
        const fallbackKg = extractConceptsFallbackFromText(sourceDocumentText.slice(0, 4000));
        return res.status(200).json(fallbackKg);

    } catch (error) {
        const errorMsg = error.response?.data?.error || error.message || "Failed to retrieve knowledge graph.";
        log.error('DB', `KG visualization failure [${documentName}]: ${errorMsg}`);
        res.status(200).json(extractConceptsFallbackFromText("Document Analysis Concept Map"));
    }
});

// @route   GET /api/kg/session/:sessionId
// @desc    Get knowledge graph for chat session (tries Go Gateway / LLM Router with NLP fallback)
// @access  Private
router.get('/session/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user._id.toString();

    const pythonServiceUrl = process.env.PYTHON_RAG_SERVICE_URL;
    const getKgUrl = pythonServiceUrl ? `${pythonServiceUrl}/kg/${userId}/${encodeURIComponent(sessionId)}` : null;

    try {
        auditLog(req, 'TOOL_USAGE_LIVE_CONCEPT_MAP', { sessionId });

        // 1. Try to fetch existing graph from Neo4j / Python RAG
        if (getKgUrl) {
            try {
                const pythonResponse = await axios.get(getKgUrl, { timeout: 6000 });
                if (pythonResponse.data && Array.isArray(pythonResponse.data.nodes) && pythonResponse.data.nodes.length > 0) {
                    return res.status(200).json(pythonResponse.data);
                }
            } catch (pyErr) {
                // Fall through
            }
        }

        // 2. Fetch ChatHistory (support finding by sessionId String or _id)
        const chat = await ChatHistory.findOne({ $or: [{ sessionId }, { _id: mongoose.Types.ObjectId.isValid(sessionId) ? sessionId : null }] }).lean();
        if (chat?.knowledgeGraph?.nodes && chat.knowledgeGraph.nodes.length > 0) {
            return res.status(200).json({
                nodes: chat.knowledgeGraph.nodes,
                edges: chat.knowledgeGraph.edges || []
            });
        }

        if (messages.length === 0) {
            return res.status(200).json({
                nodes: [],
                edges: []
            });
        }

        const validMessages = messages.filter(m => m.text || (m.parts && m.parts[0]?.text));
        const transcript = validMessages
            .slice(-10)
            .map(m => `${m.sender || m.role || 'user'}: ${m.text || m.parts?.[0]?.text || ''}`)
            .join('\n\n')
            .slice(0, 4000);

        let extractedKg = null;
        try {
            const prompt = `Extract 4 to 6 distinct technical concepts and semantic edges from this conversation.
Return ONLY valid JSON:
{
  "nodes": [{ "id": "ConceptName", "type": "Concept", "description": "1 sentence description" }],
  "edges": [{ "from": "ConceptName1", "to": "ConceptName2", "relationship": "DEPENDS_ON" }]
}

Conversation:
${transcript}`;

            const textResp = await llmRouterService.generate({
                prompt,
                systemInstruction: "You are an expert knowledge graph extractor. Output ONLY valid JSON.",
                intent: 'academic'
            });

            const match = (textResp || '').match(/\{[\s\S]*\}/);
            if (match) {
                extractedKg = JSON.parse(match[0]);
            }
        } catch (llmErr) {
            log.warn('KG', `LLM KG extraction fallback: ${llmErr.message}`);
        }

        // 3. Fallback to clean NLP keyword extraction if LLM returns empty nodes
        if (!extractedKg || !Array.isArray(extractedKg.nodes) || extractedKg.nodes.length === 0) {
            extractedKg = extractConceptsFallbackFromText(transcript);
        }

        // Save into ChatHistory MongoDB document
        if (extractedKg && extractedKg.nodes && extractedKg.nodes.length > 0) {
            ChatHistory.findOneAndUpdate(
                { $or: [{ sessionId }, { _id: mongoose.Types.ObjectId.isValid(sessionId) ? sessionId : null }] },
                { $set: { knowledgeGraph: { nodes: extractedKg.nodes, edges: extractedKg.edges || [], lastUpdated: new Date() } } }
            ).catch(e => log.warn('KG', `Mongo KG save non-fatal: ${e.message}`));
        }

        return res.status(200).json(extractedKg);

    } catch (error) {
        log.error('DB', `KG session fetch error [${sessionId}]: ${error.message}`);
        return res.status(200).json({ nodes: [], edges: [] });
    }
});

module.exports = router;