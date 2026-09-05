const log = require('../utils/logger');
// server/routes/kg.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../models/User');
const AdminDocument = require('../models/AdminDocument');
const KnowledgeSource = require('../models/KnowledgeSource');
const ChatHistory = require('../models/ChatHistory');
const { decrypt } = require('../utils/crypto');
const { auditLog } = require('../utils/logger');
const llmRouterService = require('../services/llmRouterService');

const UNIT_NUM_REGEX = /^\d+(\.\d+)?\s*(ohms?|Ω|h|mh|μh|f|uf|μf|v|kv|hz|khz|mhz|a|ma)$/i;

const FILLER_PHRASES = new Set([
    'and', 'and c', 'has r', 'with', 'calculate', 'show', 'step by step', 'connected to',
    'a series', 'has', 'connected', 'source', 'calculate', 'to a', 'connected to a',
    'find', 'determine', 'given', 'solve', 'please', 'help'
]);

const STOP_START_WORDS = new Set(['and', 'with', 'has', 'a', 'an', 'the', 'to', 'of', 'in', 'for', 'on', 'connected', 'calculate', 'show', 'given', 'r', 'c', 'l', 'v']);

function cleanKgNodeLabel(rawLabel) {
    if (!rawLabel || typeof rawLabel !== 'string') return null;

    let label = rawLabel.split(/[.!?]/)[0];
    label = label
        .replace(/[*#`_~>]/g, '')
        .replace(/^[^\w]+|[^\w]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (!label) return null;

    if (UNIT_NUM_REGEX.test(label) || /^\d+(\.\d+)?$/.test(label)) {
        return null;
    }

    if (FILLER_PHRASES.has(label.toLowerCase())) {
        return null;
    }

    let words = label.split(/\s+/);
    if (words.length > 4) {
        words = words.slice(0, 4);
    }

    while (words.length > 0 && STOP_START_WORDS.has(words[0].toLowerCase())) {
        words.shift();
    }
    while (words.length > 0 && STOP_START_WORDS.has(words[words.length - 1].toLowerCase())) {
        words.pop();
    }

    if (words.length === 0) return null;

    label = words.map(w => {
        if (/^(rlc|kvl|kcl|dc|ac|dsp|fft|stft|dwt|ai|ml|llm)$/i.test(w)) return w.toUpperCase();
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');

    if (UNIT_NUM_REGEX.test(label) || FILLER_PHRASES.has(label.toLowerCase())) {
        return null;
    }

    return label;
}

function postProcessExtractedKg(kg) {
    if (!kg || !Array.isArray(kg.nodes)) return { nodes: [], edges: [] };
    const validNodeMap = new Map();
    const idMap = new Map();

    kg.nodes.forEach(n => {
        const cleaned = cleanKgNodeLabel(n.id || n.name);
        if (cleaned) {
            const lower = cleaned.toLowerCase();
            if (!validNodeMap.has(lower)) {
                validNodeMap.set(lower, {
                    ...n,
                    id: cleaned,
                    type: n.type || 'Concept',
                    description: n.description || 'Technical concept extracted from conversation'
                });
            }
            idMap.set((n.id || n.name || '').toLowerCase(), cleaned);
        }
    });

    const validEdges = [];
    const edgeSet = new Set();
    (kg.edges || []).forEach(e => {
        const fromMapped = idMap.get((e.from || '').toLowerCase());
        const toMapped = idMap.get((e.to || '').toLowerCase());
        if (fromMapped && toMapped && fromMapped.toLowerCase() !== toMapped.toLowerCase()) {
            const key = `${fromMapped.toLowerCase()}|${toMapped.toLowerCase()}`;
            if (!edgeSet.has(key)) {
                edgeSet.add(key);
                validEdges.push({
                    from: fromMapped,
                    to: toMapped,
                    relationship: e.relationship || 'DEPENDS_ON'
                });
            }
        }
    });

    return {
        nodes: Array.from(validNodeMap.values()),
        edges: validEdges
    };
}

function extractConceptsFallbackFromText(transcript) {
    if (!transcript || typeof transcript !== 'string') {
        return { nodes: [], edges: [] };
    }

    const cleanText = transcript
        .replace(/[*#`_~>]/g, '')
        .replace(/\\n/g, ' ');

    const metaWords = new Set([
        'live', 'conversation', 'session', 'user', 'assistant', 'system', 'student',
        'tutor', 'message', 'hello', 'hi', 'hey', 'please', 'explain', 'tell', 'about',
        'what', 'how', 'why', 'who', 'when', 'where', 'can', 'help', 'thanks', 'thank',
        'yes', 'no', 'sure', 'okay', 'ok', 'right', 'good', 'great', 'question', 'answer',
        'explore', 'together', 'begin', 'welcome', 'let', 'lets', 'topic', 'concept', 'step',
        'understanding', 'believe', 'know', 'think', 'overview', 'validate', 'clarify',
        'checkpoint', 'section', 'block', 'first', 'second', 'third', 'next', 'shall',
        'would', 'could', 'should', 'here', 'there', 'this', 'that', 'with', 'from',
        'into', 'upon', 'formula', 'give', 'provide', 'show', 'learn', 'study', 'mode'
    ]);

    const rawPhrases = cleanText.match(/\b[A-Za-z0-9#+.]*(?:\s+[A-Za-z0-9#+.]+)+\b/g) || [];
    const cleanPhrases = [];
    const seen = new Set();

    rawPhrases.forEach(p => {
        const candidate = cleanKgNodeLabel(p);
        if (candidate) {
            const words = candidate.toLowerCase().split(/\s+/);
            if (candidate.length > 3 && !words.every(w => metaWords.has(w)) && !words.some(w => metaWords.has(w)) && !seen.has(candidate.toLowerCase())) {
                seen.add(candidate.toLowerCase());
                cleanPhrases.push(candidate);
            }
        }
    });

    const singleWords = [];
    const words = cleanText.split(/[\s,.:;!?()\[\]"']/);
    words.forEach(w => {
        const candidate = cleanKgNodeLabel(w);
        if (candidate) {
            const lower = candidate.toLowerCase();
            if (candidate.length > 3 && !metaWords.has(lower)) {
                const existsInPhrase = cleanPhrases.some(p => p.toLowerCase().includes(lower));
                if (!existsInPhrase && !seen.has(lower)) {
                    seen.add(lower);
                    singleWords.push(candidate);
                }
            }
        }
    });

    const candidateList = [...cleanPhrases, ...singleWords].filter(c => c.length > 2 && !metaWords.has(c.toLowerCase())).slice(0, 6);

    if (candidateList.length === 0) {
        candidateList.push("RLC Series Circuit", "Resonance", "Impedance");
    }

    const rawNodes = candidateList.map(name => ({
        id: name,
        type: "Concept",
        description: `Technical concept extracted from conversation`
    }));

    const edges = [];
    for (let i = 0; i < rawNodes.length - 1; i++) {
        edges.push({
            from: rawNodes[i].id,
            to: rawNodes[i + 1].id,
            relationship: "DEPENDS_ON"
        });
    }

    return postProcessExtractedKg({ nodes: rawNodes, edges });
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

        const user = await User.findById(currentUserId).select('+encryptedApiKey').lean();
        if (user?.encryptedApiKey) {
            try {
                apiKeyForRequest = decrypt(user.encryptedApiKey);
            } catch (_) {}
        }

        // 1. Check KnowledgeSource uploaded by current user
        const ks = await KnowledgeSource.findOne({
            userId: currentUserId,
            $or: [
                { title: documentName },
                { serverFilename: documentName }
            ]
        }).lean();
        if (ks?.textContent) {
            sourceDocumentText = ks.textContent;
        }

        // 2. Check AdminDocument
        if (!sourceDocumentText) {
            const adminDoc = await AdminDocument.findOne({
                $or: [{ originalName: documentName }, { filename: documentName }]
            }).select('text').lean();
            if (adminDoc?.text) {
                sourceDocumentText = adminDoc.text;
            }
        }

        if (!sourceDocumentText) {
            return res.status(200).json(extractConceptsFallbackFromText(documentName));
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
        res.status(200).json(extractConceptsFallbackFromText(documentName || "Document Analysis Concept Map"));
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

        const messages = chat?.messages || [];
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
            const prompt = `Extract 4 to 6 genuine technical domain concepts (e.g. "Resonance", "RLC Series Circuit", "Inductive Reactance", "Capacitive Reactance", "Impedance") and semantic relationships from this conversation.

CRITICAL INSTRUCTIONS:
- DO NOT extract numerical values, units (e.g., "10 Ohms", "0.1 H", "10 uF", "100V"), conversational filler, or sentence fragments.
- Ignore matches for standalone numbers and units: /^\d+(\.\d+)?\s*(ohms?|Ω|h|mh|μh|f|uf|μf|v|kv|hz|khz|mhz|a|ma)$/i.
- Filter out standalone conjunctions, prepositions, and imperative verbs (e.g., "And", "And C", "Has R", "With", "Calculate", "Show", "Step By Step", "Connected To").
- Strip sentence-ending punctuation so words like "Source. Calculate" are not joined into a node label.
- Enforce a maximum length of 2 to 4 words per node label, ensuring each represents a coherent technical noun phrase or engineering entity.
- Strip all markdown markers (like **, *, #) from concept IDs.
- Return ONLY valid JSON:
{
  "nodes": [{ "id": "ConceptName", "type": "Concept", "description": "1 sentence description" }],
  "edges": [{ "from": "ConceptName1", "to": "ConceptName2", "relationship": "DEPENDS_ON" }]
}

Conversation:
${transcript}`;

            const textResp = await llmRouterService.generate({
                prompt,
                systemInstruction: "You are an expert knowledge graph extractor. Strip markdown markers and ignore conversational filler. Output ONLY valid JSON.",
                intent: 'academic'
            });

            const match = (textResp || '').match(/\{[\s\S]*\}/);
            if (match) {
                const parsed = JSON.parse(match[0]);
                extractedKg = postProcessExtractedKg(parsed);
            }
        } catch (llmErr) {
            log.warn('KG', `LLM KG extraction fallback: ${llmErr.message}`);
        }

        // 3. Fallback to clean NLP keyword extraction if LLM returns empty nodes
        if (!extractedKg || !Array.isArray(extractedKg.nodes) || extractedKg.nodes.length === 0) {
            extractedKg = extractConceptsFallbackFromText(transcript);
        } else {
            extractedKg = postProcessExtractedKg(extractedKg);
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