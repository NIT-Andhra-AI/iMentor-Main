// server/services/toolRegistry.js — Unified (Team3 structure + Team1-6 extra tools)
const log = require('../utils/logger');
const { performWebSearch } = require('./webSearchService.js');
const { conductDeepResearch } = require('./deepResearchOrchestrator.js'); // [Team1-6]
const { queryPythonRagService, queryKgService } = require('./toolExecutionService.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const geminiService = require('./geminiService');

// [Team1-6] Gamification grading from chat
let solveBountyInternal, Bounty, executeAgentTask;
try { solveBountyInternal = require('./gamificationService').solveBountyInternal; } catch(e) {}
try { Bounty = require('../models/Bounty'); } catch(e) {}
try { executeAgentTask = require('./agentOrchestrator').executeAgentTask; } catch(e) {}

function cleanAcademicQuery(query) {
    if (!query) return '';
    let cleaned = String(query);
    // Remove instruction prefixes/directives (e.g., "give me 3", "cite 5", "find", "search for")
    cleaned = cleaned.replace(/^(cite|find|search\s+for|get|show|provide|give\s+me)\s+(\d+\s+)?/gi, '');
    cleaned = cleaned.replace(/^(recent|latest|top|some|new|academic|scholarly|scientific)\s+/gi, '');
    cleaned = cleaned.replace(/(academic|scholarly|scientific)\s+(papers|articles|publications|studies|research)\s+(on|about|for|regarding)?\s*/gi, ' ');
    cleaned = cleaned.replace(/\b(papers|articles|publications|studies)\s+(on|about|for|regarding)?\s*/gi, ' ');
    // Remove year references like 2020-2029, published in 2024, etc.
    cleaned = cleaned.replace(/\b(in|from|published in|of)\s+(19|20)\d{2}\b/gi, '');
    cleaned = cleaned.replace(/\b(19|20)\d{2}\b/g, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    // Clean remaining leading prepositions
    cleaned = cleaned.replace(/^(on|about|for|regarding)\s+/gi, '');
    cleaned = cleaned.trim();
    return cleaned || String(query).trim();
}

async function queryAcademicService(query) {
    const pythonServiceUrl = process.env.PYTHON_RAG_SERVICE_URL;
    if (!pythonServiceUrl) {
        throw new Error("Academic search service is not configured on the server.");
    }
    const searchUrl = `${pythonServiceUrl}/academic_search`;
    
    const cleanedQuery = cleanAcademicQuery(query);

    try {
        log.info('SYSTEM', `Academic search query cleaned: "${query}" -> "${cleanedQuery}"`);
        const response = await axios.post(searchUrl, { query: cleanedQuery }, { timeout: 45000 });
        const papers = response.data?.results || [];
        
        const toolOutput = papers.length > 0
            ? "Found the following relevant academic papers:\n\n" + papers.map((p, index) => 
                `[${index + 1}] **${p.title || 'Untitled Paper'}**\n` +
                `   - Source: ${p.source || 'Unknown'}\n` +
                `   - URL: ${p.url || '#'}\n` +
                `   - Summary: ${p.summary ? p.summary.substring(0, 300) + '...' : 'No summary.'}`
              ).join('\n\n')
            : "No relevant academic papers were found for this query.";
            
        const references = papers.map((p, index) => {
            const paperId = p.id || p.arxivId || p.url || '';
            let url = p.url;
            if (!url || url === '#' || url === 'null') {
                url = paperId.startsWith('http') ? paperId : `https://arxiv.org/abs/${paperId}`;
            }
            return {
                number: index + 1,
                title: p.title || 'Untitled Paper',
                source: p.source || 'arXiv',
                url: url.startsWith('http') ? url : `https://arxiv.org/abs/${url}`,
                authors: p.authors || [],
                year: p.publishedYear || p.year || 2024
            };
        });

        return { references, toolOutput };

    } catch (error) {
        const errorMsg = error.response?.data?.error || `Academic Service Error: ${error.message}`;
        throw new Error(errorMsg);
    }
}

function assertResearchIntent(context, toolName) {
    if (context?.intent === 'research') return;
    throw new Error(`${toolName} is disabled unless intent is "research".`);
}

/**
 * Available tools registry.
 * Each tool has:
 *  - description: what the tool does (for LLM routing)
 *  - execute: async function(params, context) => { toolOutput, references }
 *  - requiredParams: array of required parameter names
 *  - meta: chaining/monitoring metadata
 */
const availableTools = {
  web_search: {
    description: "Searches the internet for real-time, up-to-date information on current events, public figures, or general knowledge.",
    execute: async (params, context) => {
        assertResearchIntent(context, 'web_search');
        const { toolOutput, references } = await performWebSearch(params.query);
        return { references, toolOutput: toolOutput || "No results found from web search." };
    },
    requiredParams: ['query'],
    meta: {
        category: 'search',
        outputType: 'text',
        acceptsChainInput: true,
        avgLatencyMs: 3000,
        retryable: true,
        complementaryTools: [],
    },
  },
  rag_search: {
    description: "Searches the content of a specific, user-provided document to answer questions based on its text.",
    execute: async (params, context) => {
        return await queryPythonRagService(
            params.query, 
            context.documentContextName, 
            context.userId,
            context.criticalThinkingEnabled,
            context.filter
        );
    },
    requiredParams: ['query'],
    meta: {
        category: 'search',
        outputType: 'text',
        acceptsChainInput: true,
        avgLatencyMs: 5000,
        retryable: true,
        complementaryTools: ['kg_search'],
    },
  },
  kg_search: {
    description: "Finds structured facts and relationships within a document's pre-built knowledge graph. Use this to complement RAG search.",
    execute: async (params, context) => {
        const result = await queryKgService(params.query, context.documentContextName, context.userId);
        return {
            references: result?.references || [],
            toolOutput: typeof result?.toolOutput === 'string'
                ? result.toolOutput
                : (result?.toolOutput?.toolOutput || (result?.toolOutput ? JSON.stringify(result.toolOutput) : 'No specific facts were found in the knowledge graph.'))
        };
    },
    requiredParams: ['query'],
    meta: {
        category: 'search',
        outputType: 'text',
        acceptsChainInput: true,
        avgLatencyMs: 2000,
        retryable: true,
        complementaryTools: ['rag_search'],
    },
  },
  academic_search: {
    description: "Finds academic papers, research articles, and scholarly publications from scientific databases.",
    execute: async (params, context) => {
        assertResearchIntent(context, 'academic_search');
        return await queryAcademicService(params.query);
    },
    requiredParams: ['query'],
    meta: {
        category: 'search',
        outputType: 'text',
        acceptsChainInput: true,
        avgLatencyMs: 8000,
        retryable: true,
        complementaryTools: ['web_search'],
    },
  },
  generate_document: {
    description: "Generates a document file (like a PPTX or DOCX) on a given topic using internal knowledge. Use this when the user explicitly asks to 'create', 'make', 'build', or 'generate' a file. You must infer the 'topic' and 'doc_type' from the user's query.",
    execute: async (params, context) => {
        const { topic, doc_type } = params;
        const outputDir = path.join(__dirname, '..', 'assets', 'generated_docs');

        try {
            // Ensure output directory exists
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Generate structured content using LLM
            const docPrompt = doc_type === 'pptx'
                ? `Create a detailed presentation outline on "${topic}" with exactly 8-10 slides. For each slide provide:
SLIDE TITLE: <title>
CONTENT:
- Bullet point 1
- Bullet point 2
- Bullet point 3
SPEAKER NOTES: <brief notes>
---
Make it educational and well-structured.`
                : `Write a comprehensive, well-structured document on "${topic}".
Include:
1. Title and subtitle
2. Table of contents
3. Introduction
4. 3-5 main sections with subsections
5. Key takeaways / Summary
6. References (if applicable)
Format it in clean Markdown with proper headings, bullet points, and emphasis.`;

            const generatedContent = await geminiService.generateText(docPrompt, {
                apiKey: context?.apiKey,
                maxOutputTokens: 4096
            });

            // Save as markdown file (universally readable, can be converted to DOCX/PPTX)
            const timestamp = Date.now();
            const safeTopicName = topic.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').substring(0, 50);
            const fileName = `${safeTopicName}_${timestamp}.md`;
            const filePath = path.join(outputDir, fileName);

            fs.writeFileSync(filePath, generatedContent, 'utf-8');

            const downloadPath = `/api/upload/generated/${fileName}`;

            log.success('AI', `Document generated: ${fileName} (${generatedContent.length} chars)`);

            return {
                toolOutput: `✅ Document "${topic}" generated successfully as ${doc_type.toUpperCase()} format.\n\n📄 **Download**: [${fileName}](${downloadPath})\n\n---\n\n**Preview:**\n${generatedContent.substring(0, 500)}...`,
                references: [],
                filePath: downloadPath,
                fileName
            };
        } catch (error) {
            log.error('AI', `Document generation failed: ${error.message}`);
            return {
                toolOutput: `Failed to generate document on "${topic}": ${error.message}`,
                references: []
            };
        }
    },
    requiredParams: ['topic', 'doc_type'],
    meta: {
        category: 'generation',
        outputType: 'action',
        acceptsChainInput: false,
        avgLatencyMs: 8000,
        retryable: true,
        complementaryTools: [],
    },
  },

  // ========== [Team1-6] Extra Tools ==========
  submit_grade: {
    description: "Submits a grade for a challenge/bounty directly from the chat. Use this ONLY when the user answers a bounty challenge question. Evaluate their answer first, then call with the score.",
    execute: async (params, context) => {
      if (!Bounty || !solveBountyInternal) {
        return { toolOutput: "Grading service not available.", references: [] };
      }
      const { bountyId, score, feedback } = params;
      const userId = context.userId;
      if (!bountyId || !score) {
        return { toolOutput: "Error: Missing bountyId or score.", references: [] };
      }
      try {
        const bounty = await Bounty.findOne({ _id: bountyId, userId });
        if (!bounty) return { toolOutput: "Error: Challenge not found.", references: [] };
        if (bounty.isSolved) return { toolOutput: `Already completed. Score: ${bounty.score || 'N/A'}`, references: [] };
        const numericScore = parseInt(score);
        if (numericScore >= 60) {
          await solveBountyInternal(userId, bountyId);
          return { toolOutput: `Grade: ${numericScore}/100. PASSED! Credits and XP awarded.`, references: [] };
        }
        return { toolOutput: `Grade: ${numericScore}/100. FAILED. Review the topic and try again.`, references: [] };
      } catch (err) {
        return { toolOutput: `Error processing grade: ${err.message}`, references: [] };
      }
    },
    requiredParams: ['bountyId', 'score', 'feedback'],
    meta: {
      category: 'gamification',
      outputType: 'action',
      acceptsChainInput: false,
      avgLatencyMs: 500,
      retryable: false,
      complementaryTools: [],
    },
  },
  deep_research: {
    description: "Conducts comprehensive hybrid research combining local repository knowledge (70%) and online sources (30%). Use for in-depth academic or technical topics.",
    execute: async (params, context) => {
      const result = await conductDeepResearch(params.query, context, (status) => {
        if (context.streamCallback) {
          context.streamCallback({
            type: 'thought',
            content: `> 🔍 [Research Status] ${status}\n\n`,
            structured: { step: 'research_status', status }
          });
        }
      });
      return {
        toolOutput: result.summary,
        references: result.sources.map((s, i) => ({ number: i + 1, source: s.title || s.url, url: s.url }))
      };
    },
    requiredParams: ['query'],
    meta: {
      category: 'search',
      outputType: 'text',
      acceptsChainInput: true,
      avgLatencyMs: 15000,
      retryable: true,
      complementaryTools: ['academic_search', 'web_search'],
    },
  },
  autonomous_agent: {
    description: "Breaks down a complex user goal into sub-tasks and executes them automatically using a DAG (directed acyclic graph). Use for multi-step problems requiring planning.",
    execute: async (params, context) => {
      if (!executeAgentTask) {
        return { toolOutput: "Autonomous agent service not available.", references: [] };
      }
      return await executeAgentTask(params.goal, context);
    },
    requiredParams: ['goal'],
    meta: {
      category: 'orchestration',
      outputType: 'text',
      acceptsChainInput: true,
      avgLatencyMs: 30000,
      retryable: false,
      complementaryTools: [],
    },
  },
  create_study_plan: {
    description: "Creates and saves an interactive, personalized study plan or learning roadmap on any academic/engineering topic with structured modules, objectives, and hands-on activities. Use this when the user asks to build, generate, or create a study plan, learning path, or curriculum.",
    execute: async (params, context) => {
      const { goal } = params;
      const userId = context?.userId;
      if (!goal) {
        return { toolOutput: "Please specify a topic or learning goal for your study plan.", references: [] };
      }
      if (!userId) {
        return { toolOutput: `Please log in to generate and save your personalized study plan for "${goal}".`, references: [] };
      }
      try {
        const { createLearningPath } = require('./learning/curriculumOrchestrator');
        const plan = await createLearningPath(userId, goal);
        if (plan.isQuestionnaire) {
          const qList = (plan.questions || []).map((q, i) => `${i + 1}. **${q.questionText}**${q.options ? ' (' + q.options.join(', ') + ')' : ''}`).join('\n');
          return {
            toolOutput: `To tailor your personalized study plan for **${goal}**, please answer these questions:\n\n${qList}\n\n👉 You can also customize it directly in the [Study Plan Center](/study-plan).`,
            references: []
          };
        }
        const moduleSummary = (plan.modules || []).slice(0, 8).map((m, i) => `• **Module ${i + 1}: ${m.title}** — ${m.objective}`).join('\n');
        return {
          toolOutput: `🎓 **Personalized Study Plan Created: ${plan.title}**\n\nYour interactive curriculum with **${plan.modules?.length || 0} modules** has been saved to your account:\n\n${moduleSummary}\n\n👉 **[Open Interactive Study Plan in iMentor](/study-plan)**`,
          references: [],
          studyPlanId: plan._id
        };
      } catch (err) {
        return { toolOutput: `Failed to create study plan: ${err.message}`, references: [] };
      }
    },
    requiredParams: ['goal'],
    meta: {
      category: 'learning',
      outputType: 'action',
      acceptsChainInput: false,
      avgLatencyMs: 8000,
      retryable: true,
      complementaryTools: [],
    },
  },
};

/**
 * Get metadata for a specific tool.
 * @param {string} toolName
 * @returns {Object|null} Tool metadata
 */
function getToolMeta(toolName) {
    const tool = availableTools[toolName];
    if (!tool) return null;
    return {
        name: toolName,
        description: tool.description,
        requiredParams: tool.requiredParams,
        ...(tool.meta || {}),
    };
}

/**
 * Get all tool names and descriptions (for LLM prompts).
 * @returns {Array} Array of { name, description }
 */
function getToolSummaries() {
    return Object.entries(availableTools).map(([name, tool]) => ({
        name,
        description: tool.description,
        category: tool.meta?.category || 'general',
    }));
}

module.exports = { availableTools, getToolMeta, getToolSummaries };