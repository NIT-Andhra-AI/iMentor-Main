const log = require('../utils/logger');
const mongoose = require('mongoose');
/**
 * Deep Research Orchestrator (v3 — PhD Literature Review & Institutional Full-Text Engine)
 *
 * Key Capabilities:
 *  - Phase 1: Query Strategist, PICO/STEM Problem Deconstruction, Boolean Keyword Matrix & Sentence Framing Bank
 *  - Phase 2: Multi-Aggregator Open-Access & Q1 Discovery (OpenAlex, Semantic Scholar Bulk, arXiv, EuropePMC, OpenReview, Google Scholar, DBLP, Crossref) + 1-Hop Citation Snowballing
 *  - Phase 3: 2-Tier Full-Text PDF Harvester (Tier 1 OA HTTP Stream + Tier 2 NIT Andhra Pradesh Institutional Browser Harvester) + pdftotext Section Parser
 *  - Phase 4: SGLang KV-Cache-Aligned Thematic Synthesis + Side-by-Side Comparison Matrix + PhD Research Gaps
 */

const ResearchCache = require('../models/ResearchCache');
const localKnowledgeBase = require('./localKnowledgeBase');
const webCrawlerService = require('./webCrawlerService');
const sourceCredibilityService = require('./sourceCredibilityService');
const researchPlanService = require('./researchPlanService');
const researchSynthesisService = require('./researchSynthesisService');
const citationEnrichmentService = require('./citationEnrichmentService');
const academicSourceService = require('./academicSourceService');
const semanticScholarService = require('./semanticScholarService');
const institutionalPdfService = require('./institutionalPdfService');
const rustComputeClient = require('./rustComputeClient');
const citationGraphService = require('./citationGraphService');
const factCheckingService = require('./factCheckingService');
const researchIntelligenceService = require('./researchIntelligenceService');
const researchQueryGenerator = require('./researchQueryGenerator');
const axios = require('axios');
const { createPerformanceTracker, logPerformance } = require('./performanceDiagnosticsService');

const RAG_SERVICE_URL = process.env.PYTHON_RAG_SERVICE_URL || process.env.RAG_SERVICE_URL || 'http://localhost:2005';

async function runCrewAiResearch(query, options = {}, onProgress = null) {
    log.info('SYSTEM', `Starting CrewAI deep research for: "${query}"`);
    if (onProgress) onProgress({ phase: 'init', message: 'Initializing CrewAI Research Agents...' });

    try {
        if (onProgress) onProgress({ phase: 'planning', message: 'Agents are planning the research strategy...' });

        const response = await axios.post(`${RAG_SERVICE_URL}/crewai-research`, {
            topic: query,
        }, {
            timeout: 900000,
            headers: { 'Content-Type': 'application/json' }
        });

        if (onProgress) onProgress({ phase: 'synthesizing', message: 'Agents are synthesizing the final report...' });

        const finalReport = response.data.result;
        if (!finalReport || typeof finalReport !== 'string' || finalReport.trim() === '') {
            throw new Error('CrewAI returned an empty or invalid report.');
        }

        const researchResult = {
            query, userId: options.userId,
            normalizedQuery: query.toLowerCase().trim(),
            sources: [], overallConfidenceScore: 95,
            createdAt: new Date(),
            researchReport: { fullReport: finalReport, summary: finalReport.slice(0, 500) }
        };

        if (onProgress) onProgress({ phase: 'completed', message: 'Research Complete.',
            fullReport: researchResult.researchReport,
            metaData: { retrievalMode: 'CrewAI', totalSources: 0, confidenceScore: 95 },
            sourceData: [], graphData: null });

        log.success('AI', `CrewAI research complete for: "${query}"`);
        return { researchBundle: researchResult, researchReport: researchResult.researchReport, performanceDiagnostics: {} };

    } catch (error) {
        log.error('AI', `CrewAI research failed: ${error.message}`);
        if (onProgress) onProgress({ phase: 'error', message: `CrewAI research failed: ${error.message}` });
        throw error;
    }
}

async function fetchOpenAlexQuota(queries, quota, constraints = {}) {
    if (!queries.length || quota <= 0) return [];
    const perQuery = Math.ceil(quota / queries.length) + 2;
    return academicSourceService.fetchOpenAlexBatch(queries, perQuery, constraints);
}

async function fetchSemanticQuota(queries, quota, constraints = {}) {
    if (!queries.length || quota <= 0) return [];
    const perQuery = Math.ceil(quota / queries.length) + 2;
    return academicSourceService.fetchSemanticBatch(queries, perQuery, constraints);
}

async function fetchArxivQuota(queries, quota, constraints = {}) {
    if (!queries.length || quota <= 0) return [];
    const perQuery = Math.ceil(quota / queries.length) + 2;
    return academicSourceService.fetchArxivBatch(queries, perQuery, constraints);
}

async function fetchMultiAggregatorQuota(queries, quota, constraints = {}) {
    if (!queries.length || quota <= 0) return [];
    const perQuery = Math.max(4, Math.ceil(quota / Math.max(1, queries.length)));
    return academicSourceService.fetchMultiAggregatorBatch(queries.slice(0, 4), perQuery, constraints);
}

async function fetchWebQuota(queries, quota) {
    if (!queries.length || quota <= 0) return [];
    const perQuery = Math.max(2, Math.ceil(quota / queries.length));
    const results = [];
    const seen = new Set();
    for (const q of queries) {
        try {
            const webSources = await webCrawlerService.searchAndCrawl(q, perQuery);
            for (const s of (webSources || [])) {
                const key = (s.url || s.title || '').toLowerCase();
                if (key && !seen.has(key)) { seen.add(key); results.push(s); }
                if (results.length >= quota * 1.5) break;
            }
        } catch (_) { /* skip failed web query */ }
    }
    return academicSourceService.tagWebSources(results);
}

const deepResearchOrchestrator = {

    /**
     * Run a comprehensive PhD-level deep research & literature review query.
     */
    async runDeepResearch(query, options = {}, onProgress = null) {
        if (process.env.USE_CREWAI_RESEARCH === 'true') {
            return runCrewAiResearch(query, options, onProgress);
        }

        const startTime       = Date.now();
        const perf            = createPerformanceTracker({ mode: 'deepResearch', queryPreview: String(query || '').slice(0, 80) });
        const normalizedQuery = query.toLowerCase().trim();
        const jobDoc          = options.jobDoc || null;

        // Pre-allocate MongoDB ObjectId so harvested PDFs are stored under the exact reportId folder
        const reportObjectId  = new mongoose.Types.ObjectId();
        const sessionFolderId = String(reportObjectId);

        const researchConfig = researchIntelligenceService.resolveResearchConfig(query, {
            nature: options.nature || options.researchConfig?.nature || 'academic',
            depth:  options.depth  || options.researchConfig?.depth  || 'medium',
            ...(options.researchConfig || {}),
        });

        const activityLog = [];
        const progress = async (phase, message, extra = {}) => {
            if (message && phase !== 'token') {
                activityLog.push({
                    id: activityLog.length + 1,
                    timestamp: new Date().toISOString(),
                    phase,
                    message,
                    badge: extra.badge || phase.toUpperCase()
                });
            }
            extra.activityLog = activityLog.slice(-30);
            if (onProgress) onProgress({ phase, message, ...extra });
            if (jobDoc) await jobDoc.addProgress(phase, message).catch(() => {});
        };

        log.info('SYSTEM', `Deep research [${researchConfig.nature}/${researchConfig.depth}] "${query}" — target: ${researchConfig.target_source_count} sources (reportId: ${sessionFolderId})`);
        await progress('init', `PhD Literature Review Engine initialised (${researchConfig.nature} / ${researchConfig.depth})`);

        // ── 0. Generate PhD Research Strategy Blueprint ───────────────────────
        await progress('planning', 'Deconstructing research problem, Boolean keyword matrix & sentence framing...');
        let researchPlan = {};
        const approvedPlan = options.approvedPlan || options.researchConfig?.approvedPlan || null;
        try {
            const planStart = Date.now();
            researchPlan = await researchPlanService.generatePlan(query, options.userId, { approvedPlan });
            perf.addLlm(Date.now() - planStart);
            researchPlan = { ...researchPlan, ...researchIntelligenceService.buildQueryBlueprint(query, researchPlan) };
            await progress('plan_ready', 'PhD Research Strategy & Boolean Matrix ready', { plan: researchPlan });
        } catch (planError) {
            researchPlan = researchIntelligenceService.buildQueryBlueprint(query, {});
            await progress('plan_ready', 'Using fallback research plan', { plan: researchPlan });
        }

        // ── 1. Cache check (skip if user provided custom approvedPlan or forceRefresh) ──
        if (!options.forceRefresh && !approvedPlan) {
            const dbReadStart = Date.now();
            const cachedResult = await ResearchCache.findOne({ normalizedQuery }).sort({ createdAt: -1 }).lean();
            perf.addDb(Date.now() - dbReadStart);
            if (cachedResult?.sources?.length >= Math.min(researchConfig.target_source_count, 10) &&
                Array.isArray(cachedResult?.researchReport?.comparisonMatrix) &&
                cachedResult.researchReport.comparisonMatrix.length > 0) {
                log.info('SYSTEM', `Research cache hit: "${query}"`);
                if (onProgress) onProgress({
                    phase: 'completed',
                    message: 'Retrieved from Cache',
                    fullReport: { ...cachedResult.researchReport, reportId: String(cachedResult._id) },
                    metaData: { retrievalMode: cachedResult.mode || 'HYBRID', totalSources: cachedResult.sources?.length || 0, confidenceScore: cachedResult.overallConfidenceScore || 0 },
                    sourceData: cachedResult.sources,
                    graphData: cachedResult.citationGraphData
                });

                const diagnostics = perf.toLogPayload({ branchCount: 1, toolCalls: 0, tokenUsageEstimate: Math.ceil(String(cachedResult.researchReport?.fullReport || '').length / 4) });
                logPerformance(diagnostics);
                return { researchBundle: cachedResult, researchReport: { ...cachedResult.researchReport, reportId: String(cachedResult._id) }, savedDocId: cachedResult._id, performanceDiagnostics: diagnostics };
            }
        }

        // ── 2. Generate source-type-specific queries + inject Boolean strings ──
        await progress('generating_queries', 'Formulating multi-engine academic search queries...');
        let querySets = { openalex: [], semantic: [], arxiv: [], web: [], constraints: {} };
        try {
            querySets = await researchQueryGenerator.generateQuerySets(query, researchConfig, options.userId);
        } catch (qErr) {
            log.warn('RESEARCH', `Query generation failed, using plan queries: ${qErr.message}`);
            const planQueries = researchPlan.expanded_search_queries || [query];
            querySets.openalex    = planQueries.slice(0, 8);
            querySets.semantic    = planQueries.slice(0, 6);
            querySets.arxiv       = planQueries.slice(0, 4);
            querySets.web         = planQueries.slice(0, 3);
            querySets.constraints = researchQueryGenerator.extractQueryConstraints(query);
        }

        // Inject primary keywords and Boolean strings from Phase 1 researchPlan
        const primaryKw = researchPlan.keywordTaxonomy?.primaryKeywords || [];
        const planExpanded = researchPlan.expanded_search_queries || [];
        if (primaryKw.length > 0) {
            const kwQuery = primaryKw.slice(0, 4).join(' ');
            querySets.openalex = [query, kwQuery, ...planExpanded.slice(0, 4), ...querySets.openalex].slice(0, 10);
            querySets.semantic = [query, kwQuery, ...planExpanded.slice(0, 4), ...querySets.semantic].slice(0, 8);
            querySets.arxiv    = [query, kwQuery, ...querySets.arxiv].slice(0, 6);
        }

        const activeConstraints = {
            ...querySets.constraints || {},
            ...(researchConfig.constraints || {}),
            trustedPublishersOnly: researchConfig.constraints?.trustedPublishersOnly !== false,
        };

        // ── 3. Local knowledge ───────────────────────────────────────────────
        await progress('searching_local', 'Checking internal knowledge graph...');
        const localStart   = Date.now();
        const localSources = await localKnowledgeBase.getLocalSources(query, { limit: 10 });
        perf.addTool(Date.now() - localStart);
        const reusableSources = researchIntelligenceService.getReusableValidatedSources(query, researchConfig.target_source_count);

        // ── 4. Parallel academic + multi-aggregator OA + web fetch ────────────
        await progress('searching_online', `Querying OpenAlex, Semantic Scholar, arXiv, EuropePMC OA, OpenReview, Google Scholar & DBLP...`);

        const onlineStart = Date.now();
        const [openAlexResult, semanticResult, arxivResult, multiAggResult, webResult] = await Promise.allSettled([
            fetchOpenAlexQuota(querySets.openalex, researchConfig.openAlexTarget, activeConstraints),
            fetchSemanticQuota(querySets.semantic,  researchConfig.semanticTarget, activeConstraints),
            fetchArxivQuota(querySets.arxiv,        researchConfig.arxivTarget,    activeConstraints),
            fetchMultiAggregatorQuota(querySets.semantic.slice(0, 3), Math.max(12, Math.ceil(researchConfig.target_source_count * 0.5)), activeConstraints),
            fetchWebQuota(querySets.web,             researchConfig.webTarget),
        ]);
        perf.addTool(Date.now() - onlineStart);

        let openAlexSources = openAlexResult.status === 'fulfilled' ? openAlexResult.value : [];
        let semanticSources = semanticResult.status === 'fulfilled' ? semanticResult.value : [];
        let arxivSources    = arxivResult.status    === 'fulfilled' ? arxivResult.value    : [];
        let multiAggSources = multiAggResult.status === 'fulfilled' ? multiAggResult.value : [];
        const rawWebSources = webResult.status      === 'fulfilled' ? webResult.value      : [];

        // ── 4b. Constraint-only fallback: if venue filter produced nothing, retry year-only ──
        const totalConstrained = openAlexSources.length + semanticSources.length + arxivSources.length + multiAggSources.length;
        if (totalConstrained === 0 && activeConstraints.venueFilter) {
            log.warn('RESEARCH', `Zero results with venue=${activeConstraints.venueFilter} filter — retrying year-only`);
            await progress('searching_online', `No results for venue:${activeConstraints.venueFilter} — expanding to year-only filter...`);
            const yearOnlyConstraints = { yearStart: activeConstraints.yearStart, yearEnd: activeConstraints.yearEnd, trustedPublishersOnly: true };
            const [oaR2, ssR2, axR2] = await Promise.allSettled([
                fetchOpenAlexQuota(querySets.openalex, researchConfig.openAlexTarget, yearOnlyConstraints),
                fetchSemanticQuota(querySets.semantic,  researchConfig.semanticTarget, yearOnlyConstraints),
                fetchArxivQuota(querySets.arxiv,        researchConfig.arxivTarget,    yearOnlyConstraints),
            ]);
            openAlexSources = oaR2.status === 'fulfilled' ? oaR2.value : [];
            semanticSources = ssR2.status === 'fulfilled' ? ssR2.value : [];
            arxivSources    = axR2.status === 'fulfilled' ? axR2.value : [];
        }

        // ── 4c. User Seed Paper Anchoring + 1-Hop Citation Snowballing ──
        let userSeedSources = [];
        const rawSeedInputs = researchConfig.seedPapers || options.seedPapers || researchPlan?.seedPapers || [];
        if (Array.isArray(rawSeedInputs) && rawSeedInputs.length > 0) {
            await progress('searching_online', `Resolving ${rawSeedInputs.length} scholar-supplied seed paper(s) (DOI / arXiv / Title)...`, { badge: 'SEED ANCHOR' });
            userSeedSources = await semanticScholarService.resolveUserSeedPapers(rawSeedInputs);
        }

        let snowballSources = [];
        try {
            const candidateSeeds = [...userSeedSources, ...semanticSources, ...openAlexSources, ...multiAggSources]
                .filter(s => s.paperId || s.doi)
                .sort((a, b) => ((b.influentialCitationCount || 0) * 3 + (b.citationCount || 0)) - ((a.influentialCitationCount || 0) * 3 + (a.citationCount || 0)))
                .slice(0, 3);
            if (candidateSeeds.length > 0) {
                await progress('searching_online', `Snowballing backward & forward citations from ${candidateSeeds.length} seminal seed papers...`);
                snowballSources = await semanticScholarService.fetchSnowballCitations(candidateSeeds, {
                    maxSeeds: 3,
                    refsPerSeed: 4,
                    citesPerSeed: 4
                });
                log.info('RESEARCH', `Snowballed ${snowballSources.length} foundational/follow-up papers`);
            }
        } catch (snowErr) {
            log.warn('RESEARCH', `Snowballing skipped: ${snowErr.message}`);
        }

        const recentWebSources       = rawWebSources.filter(s => !s.goldStandard);
        const goldStandardWebSources = rawWebSources.filter(s => s.goldStandard);

        const rawCombined = [
            ...userSeedSources,
            ...reusableSources,
            ...localSources,
            ...openAlexSources,
            ...semanticSources,
            ...arxivSources,
            ...multiAggSources,
            ...snowballSources,
            ...recentWebSources,
            ...goldStandardWebSources,
        ];
        const totalIdentifiedCount = rawCombined.length;

        log.info('RESEARCH', `Fetched — OA:${openAlexSources.length} SS:${semanticSources.length} Ax:${arxivSources.length} MultiOA:${multiAggSources.length} Snowball:${snowballSources.length} Web:${recentWebSources.length}`);

        // ── 5. Merge & deduplicate ────────────────────────────────────────────
        await progress('analyzing', `Deduplicating ${totalIdentifiedCount} identified records across 8 scholarly indices...`);
        let allSources = researchIntelligenceService.dedupeSources(rawCombined);
        const afterDeduplicationCount = allSources.length;

        if (allSources.length === 0) {
            const msg = 'Research aborted: no sources retrieved from any provider.';
            log.warn('AI', msg);
            await progress('error', msg);
            throw new Error(msg);
        }

        // ── 6. Credibility scoring ────────────────────────────────────────────
        await progress('evaluating', 'Evaluating journal quartile, citation velocity & source credibility...', { sourceData: allSources });
        allSources.forEach((source, index) => {
            try {
                source.citationIndex = index + 1;
                const assessment = sourceCredibilityService.evaluateSourceCredibility(source, allSources);
                // Boost credibility for Open-Access PDFs and Snowballed seminal papers
                let bonus = 0;
                if (source.isOpenAccess || source.openAccessUrl || source.pdf_url) bonus += 4;
                if (source.snowballType === 'backward_reference') bonus += 5;
                source.credibilityScore  = Math.min(99, (assessment.credibilityScore || 70) + bonus);
                source.credibilityReason = assessment.reason;
            } catch (_) {
                source.credibilityScore = 65;
            }
        });

        // ── 7. Corpus evaluation + adaptive fallback ladder ───────────────────
        let retrievalMode = 'default';
        let fallbackStage = 0;
        let thresholds = researchIntelligenceService.getAdaptiveThresholds(0);

        let evaluatedSources = researchIntelligenceService.evaluateCorpus(allSources, {
            query, dimensions: researchPlan.research_dimensions || [], thresholds
        });
        let validSources    = evaluatedSources.filter(s => s.sourceValidation?.passesThreshold);
        let selectedSources = researchIntelligenceService.selectTopSourcesWithBalance(validSources, researchConfig);
        let sufficiency     = researchIntelligenceService.computeSufficiencyMetrics(selectedSources, researchConfig);

        log.info('RESEARCH', `Initial evidence: total=${sufficiency.total}/${researchConfig.target_source_count} academic=${sufficiency.academicTotal} empirical=${sufficiency.empiricalTotal}`);

        const counterQueries = (researchPlan.counter_evidence_queries || []).slice(0, 6);

        // FIXED: Dynamic domain-aware expansion queries built from researchPlan.keywordTaxonomy (NO hardcoded "LSTM transformer battery")
        const isAcademic = researchConfig.nature === 'academic' || researchConfig.nature === 'research';
        const kwList = (researchPlan.keywordTaxonomy?.primaryKeywords || []).slice(0, 4);
        const methodFocus = researchPlan.problemDeconstruction?.methodologicalFocus || 'methodology';
        const domainExpansionQueries = isAcademic
            ? [
                `${query} systematic review survey`,
                `${query} ${kwList.slice(0, 2).join(' ')} benchmark`.trim(),
                `${query} ${methodFocus.split(/[,;]/)[0] || 'analysis'}`.trim(),
                ...(researchPlan.expanded_search_queries || []).slice(0, 2),
              ].slice(0, 4)
            : [
                `${query} arxiv`,
                `${query} technical benchmark report`,
                `${query} empirical evaluation`,
                `${query} industry whitepaper`,
              ];

        const fallbackConstraintsL1 = {
            trustedPublishersOnly: true,
            ...(activeConstraints.yearStart
                ? { yearStart: activeConstraints.yearStart, yearEnd: activeConstraints.yearEnd }
                : {}),
        };
        const fallbackConstraintsL3 = {};

        while (researchConfig.allow_adaptive_fallback && selectedSources.length < researchConfig.target_source_count && !researchIntelligenceService.hasSufficientEvidence(sufficiency) && fallbackStage < 4) {
            fallbackStage++;
            if (fallbackStage === 1) {
                retrievalMode = 'adaptive';
                const recoveryQueries = researchIntelligenceService.buildRecoveryQueries(query, sufficiency);
                const secondPass = [...counterQueries, ...recoveryQueries].slice(0, 8);
                if (secondPass.length > 0) {
                    await progress('searching_online', 'Adaptive retrieval L1: expanding semantic & counter-evidence queries...');
                    const [r1, r2] = await Promise.allSettled([
                        academicSourceService.fetchOpenAlexBatch(secondPass, 4, fallbackConstraintsL1),
                        academicSourceService.fetchSemanticBatch(secondPass, 3, fallbackConstraintsL1),
                    ]);
                    const extra = [...(r1.status==='fulfilled'?r1.value:[]), ...(r2.status==='fulfilled'?r2.value:[])];
                    allSources = researchIntelligenceService.dedupeSources([...allSources, ...extra]);
                }
            }
            if (fallbackStage === 2) {
                retrievalMode = 'adaptive';
                await progress('searching_online', 'Adaptive retrieval L2: domain taxonomy & Open-Access aggregator expansion...');
                const [domOA, domAx, domMulti] = await Promise.allSettled([
                    academicSourceService.fetchOpenAlexBatch(domainExpansionQueries, 5, fallbackConstraintsL1),
                    academicSourceService.fetchArxivBatch(domainExpansionQueries, 4, fallbackConstraintsL1),
                    academicSourceService.fetchMultiAggregatorBatch(domainExpansionQueries.slice(0, 2), 5, fallbackConstraintsL1),
                ]);
                const domSources = [
                    ...(domOA.status==='fulfilled'?domOA.value:[]),
                    ...(domAx.status==='fulfilled'?domAx.value:[]),
                    ...(domMulti.status==='fulfilled'?domMulti.value:[]),
                ];
                allSources = researchIntelligenceService.dedupeSources([...allSources, ...domSources]);
            }
            if (fallbackStage === 3) {
                retrievalMode = 'fallback';
                thresholds = researchIntelligenceService.getAdaptiveThresholds(3);
                await progress('searching_online', 'Adaptive retrieval L3: broadening publication constraints...');
                const [r3oa, r3ss, r3ax] = await Promise.allSettled([
                    academicSourceService.fetchOpenAlexBatch(querySets.openalex.slice(0, 6), 6, fallbackConstraintsL3),
                    academicSourceService.fetchSemanticBatch(querySets.semantic.slice(0, 5), 5, fallbackConstraintsL3),
                    academicSourceService.fetchArxivBatch(querySets.arxiv.slice(0, 4), 5, fallbackConstraintsL3),
                ]);
                const l3Sources = [
                    ...(r3oa.status==='fulfilled'?r3oa.value:[]),
                    ...(r3ss.status==='fulfilled'?r3ss.value:[]),
                    ...(r3ax.status==='fulfilled'?r3ax.value:[]),
                ];
                allSources = researchIntelligenceService.dedupeSources([...allSources, ...l3Sources]);
            }
            if (fallbackStage >= 4) {
                retrievalMode = 'fallback';
                await progress('searching_online', 'Adaptive retrieval L4: proceeding with highest-ranked validated evidence.');
                break;
            }

            allSources.forEach((source, index) => {
                if (source.credibilityScore != null) return;
                source.citationIndex = index + 1;
                const assessment = sourceCredibilityService.evaluateSourceCredibility(source, allSources);
                source.credibilityScore  = assessment.credibilityScore;
                source.credibilityReason = assessment.reason;
            });
            evaluatedSources = researchIntelligenceService.evaluateCorpus(allSources, {
                query, dimensions: researchPlan.research_dimensions || [], thresholds
            });
            validSources    = evaluatedSources.filter(s => s.sourceValidation?.passesThreshold);
            selectedSources = researchIntelligenceService.selectTopSourcesWithBalance(validSources, researchConfig);
            if (thresholds.label === 'fallback_near_match') {
                selectedSources = selectedSources.map(s => ({ ...s, lowerConfidenceEvidence: true }));
            }
            sufficiency = researchIntelligenceService.computeSufficiencyMetrics(selectedSources, researchConfig);
        }

        if (selectedSources.length === 0 && validSources.length > 0) {
            selectedSources = validSources.slice(0, researchConfig.target_source_count);
            retrievalMode = 'fallback';
            sufficiency = researchIntelligenceService.computeSufficiencyMetrics(selectedSources, researchConfig);
        }
        if (selectedSources.length === 0 && allSources.length > 0) {
            const broadEval = researchIntelligenceService.evaluateCorpus(allSources, {
                query, dimensions: researchPlan.research_dimensions || [],
                thresholds: { relevance: 0.45, domainAlignment: 0.4, includeNearMatch: true }
            });
            selectedSources = broadEval
                .sort((a, b) => (b.source_score || 0) - (a.source_score || 0))
                .slice(0, researchConfig.target_source_count)
                .map(s => ({ ...s, lowerConfidenceEvidence: true }));
            retrievalMode = 'fallback';
            sufficiency = researchIntelligenceService.computeSufficiencyMetrics(selectedSources, researchConfig);
        }
        if (selectedSources.length === 0) {
            const msg = 'Research aborted: zero usable sources after adaptive fallback.';
            log.warn('AI', msg);
            await progress('error', msg);
            throw new Error(msg);
        }

        // ── 8. Citation Enrichment ────────────────────────────────────────────
        await progress('enriching', 'Enriching bibliographic metadata (Crossref / DOI / Venue)...', { sourceData: selectedSources });
        try {
            const enrichStart = Date.now();
            const enriched    = await citationEnrichmentService.enrichSources(selectedSources);
            perf.addTool(Date.now() - enrichStart);
            selectedSources.length = 0;
            selectedSources.push(...enriched);
        } catch (enrichErr) {
            log.warn('AI', `Citation enrichment partial: ${enrichErr.message}`);
        }

        selectedSources.sort((a, b) => (b.source_score || ((b.credibilityScore || 0) / 100)) - (a.source_score || ((a.credibilityScore || 0) / 100)));
        let topSources = selectedSources.slice(0, researchConfig.target_source_count);

        // ── 8.5. Phase 3: 2-Tier Full-Text PDF Harvester & Section Parser ─────
        let pdfHarvestStats = { harvestedCount: 0, pdfSavedCount: 0 };
        try {
            const maxFullText = researchConfig.depth === 'high' ? 18 : (researchConfig.depth === 'low' ? 10 : 14);
            await progress('evaluating', `Harvesting full-text PDFs (Open-Access + NIT-AP Institutional Net) for top ${Math.min(maxFullText, topSources.length)} papers...`, { sourceData: topSources });
            const harvestStart = Date.now();
            pdfHarvestStats = await institutionalPdfService.harvestAndEnrichFullTextCorpus(
                topSources,
                sessionFolderId,
                { maxFullTextPapers: maxFullText },
                (msg) => progress('evaluating', msg, { sourceData: topSources })
            );
            perf.addTool(Date.now() - harvestStart);
            topSources = citationEnrichmentService.assignCitationIndices(topSources);
            log.info('RESEARCH', `Full-text harvest complete: ${pdfHarvestStats.harvestedCount} full-text parsed, ${pdfHarvestStats.pdfSavedCount} PDFs saved`);

            // ── 8.6. Stage 8.6: Rust Multi-Threaded BM25/Metric Kernel + Post-Full-Text Entity Branching ──
            try {
                const parsedPapers = topSources.filter(s => s.hasFullText && s.fullTextSections);
                if (parsedPapers.length > 0) {
                    const rawBatch = parsedPapers.map(p =>
                        [p.title, p.fullTextSections?.methodology, p.fullTextSections?.datasets, p.fullTextSections?.results, p.fullTextSections?.limitations, p.content].filter(Boolean).join('\n')
                    );
                    const rustRes = await rustComputeClient.parseAndRankAcademicBatch(query, rawBatch);
                    let uniqueEntities = [];
                    if (rustRes && rustRes.ok) {
                        log.info('RUST_KERNEL', `Processed ${rustRes.paperCount} full-text papers in ${(rustRes.computeMicros / 1000).toFixed(2)} ms (0ms event-loop block)`);
                        parsedPapers.forEach((p, idx) => {
                            const rp = rustRes.papers?.[idx];
                            if (rp) {
                                p.rustBm25Score = rp.bm25Score;
                                if (Array.isArray(rp.metrics) && rp.metrics.length > 0 && (!p.fullTextSections.quantitativeMetrics || p.fullTextSections.quantitativeMetrics.length === 0)) {
                                    p.fullTextSections.quantitativeMetrics = rp.metrics;
                                }
                            }
                        });
                        uniqueEntities = (rustRes.topCorpusEntities || []).map(e => e.entity).filter(Boolean).slice(0, 2);
                    }
                    if (uniqueEntities.length === 0) {
                        const datasetPool = parsedPapers.map(p => (p.fullTextSections?.datasets || '') + ' ' + (p.fullTextSections?.methodology || '')).join(' ');
                        const entityMatches = datasetPool.match(/\b([A-Z][A-Za-z0-9-]{2,14}(?:\s+(?:dataset|benchmark|corpus|testbed|database|simulator|model|filter|network|algorithm)))\b/g) || [];
                        const stopEntities = new Set(['The dataset', 'This dataset', 'Our model', 'The proposed', 'Table 1', 'Figure 1', 'Section 2', 'Section 3']);
                        uniqueEntities = [...new Set(entityMatches.map(e => e.trim()).filter(e => !stopEntities.has(e) && e.length > 6))].slice(0, 2);
                    }

                    if (uniqueEntities.length > 0) {
                        const branchQuery = `${query} ${uniqueEntities.join(' ')}`.slice(0, 140);
                        await progress('evaluating', `Full-Text Entity Branching: discovered [${uniqueEntities.join(', ')}] inside PDFs — running targeted micro-search...`, {
                            sourceData: topSources,
                            badge: 'ENTITY BRANCH'
                        });
                        const branchResults = await semanticScholarService.searchPapers(branchQuery, 3, activeConstraints).catch(() => []);
                        const existingTitles = new Set(topSources.map(s => String(s.title || '').toLowerCase().trim()));
                        const novelBranchPapers = (branchResults || []).filter(p => p.title && !existingTitles.has(p.title.toLowerCase().trim())).slice(0, 2);
                        if (novelBranchPapers.length > 0) {
                            novelBranchPapers.forEach(np => {
                                np.credibilityScore = 90;
                                np.snowballType = 'fulltext_entity_branch';
                            });
                            topSources.push(...novelBranchPapers);
                            topSources = citationEnrichmentService.assignCitationIndices(topSources);
                            log.info('RESEARCH', `[EntityBranch] Added ${novelBranchPapers.length} benchmark/method papers discovered inside full-text PDFs`);
                        }
                    }
                }
            } catch (branchErr) {
                log.warn('RESEARCH', `Full-text entity branching skipped: ${branchErr.message}`);
            }
        } catch (harvestErr) {
            log.warn('RESEARCH', `Full-text PDF harvest non-fatal warning: ${harvestErr.message}`);
        }

        // ── 9. Citation graph + fact-check ────────────────────────────────────
        await progress('graphing', 'Constructing citation network & provenance graph...', { sourceData: topSources });
        const graphData = citationGraphService.buildGraph(topSources);

        await progress('verifying', 'Extracting causal mechanisms & verifying quantitative claims...', { sourceData: topSources });
        const verifyStart      = Date.now();
        const verificationData = await factCheckingService.verifyCorpusClaims(topSources, query, options.userId);
        perf.addLlm(Date.now() - verifyStart);

        const confidenceMetrics = researchIntelligenceService.computeConfidenceMetrics({
            sources: topSources, evidenceUnits: verificationData,
            sufficiencyMetrics: sufficiency, researchConfig, retrievalMode
        });

        // ── 10. Build provider breakdown & PRISMA stats ───────────────────────
        const providerBreakdown = {
            openAlex:        topSources.filter(s => s.sourceProvider === 'openalex').length,
            semanticScholar: topSources.filter(s => s.sourceProvider && s.sourceProvider.startsWith('semantic_scholar')).length,
            arxiv:           topSources.filter(s => s.sourceProvider === 'arxiv').length,
            europePmc:       topSources.filter(s => s.sourceProvider === 'europe_pmc').length,
            openReview:      topSources.filter(s => s.sourceProvider === 'openreview').length,
            googleScholar:   topSources.filter(s => s.sourceProvider === 'google_scholar').length,
            dblpCrossref:    topSources.filter(s => s.sourceProvider === 'dblp' || s.sourceProvider === 'crossref').length,
            web:             topSources.filter(s => s.sourceType !== 'academic' && s.sourceType !== 'local' && !s.goldStandard).length,
            goldStandard:    topSources.filter(s => s.goldStandard).length,
            local:           topSources.filter(s => s.sourceType === 'local').length,
        };

        const academicSources  = topSources.filter(s => s.sourceType === 'academic');
        const webSourcesFinal  = topSources.filter(s => s.sourceType !== 'academic' && s.sourceType !== 'local');
        const empiricalSources = topSources.filter(s => s.evidenceCategory === 'empirical' || s.sourceType === 'academic' || s.sourceRole?.datasetOrSurvey || s.sourceRole?.empiricalAcademic);
        const industrySources  = topSources.filter(s => s.sourceRole?.industryFinancial || s.sourceRole?.policyGovReport);
        const counterSources   = topSources.filter(s => s.sourceRole?.counterPosition);
        const fullTextSources  = topSources.filter(s => s.hasFullText);
        const localPdfSources  = topSources.filter(s => s.hasLocalPdf);
        const openAccessSources = topSources.filter(s => s.isOpenAccess);

        const prismaStats = {
            totalIdentified:      totalIdentifiedCount,
            snowballIdentified:   snowballSources.length,
            afterDeduplication:   afterDeduplicationCount,
            credibilityValidated: validSources.length,
            fullTextHarvested:    fullTextSources.length,
            localPdfsSaved:       localPdfSources.length,
            openAccessCount:      openAccessSources.length,
            includedInSynthesis:  topSources.length,
        };

        const evidenceProfile = {
            totalSourcesUsed:       topSources.length,
            empiricalSources:       empiricalSources.length,
            fullTextSources:        fullTextSources.length,
            localPdfSources:        localPdfSources.length,
            openAccessSources:      openAccessSources.length,
            industrySources:        industrySources.length,
            counterEvidenceSources: counterSources.length,
            retrievalMode:          retrievalMode === 'default' ? 'Default' : (retrievalMode === 'adaptive' ? 'Adaptive' : 'Fallback'),
            providerBreakdown,
            prismaStats,
            goldStandardCount:      providerBreakdown.goldStandard,
            nature:                 researchConfig.nature,
            depth:                  researchConfig.depth,
            appliedConstraints:     activeConstraints,
        };

        const researchResult = {
            _id: reportObjectId,
            reportId: sessionFolderId,
            query, userId: options.userId, normalizedQuery,
            mode: evidenceProfile.retrievalMode,
            sources: topSources,
            localSourceCount:  topSources.filter(s => s.sourceType === 'local').length,
            onlineSourceCount: academicSources.length + webSourcesFinal.length,
            overallConfidenceScore: confidenceMetrics.overallConfidenceScore,
            createdAt: new Date(),
            plan: researchPlan,
            citationGraphData:    graphData,
            verifiedClaimsData:   verificationData,
            evidenceSufficiency:  sufficiency,
            confidenceMetrics,
            researchConfig,
            evidenceProfile,
            providerBreakdown,
            prismaStats,
        };

        researchIntelligenceService.registerValidatedSources(query, topSources);

        // ── 11. Synthesis (Thematic Sections + Comparison Matrix + PhD Gaps) ──
        await progress('synthesizing', `Synthesizing ${researchConfig.targetPages?.[0]}–${researchConfig.targetPages?.[1]} page PhD Literature Review & Comparison Matrix (${fullTextSources.length} full-text papers parsed)...`);
        const synthesisStart = Date.now();
        const finalReport = await researchSynthesisService.generateResearchReport(
            { ...researchResult, plan: researchPlan },
            (token) => { if (onProgress) onProgress({ phase: 'token', token }); }
        );
        finalReport.reportId = sessionFolderId;
        perf.addLlm(Date.now() - synthesisStart);

        // ── 12. Save to ResearchCache with pre-allocated _id ──────────────────
        let savedDoc = null;
        try {
            const dbWriteStart = Date.now();
            const cachePayload = {
                _id: reportObjectId,
                ...researchResult,
                researchReport: finalReport,
                title: finalReport.title || query
            };
            savedDoc = await ResearchCache.create(cachePayload);
            perf.addDb(Date.now() - dbWriteStart);
            log.success('SYSTEM', `Research saved (id=${savedDoc._id}, ${topSources.length} sources, ${fullTextSources.length} full-text): "${query}"`);
        } catch (cacheError) {
            log.error('SYSTEM', `Failed to save research: ${cacheError.message}`);
        }

        const finalResponse = {
            researchBundle: researchResult,
            researchReport: finalReport,
            savedDocId: savedDoc?._id || reportObjectId
        };

        await progress('completed', 'PhD Literature Review Complete.', {
            fullReport: finalReport,
            metaData: {
                reportId: sessionFolderId,
                retrievalMode: researchResult.mode,
                totalSources:  researchResult.sources?.length || 0,
                academicSources: academicSources.length,
                fullTextSources: fullTextSources.length,
                localPdfSources: localPdfSources.length,
                webSources:      webSourcesFinal.length,
                confidenceScore: researchResult.overallConfidenceScore,
                confidenceExplanation: confidenceMetrics.explanation,
                evidenceProfile,
                providerBreakdown,
                prismaStats,
                nature: researchConfig.nature,
                depth:  researchConfig.depth,
            },
            sourceData: finalReport.sourcesUsed || researchResult.sources,
            graphData:  researchResult.citationGraphData,
        });

        const duration = Date.now() - startTime;
        const diagnostics = perf.toLogPayload({
            branchCount: 1,
            toolCalls:   (querySets.openalex.length + querySets.semantic.length + querySets.arxiv.length + querySets.web.length),
            tokenUsageEstimate: Math.ceil(String(finalReport?.fullReport || finalReport?.summary || '').length / 4),
        });
        logPerformance(diagnostics);
        log.success('AI', `Research complete: ${topSources.length} sources (${fullTextSources.length} full-text), ${duration}ms [${researchConfig.nature}/${researchConfig.depth}]`);

        return { ...finalResponse, performanceDiagnostics: diagnostics };
    }
};

module.exports = deepResearchOrchestrator;
