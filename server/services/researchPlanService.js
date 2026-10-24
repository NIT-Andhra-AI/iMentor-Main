const log = require('../utils/logger');
const { LLMRouter } = require('./llmRouterService');

/**
 * PhD Research Strategist & Literature Review Planner (Phase 1)
 *
 * Deconstructs a scholar's query into:
 *  1. PICO / STEM Problem Deconstruction (Core Phenomenon, Methodological Focus, Baselines, Metrics/Datasets, Constraints)
 *  2. Multi-Engine Boolean Keyword Matrix & Controlled Vocabulary (Google Scholar, Semantic Scholar, IEEE/Scopus, OpenAlex/arXiv)
 *  3. Academic Sentence Framing Bank (4 rhetorical categories for PhD manuscript drafting)
 *  4. Thematic Research Dimensions & Counter-Evidence Queries
 */
const researchPlanService = {
  async generatePlan(query, userId, options = {}) {
    log.info('RESEARCH', `[ResearchPlanService] Generating PhD strategy blueprint for: "${query}"`);

    if (options.approvedPlan && typeof options.approvedPlan === 'object' && options.approvedPlan.problemDeconstruction) {
      log.info('RESEARCH', '[ResearchPlanService] Using user-approved interactive strategy blueprint');
      return this.normalizePlan(query, options.approvedPlan);
    }

    const prompt = `You are a Senior PhD Thesis Advisor and Systematic Literature Review Strategist.
Analyze the following research topic and output a structured JSON strategy blueprint:
TOPIC: "${query}"

Output ONLY valid JSON (no markdown fences, no commentary) matching this exact schema:
{
  "problemDeconstruction": {
    "corePhenomenonOrSystem": "Primary physical, biological, computational, or mathematical system under study",
    "methodologicalFocus": "Primary algorithms, architectures, theoretical models, or experimental methods",
    "baselineParadigms": "Competing or classical baseline methods to compare against",
    "evaluationMetricsAndDatasets": "Standard quantitative metrics (e.g., RMSE, F1, latency, dB) and benchmark datasets/testbeds",
    "keyConstraintsAndRegimes": "Operating constraints, edge regimes, or scalability bottlenecks",
    "recommendedTaxonomy": "How the literature review should categorize existing papers (e.g., Physics-Based vs Data-Driven vs Hybrid)"
  },
  "keywordTaxonomy": {
    "primaryKeywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"],
    "controlledVocabulary": ["IEEE/ACM/MeSH term 1", "term 2", "term 3"],
    "synonymClusters": [
      { "concept": "Core Concept 1", "synonyms": ["synonym A", "synonym B", "acronym"] },
      { "concept": "Core Concept 2", "synonyms": ["synonym C", "synonym D"] }
    ],
    "booleanSearchStrings": {
      "googleScholar": "(\"exact phrase 1\" OR \"synonym\") AND (\"method A\" OR \"method B\")",
      "semanticScholar": "concise high-precision semantic query string",
      "ieeeAndScopus": "(TITLE-ABS-KEY(\"term1\") AND TITLE-ABS-KEY(\"term2\"))",
      "openAlexAndArxiv": "core technical terms for OpenAlex and arXiv"
    }
  },
  "sentenceFramingBank": {
    "problemStatementFramings": [
      "Accurate characterization of [core system] remains a fundamental challenge in [domain] due to [constraint] [1], [2].",
      "While conventional [baseline paradigm] approaches provide interpretable formulations, they exhibit degraded fidelity under [regime] [3]."
    ],
    "comparativeSynthesisFramings": [
      "Whereas [Author et al.] [1] formulate the problem via [Method A], subsequent studies [2], [4] demonstrate that [Method B] reduces [metric] by [X]% on [Dataset].",
      "A taxonomy of recent literature reveals a structural trade-off between the physical consistency of [Approach A] [1] and the expressive capacity of [Approach B] [3]."
    ],
    "critiqueAndLimitationFramings": [
      "Despite achieving state-of-the-art accuracy on stationary benchmarks, [Method] [2] incurs O(N^2) computational overhead and lacks out-of-distribution guarantees.",
      "A critical limitation pervading studies [1]–[4] is their reliance on idealized boundary assumptions that rarely hold in practical deployments."
    ],
    "researchGapAndContributionFramings": [
      "To date, few studies have systematically reconciled [Paradigm A] with [Paradigm B] under [strict regime], leaving a critical research lacuna.",
      "Addressing this gap requires a unified framework that jointly optimizes [Metric 1] and [Metric 2] across heterogeneous testbeds."
    ]
  },
  "research_dimensions": [
    "Theoretical formulation and governing mechanisms",
    "Methodological taxonomy and architectural evolution",
    "Benchmark datasets, experimental testbeds, and quantitative metrics",
    "Failure modes, computational complexity, and open PhD research gaps"
  ],
  "research_objectives": [
    "Synthesize and contrast competing methodologies across peer-reviewed studies",
    "Compile a side-by-side comparison matrix of datasets, architectures, and quantitative metrics",
    "Isolate unresolved contradictions and formulate actionable PhD research directions"
  ],
  "expanded_search_queries": [
    "specific academic search query 1",
    "specific academic search query 2",
    "specific academic search query 3",
    "specific academic search query 4",
    "specific academic search query 5",
    "specific academic search query 6"
  ],
  "counter_evidence_queries": [
    "limitations failure modes of topic",
    "computational overhead trade-offs of topic"
  ]
}`;

    try {
      // Use deepResearchContext: false so SGLang uses fast non-thinking JSON generation (~3.5s)
      const responseText = await LLMRouter.generate({
        query: prompt + "\n/no_think",
        userId: userId,
        deepResearchContext: false,
        systemPrompt: "You are a PhD research strategist. Output strictly valid, compact JSON on a single pass without markdown commentary."
      });

      const raw = typeof responseText === 'string'
        ? responseText
        : (responseText?.finalAnswer || responseText?.content || String(responseText));

      const cleaned = raw
        .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '')
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        // Sanitize unescaped control characters inside JSON string literals
        const safeJson = jsonMatch[0].replace(/[\x00-\x1F]+/g, ' ');
        const parsed = JSON.parse(safeJson);
        return this.normalizePlan(query, parsed);
      }
    } catch (err) {
      log.warn('RESEARCH', `[ResearchPlanService] LLM plan generation fallback triggered: ${err.message}`);
    }

    return this.buildFallbackPlan(query);
  },


  async refinePlanConversationally(query, currentPlan = {}, instruction = '', seedPapers = [], userId = null) {
    log.info('RESEARCH', `[ResearchPlanService] Conversational plan refinement for "${query}": "${instruction}"`);
    const basePlan = this.normalizePlan(query, currentPlan);
    const seedNote = Array.isArray(seedPapers) && seedPapers.length > 0
      ? `\nUSER-ANCHORED SEED PAPERS (must be prioritized in keywords and search queries): ${seedPapers.join('; ')}`
      : '';

    const prompt = `You are a Senior PhD Thesis Advisor refining a Systematic Literature Review strategy based on the scholar's feedback.
ORIGINAL RESEARCH TOPIC: "${query}"
CURRENT STRATEGY JSON:
${JSON.stringify({
  problemDeconstruction: basePlan.problemDeconstruction,
  keywordTaxonomy: basePlan.keywordTaxonomy,
  research_dimensions: basePlan.research_dimensions,
  expanded_search_queries: basePlan.expanded_search_queries
})}
${seedNote}

SCHOLAR'S REFINEMENT INSTRUCTION:
"${instruction}"

Update the JSON strategy so that problemDeconstruction, primaryKeywords, booleanSearchStrings, research_dimensions, and expanded_search_queries directly incorporate the scholar's refinement instruction and any seed papers.
Output ONLY valid JSON matching the exact input schema (no markdown fences, no commentary).
/no_think`;

    try {
      const responseText = await LLMRouter.generate({
        query: prompt,
        userId,
        deepResearchContext: false,
        systemPrompt: "You are a PhD research strategist. Output strictly valid, compact JSON on a single pass."
      });
      const raw = typeof responseText === 'string'
        ? responseText
        : (responseText?.finalAnswer || responseText?.content || String(responseText));
      const cleaned = raw.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '').replace(/```json/gi, '').replace(/```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0].replace(/[\x00-\x1F]+/g, ' '));
        const merged = this.normalizePlan(query, {
          ...basePlan,
          ...parsed,
          problemDeconstruction: { ...basePlan.problemDeconstruction, ...(parsed.problemDeconstruction || {}) },
          keywordTaxonomy: { ...basePlan.keywordTaxonomy, ...(parsed.keywordTaxonomy || {}) },
          sentenceFramingBank: { ...basePlan.sentenceFramingBank, ...(parsed.sentenceFramingBank || {}) },
          seedPapers: Array.isArray(seedPapers) && seedPapers.length > 0 ? seedPapers : basePlan.seedPapers,
          lastRefinementInstruction: instruction
        });
        return merged;
      }
    } catch (err) {
      log.warn('RESEARCH', `[ResearchPlanService] Conversational refinement fallback: ${err.message}`);
    }

    // Deterministic fallback update if LLM JSON fails
    const updatedQueries = [
      `${query} ${instruction}`.slice(0, 140),
      ...(basePlan.expanded_search_queries || []).slice(0, 5)
    ];
    return {
      ...basePlan,
      problemDeconstruction: {
        ...basePlan.problemDeconstruction,
        keyConstraintsAndRegimes: `${basePlan.problemDeconstruction?.keyConstraintsAndRegimes || ''}; Refined focus: ${instruction}`.replace(/^;s*/, '')
      },
      expanded_search_queries: updatedQueries,
      seedPapers: Array.isArray(seedPapers) && seedPapers.length > 0 ? seedPapers : basePlan.seedPapers,
      lastRefinementInstruction: instruction
    };
  },

  normalizePlan(query, plan = {}) {
    const fallback = this.buildFallbackPlan(query);
    const pd = { ...fallback.problemDeconstruction, ...(plan.problemDeconstruction || {}) };
    const rawKt = plan.keywordTaxonomy || {};
    let boolStrings = rawKt.booleanSearchStrings || fallback.keywordTaxonomy.booleanSearchStrings;
    if (Array.isArray(boolStrings)) {
      boolStrings = {
        googleScholar: boolStrings[0] || fallback.keywordTaxonomy.booleanSearchStrings.googleScholar,
        semanticScholar: boolStrings[1] || fallback.keywordTaxonomy.booleanSearchStrings.semanticScholar,
        ieeeAndScopus: boolStrings[2] || fallback.keywordTaxonomy.booleanSearchStrings.ieeeAndScopus,
        openAlexAndArxiv: boolStrings[3] || fallback.keywordTaxonomy.booleanSearchStrings.openAlexAndArxiv,
      };
    }

    const rawSfb = plan.sentenceFramingBank || {};
    const sentenceFramingBank = {
      problemStatementFramings: rawSfb.problemStatementFramings || rawSfb.establishingTerritory || fallback.sentenceFramingBank.problemStatementFramings,
      comparativeSynthesisFramings: rawSfb.comparativeSynthesisFramings || rawSfb.statingMethodologyAndContribution || fallback.sentenceFramingBank.comparativeSynthesisFramings,
      critiqueAndLimitationFramings: rawSfb.critiqueAndLimitationFramings || rawSfb.critiquingPriorLiterature || fallback.sentenceFramingBank.critiqueAndLimitationFramings,
      researchGapAndContributionFramings: rawSfb.researchGapAndContributionFramings || rawSfb.identifyingResearchGap || fallback.sentenceFramingBank.researchGapAndContributionFramings,
    };

    return {
      ...fallback,
      ...plan,
      problemDeconstruction: pd,
      keywordTaxonomy: {
        primaryKeywords: Array.isArray(rawKt.primaryKeywords) && rawKt.primaryKeywords.length > 0
          ? rawKt.primaryKeywords
          : fallback.keywordTaxonomy.primaryKeywords,
        controlledVocabulary: Array.isArray(rawKt.controlledVocabulary) && rawKt.controlledVocabulary.length > 0
          ? rawKt.controlledVocabulary
          : fallback.keywordTaxonomy.controlledVocabulary,
        synonymClusters: Array.isArray(rawKt.synonymClusters) && rawKt.synonymClusters.length > 0
          ? rawKt.synonymClusters
          : fallback.keywordTaxonomy.synonymClusters,
        booleanSearchStrings: boolStrings,
      },
      sentenceFramingBank,
      seedPapers: Array.isArray(plan.seedPapers) ? plan.seedPapers : [],
      clarifyingScopeQuestions: Array.isArray(plan.clarifyingScopeQuestions) && plan.clarifyingScopeQuestions.length > 0
        ? plan.clarifyingScopeQuestions
        : [
            {
              id: 'temporalScope',
              question: 'Publication Horizon & Historical Balance',
              selected: plan.scopeSelections?.temporalScope || 'Seminal Foundations + 2022–2026 SOTA',
              options: ['Seminal Foundations + 2022–2026 SOTA', 'Strict Frontier Only (2023–2026)', '10-Year Longitudinal Evolution (2016–2026)']
            },
            {
              id: 'methodologicalEmphasis',
              question: 'Primary Analytical Emphasis',
              selected: plan.scopeSelections?.methodologicalEmphasis || 'Balanced Theory, Architecture & Empirical Benchmarks',
              options: ['Balanced Theory, Architecture & Empirical Benchmarks', 'Mathematical Formulations & Theoretical Proofs', 'Experimental Testbeds, Hardware & Real-Time Deployment']
            },
            {
              id: 'reviewStyle',
              question: 'Target Manuscript / Deliverable Format',
              selected: plan.scopeSelections?.reviewStyle || 'PhD Thesis Chapter 2 (Comprehensive Review)',
              options: ['PhD Thesis Chapter 2 (Comprehensive Review)', 'IEEE / ACM Survey Paper Taxonomy', 'Grant Proposal State-of-the-Art & Research Gaps']
            }
          ],
      research_dimensions: Array.isArray(plan.research_dimensions) && plan.research_dimensions.length > 0
        ? plan.research_dimensions
        : fallback.research_dimensions,
      research_objectives: Array.isArray(plan.research_objectives) && plan.research_objectives.length > 0
        ? plan.research_objectives
        : fallback.research_objectives,
      expanded_search_queries: Array.isArray(plan.expanded_search_queries) && plan.expanded_search_queries.length > 0
        ? plan.expanded_search_queries
        : fallback.expanded_search_queries,
      counter_evidence_queries: Array.isArray(plan.counter_evidence_queries) && plan.counter_evidence_queries.length > 0
        ? plan.counter_evidence_queries
        : fallback.counter_evidence_queries,
    };
  },

  buildFallbackPlan(query) {
    const stopWords = new Set(['the', 'and', 'for', 'with', 'from', 'using', 'based', 'under', 'into', 'over', 'between', 'versus', 'vs']);
    const tokens = String(query || '')
      .replace(/[^a-zA-Z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()));

    const primaryKeywords = tokens.length >= 3
      ? [tokens.slice(0, 2).join(' '), tokens.slice(2, 4).join(' '), ...tokens.slice(4, 7)].filter(Boolean)
      : [query];

    const c1 = primaryKeywords[0] || query;
    const c2 = primaryKeywords[1] || 'methodology';

    return {
      problemDeconstruction: {
        corePhenomenonOrSystem: query,
        methodologicalFocus: `Comparative algorithmic, mathematical, and empirical architectures for ${c1}`,
        baselineParadigms: `Conventional analytical models vs. modern data-driven and hybrid paradigms`,
        evaluationMetricsAndDatasets: `Estimation accuracy (RMSE, MAE, R²), computational latency, convergence stability, and standard domain benchmarks`,
        keyConstraintsAndRegimes: `Out-of-distribution generalization, real-time hardware constraints, noisy measurement regimes, and parameter identifiability`,
        recommendedTaxonomy: `1. Analytical/Physics-Driven Models; 2. Pure Data-Driven Architectures; 3. Hybrid Domain-Informed Frameworks`
      },
      keywordTaxonomy: {
        primaryKeywords,
        controlledVocabulary: [
          `${c1} Modeling`,
          `Quantitative Benchmark Evaluation`,
          `Algorithmic Generalization`
        ],
        synonymClusters: [
          { concept: c1, synonyms: [c1, `${c1} framework`, `${c1} architecture`] },
          { concept: c2, synonyms: [c2, 'empirical estimation', 'predictive modeling'] }
        ],
        booleanSearchStrings: {
          googleScholar: `("${c1}") AND ("${c2}" OR "benchmark" OR "comparative analysis")`,
          semanticScholar: `${query} methodology benchmark evaluation`,
          ieeeAndScopus: `TITLE-ABS-KEY("${c1}") AND TITLE-ABS-KEY("${c2}")`,
          openAlexAndArxiv: `${tokens.slice(0, 6).join(' ')}`
        }
      },
      sentenceFramingBank: {
        problemStatementFramings: [
          `High-fidelity modeling and estimation of ${c1} represents a foundational challenge due to nonlinear dynamics and coupled operating constraints [1], [2].`,
          `While classical baseline formulations provide tractable approximations under stationary regimes, their accuracy degrades significantly under realistic boundary perturbations [3].`
        ],
        comparativeSynthesisFramings: [
          `Whereas early studies [1], [2] relied primarily on hand-crafted features or simplified physical assumptions, recent architectures [3], [4] leverage end-to-end representation learning to capture long-range dependencies.`,
          `A direct cross-study comparison reveals that hybrid domain-informed frameworks [2], [5] consistently outperform unconstrained black-box models in sample-scarce regimes.`
        ],
        critiqueAndLimitationFramings: [
          `Despite reporting low error metrics on curated laboratory datasets, existing architectures [3], [4] exhibit high sensitivity to hyperparameter initialization and sensor noise.`,
          `A persistent methodological limitation across prior works [1]–[5] is the absence of standardized cross-dataset generalization benchmarks.`
        ],
        researchGapAndContributionFramings: [
          `Consequently, a critical research lacuna remains in unifying physical/theoretical guarantees with computationally lightweight architectures suitable for real-time deployment.`,
          `To bridge this gap, future doctoral investigations must establish rigorous identifiability bounds alongside multi-regime experimental validation.`
        ]
      },
      clarifyingScopeQuestions: [
        {
          id: 'temporalScope',
          question: 'Publication Horizon & Historical Balance',
          selected: 'Seminal Foundations + 2022–2026 SOTA',
          options: ['Seminal Foundations + 2022–2026 SOTA', 'Strict Frontier Only (2023–2026)', '10-Year Longitudinal Evolution (2016–2026)']
        },
        {
          id: 'methodologicalEmphasis',
          question: 'Primary Analytical Emphasis',
          selected: 'Balanced Theory, Architecture & Empirical Benchmarks',
          options: ['Balanced Theory, Architecture & Empirical Benchmarks', 'Mathematical Formulations & Theoretical Proofs', 'Experimental Testbeds, Hardware & Real-Time Deployment']
        },
        {
          id: 'reviewStyle',
          question: 'Target Manuscript / Deliverable Format',
          selected: 'PhD Thesis Chapter 2 (Comprehensive Review)',
          options: ['PhD Thesis Chapter 2 (Comprehensive Review)', 'IEEE / ACM Survey Paper Taxonomy', 'Grant Proposal State-of-the-Art & Research Gaps']
        }
      ],
      research_dimensions: [
        `Theoretical foundations and mathematical problem formulation of ${c1}`,
        `Taxonomic comparison of competing methodologies and model architectures`,
        `Experimental datasets, simulation testbeds, and quantitative performance benchmarks`,
        `Methodological limitations, failure modes, and open PhD research directions`
      ],
      research_objectives: [
        `Deconstruct and compare state-of-the-art methodologies for ${query}`,
        `Synthesize quantitative metrics, datasets, and architectural trade-offs in a structured matrix`,
        `Identify unresolved contradictions and formulate high-impact PhD research gaps`
      ],
      expanded_search_queries: [
        query,
        `${query} benchmark dataset evaluation`,
        `${query} comparative analysis review`,
        `${c1} ${c2} quantitative performance`,
        `${query} limitations challenges future directions`
      ],
      counter_evidence_queries: [
        `${query} limitations failure modes`,
        `${query} computational cost trade-off`
      ]
    };
  }
};

module.exports = researchPlanService;
