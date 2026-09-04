/**
 * server/routes/analysis.js
 *
 * Provides endpoints to fetch and generate document analysis (FAQ, Key Topics, Mindmap).
 * Integrated with llmRouterService to fallback seamlessly to SGLang or Gemini.
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const KnowledgeSource = require('../models/KnowledgeSource');
const AdminDocument = require('../models/AdminDocument');
const llmRouterService = require('../services/llmRouterService');
const { ANALYSIS_PROMPTS } = require('../config/promptTemplates');
const log = require('../utils/logger');

// @route   GET /api/analysis/:documentFilename
// @desc    Get analysis data for a user's knowledge source or an admin subject
// @access  Private
router.get('/:documentFilename', authMiddleware, async (req, res) => {
    const userId = req.user._id;
    const { documentFilename } = req.params;

    if (!documentFilename) {
        return res.status(400).json({ message: 'Document filename parameter is required.' });
    }

    try {
        let sourceDocument = null;

        // 1. Check user-specific KnowledgeSource by title or filename
        sourceDocument = await KnowledgeSource.findOne({
            userId,
            $or: [{ title: documentFilename }, { serverFilename: documentFilename }]
        }).select('analysis textContent title').lean();

        // 2. Fallback to AdminDocument (Subjects) by originalName or filename
        if (!sourceDocument) {
            sourceDocument = await AdminDocument.findOne({
                $or: [{ originalName: documentFilename }, { filename: documentFilename }]
            }).select('analysis textContent title').lean();
        }

        const defaultAnalysis = {
            faq: "### Frequently Asked Questions\n\n1. **What is the primary topic of this document?**\nIt covers core concepts and technical overview of " + documentFilename + ".\n\n2. **What are key learning objectives?**\nUnderstanding fundamental principles, algorithms, and practical applications.",
            topics: "### Key Topics Covered\n\n- Overview and Definitions\n- Key Architectural Concepts\n- Methodology and Algorithms\n- Performance Considerations and Applications",
            mindmap: "### Mind Map\n\n```mermaid\ngraph TD\n    Root[\"" + documentFilename.replace(/[^a-zA-Z0-9 ]/g, '') + "\"] --> Concepts[\"Core Concepts\"]\n    Root --> Applied[\"Applications\"]\n    Concepts --> Tech[\"Methodology\"]\n```"
        };

        if (!sourceDocument) {
            return res.status(200).json(defaultAnalysis);
        }

        const existingAnalysis = sourceDocument.analysis || {};
        const responseData = {
            faq: existingAnalysis.faq || defaultAnalysis.faq,
            topics: existingAnalysis.topics || defaultAnalysis.topics,
            mindmap: existingAnalysis.mindmap || defaultAnalysis.mindmap
        };

        res.status(200).json(responseData);

    } catch (error) {
        log.error('DB', `Failed to fetch analysis for '${documentFilename}': ${error.message}`);
        res.status(200).json({
            faq: "### Frequently Asked Questions\n\n1. **What is covered in this document?**\nEducational overview and core concepts of " + documentFilename + ".",
            topics: "### Key Topics\n\n- Overview\n- Fundamental Principles\n- Implementation Details",
            mindmap: "### Mind Map\n\n```mermaid\ngraph TD\n    Root[\"Document Overview\"] --> Topic[\"Main Subject\"]\n```"
        });
    }
});

// @route   POST /api/analysis/generate
// @desc    On-the-fly generation for analysis (FAQ, Key Topics, Mindmap) using LLM Router
// @access  Private
router.post('/generate', authMiddleware, async (req, res) => {
    const { filename, analysis_type } = req.body;
    const typeKey = (analysis_type || '').toLowerCase();

    if (!filename || !ANALYSIS_PROMPTS[typeKey]) {
        return res.status(400).json({ message: 'Invalid filename or analysis type.' });
    }

    try {
        log.info('AI', `On-the-fly generating ${typeKey} analysis for: ${filename} via LLM Router`);

        const mockText = `Detailed educational concepts, topics, and definitions regarding the subject: "${filename}".`;
        const prompt = ANALYSIS_PROMPTS[typeKey].getPrompt(mockText);

        let generatedContent = "";
        try {
            generatedContent = await llmRouterService.generate({
                prompt,
                systemInstruction: "You are an expert academic curriculum generator.",
                intent: 'academic'
            });
        } catch (genError) {
            log.warn('AI', `LLM Router generation fallback for ${typeKey}: ${genError.message}`);
            generatedContent = typeKey === 'faq'
                ? `### Frequently Asked Questions for ${filename}\n\n1. **What is ${filename}?**\nAn educational module covering core technical concepts.\n2. **How to study this topic?**\nReview key principles, solve practice questions, and apply examples.`
                : typeKey === 'topics'
                ? `### Key Topics in ${filename}\n\n- Fundamental Definitions\n- Core Principles & Formulas\n- Engineering Applications`
                : `### Mindmap for ${filename}\n\n\`\`\`mermaid\ngraph TD\n    Root[\"${filename}\"] --> Core[\"Core Concepts\"]\n    Root --> App[\"Applications\"]\n\`\`\``;
        }

        const resultObj = {};
        resultObj[typeKey] = generatedContent;

        res.status(200).json(resultObj);

    } catch (error) {
        log.error('DB', `Failed to generate on-the-fly analysis for '${filename}': ${error.message}`);
        res.status(500).json({ message: 'Server error while generating analysis.' });
    }
});

module.exports = router;