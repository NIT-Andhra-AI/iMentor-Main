const log = require('../utils/logger');
const axios = require('axios');

/**
 * Semantic Scholar Academic Source & Citation Graph Service (Upgraded v2)
 *
 * Features:
 *  - Uses /graph/v1/paper/search/bulk (Boolean-capable, high-quota endpoint) + /paper/search fallback
 *  - Polite token-bucket rate limiter + 12h LRU cache to prevent HTTP 429 throttling
 *  - Extracts openAccessPdf.url, AI tldr, influentialCitationCount, externalIds
 *  - 1-Hop Forward & Backward Citation Snowballing (/citations and /references)
 */

const SEARCH_URL = 'https://api.semanticscholar.org/graph/v1/paper/search';
const BULK_URL   = 'https://api.semanticscholar.org/graph/v1/paper/search/bulk';
const PAPER_URL  = 'https://api.semanticscholar.org/graph/v1/paper';

const FIELDS = [
    'paperId', 'title', 'abstract', 'year', 'citationCount',
    'authors', 'externalIds', 'fieldsOfStudy', 'publicationDate',
    'openAccessPdf', 'referenceCount', 'influentialCitationCount',
    'journal', 'publicationVenue', 'tldr'
].join(',');

const BULK_FIELDS = [
    'paperId', 'title', 'abstract', 'year', 'citationCount',
    'authors', 'externalIds', 'fieldsOfStudy', 'publicationDate',
    'openAccessPdf', 'referenceCount', 'influentialCitationCount',
    'journal', 'publicationVenue'
].join(',');

// ── Polite Rate Limiter & LRU Cache ─────────────────────────────────────────
const _s2Cache = new Map();
const S2_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
let _lastS2CallTime = 0;

function _getCached(key) {
    const item = _s2Cache.get(key);
    if (!item) return null;
    if (Date.now() - item.ts > S2_CACHE_TTL_MS) {
        _s2Cache.delete(key);
        return null;
    }
    return item.data;
}

function _setCached(key, data) {
    if (_s2Cache.size > 1000) {
        const first = _s2Cache.keys().next().value;
        _s2Cache.delete(first);
    }
    _s2Cache.set(key, { data, ts: Date.now() });
}

async function _acquireS2RateLimit() {
    const minIntervalMs = process.env.SEMANTIC_SCHOLAR_API_KEY ? 150 : 950;
    const now = Date.now();
    const wait = Math.max(0, (_lastS2CallTime + minIntervalMs) - now);
    _lastS2CallTime = now + wait;
    if (wait > 0) {
        await new Promise(r => setTimeout(r, wait));
    }
}

function buildHeaders() {
    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'iMentor-PhD-Research-Assistant/2.5 (mailto:research@imentor.edu)'
    };
    if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
        headers['x-api-key'] = process.env.SEMANTIC_SCHOLAR_API_KEY;
    }
    return headers;
}

const semanticScholarService = {
    /**
     * Retrieve academic papers from Semantic Scholar using /paper/search/bulk first (much less rate-limited),
     * falling back to /paper/search if needed.
     */
    async retrieveSources(query, options = {}) {
        const limit = Math.min(options.limit || 12, 100);
        const cacheKey = `s2_${query.trim().toLowerCase()}_${limit}_${options.year || ''}`;
        const cached = _getCached(cacheKey);
        if (cached) return cached.slice(0, limit);

        // 1. Try /paper/search/bulk first (supports Boolean & higher rate ceiling)
        try {
            await _acquireS2RateLimit();
            const bulkParams = {
                query: query.trim(),
                fields: BULK_FIELDS,
                sort: 'citationCount:desc'
            };
            if (options.year) bulkParams.year = options.year;

            const bulkResp = await axios.get(BULK_URL, {
                params: bulkParams,
                headers: buildHeaders(),
                timeout: 12000
            });
            const bulkPapers = (bulkResp.data?.data || []).slice(0, limit);
            if (bulkPapers.length > 0) {
                const mapped = bulkPapers.map(p => this._mapPaper(p));
                _setCached(cacheKey, mapped);
                return mapped;
            }
        } catch (bulkErr) {
            if (bulkErr.response?.status !== 429) {
                log.debug('RESEARCH', `Semantic Scholar bulk fallback: ${bulkErr.message}`);
            }
        }

        // 2. Fallback to standard relevance /paper/search
        try {
            await _acquireS2RateLimit();
            const params = {
                query: query.trim(),
                limit,
                fields: FIELDS,
                offset: 0,
            };
            if (options.year) params.year = options.year;

            const response = await axios.get(SEARCH_URL, {
                params,
                headers: buildHeaders(),
                timeout: 12000,
            });

            const papers = (response.data?.data) || [];
            const mapped = papers.map(p => this._mapPaper(p));
            if (mapped.length > 0) _setCached(cacheKey, mapped);
            return mapped;
        } catch (err) {
            if (err.response?.status === 429) {
                log.warn('RESEARCH', `Semantic Scholar rate limit hit for: "${query.slice(0, 50)}"`);
            } else {
                log.warn('RESEARCH', `Semantic Scholar error: ${err.message}`);
            }
            return [];
        }
    },

    /**
     * Retrieve papers across multiple queries, deduplicating by DOI/title.
     */
    async retrieveSourcesBulk(queries = [], limitPerQuery = 10, constraints = {}) {
        const results = [];
        const seen = new Set();

        let yearParam;
        if (constraints.yearStart && constraints.yearEnd) {
            yearParam = `${constraints.yearStart}-${constraints.yearEnd}`;
        } else if (constraints.yearStart) {
            yearParam = `${constraints.yearStart}-`;
        }

        // Cap number of distinct S2 queries to avoid rate limiting while maximizing per-query depth
        const effectiveQueries = queries.slice(0, 6);
        const adjustedLimit = Math.max(limitPerQuery, Math.ceil((queries.length * limitPerQuery) / Math.max(1, effectiveQueries.length)));

        for (const q of effectiveQueries) {
            const papers = await this.retrieveSources(q, { limit: Math.min(adjustedLimit, 40), year: yearParam });
            for (const p of papers) {
                const key = (p.doi || p.url || p.title || '').toLowerCase();
                if (key && !seen.has(key)) {
                    seen.add(key);
                    results.push(p);
                }
            }
        }
        return results;
    },

    /**
     * 1-Hop Citation Snowballing (Backward Seminal References + Forward Recent Citations)
     * Given a list of discovered academic papers, selects the top seed papers that have a
     * Semantic Scholar paperId or DOI, and fetches their most influential cited references
     * and newest citing papers.
     */

    /**
     * Resolve user-provided seed papers (DOIs, arXiv IDs, URLs, or Paper Titles)
     * into structured academic records so they anchor 1-hop citation snowballing.
     */
    async resolveUserSeedPapers(seedInputs = []) {
        if (!Array.isArray(seedInputs) || seedInputs.length === 0) return [];
        const cleanedInputs = seedInputs
            .map(s => String(s || '').trim())
            .filter(s => s.length >= 4)
            .slice(0, 6);

        if (cleanedInputs.length === 0) return [];
        log.info('RESEARCH', `[SeedResolver] Resolving ${cleanedInputs.length} user-supplied seed paper(s)...`);

        const fields = 'paperId,title,abstract,year,authors,venue,publicationVenue,citationCount,influentialCitationCount,isOpenAccess,openAccessPdf,externalIds,url,tldr';
        const resolved = [];

        for (const rawInput of cleanedInputs) {
            try {
                let paper = null;
                const doiMatch = rawInput.match(/(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i);
                const arxivMatch = rawInput.match(/(?:arxiv:|arxiv\.org\/(?:abs|pdf)\/)?(\d{4}\.\d{4,5})/i);

                if (doiMatch) {
                    const id = 'DOI:' + doiMatch[1].replace(/\.$/, '');
                    const resp = await axios.get(`https://api.semanticscholar.org/graph/v1/paper/${encodeURIComponent(id)}`, {
                        params: { fields },
                        headers: this.getHeaders ? this.getHeaders() : { "User-Agent": "iMentor-PhD-Research/2.0 (mailto:research@nitandhra.ac.in)" },
                        timeout: 10000
                    }).catch(() => null);
                    if (resp?.data?.title) paper = resp.data;
                } else if (arxivMatch) {
                    const id = 'ARXIV:' + arxivMatch[1];
                    const resp = await axios.get(`https://api.semanticscholar.org/graph/v1/paper/${encodeURIComponent(id)}`, {
                        params: { fields },
                        headers: this.getHeaders ? this.getHeaders() : { "User-Agent": "iMentor-PhD-Research/2.0 (mailto:research@nitandhra.ac.in)" },
                        timeout: 10000
                    }).catch(() => null);
                    if (resp?.data?.title) paper = resp.data;
                }

                if (!paper) {
                    const searchResp = await axios.get(`https://api.semanticscholar.org/graph/v1/paper/search`, {
                        params: { query: rawInput.slice(0, 160), limit: 1, fields },
                        headers: this.getHeaders ? this.getHeaders() : { "User-Agent": "iMentor-PhD-Research/2.0 (mailto:research@nitandhra.ac.in)" },
                        timeout: 10000
                    }).catch(() => null);
                    if (searchResp?.data?.data?.[0]) {
                        paper = searchResp.data.data[0];
                    }
                }

                if (paper && paper.title) {
                    const norm = (this.normalizePaper ? this.normalizePaper(paper) : { paperId: paper.paperId, title: paper.title, abstract: paper.abstract || paper.tldr?.text || "", authors: (paper.authors || []).map(a => a.name), year: paper.year, journal: paper.venue || paper.publicationVenue?.name || "Academic Venue", citationCount: paper.citationCount || 0, influentialCitationCount: paper.influentialCitationCount || 0, isOpenAccess: Boolean(paper.isOpenAccess || paper.openAccessPdf?.url), openAccessUrl: paper.openAccessPdf?.url || null, pdf_url: paper.openAccessPdf?.url || null, doi: paper.externalIds?.DOI || null, url: paper.url || null, tldr: paper.tldr?.text || null, sourceType: "academic", evidenceCategory: "empirical" });
                    norm.isUserSeed = true;
                    norm.credibilityScore = 99;
                    norm.source = 'user_seed_paper';
                    resolved.push(norm);
                } else {
                    // Fallback synthetic seed record so query expansion and snowballing still use it
                    resolved.push({
                        title: rawInput,
                        abstract: `User-supplied anchor seed reference: ${rawInput}`,
                        authors: ['User Seed Reference'],
                        year: new Date().getFullYear(),
                        journal: 'Seed Paper Anchor',
                        doi: doiMatch ? doiMatch[1] : null,
                        url: doiMatch ? `https://doi.org/${doiMatch[1]}` : (arxivMatch ? `https://arxiv.org/abs/${arxivMatch[1]}` : null),
                        pdf_url: arxivMatch ? `https://arxiv.org/pdf/${arxivMatch[1]}.pdf` : null,
                        openAccessUrl: arxivMatch ? `https://arxiv.org/pdf/${arxivMatch[1]}.pdf` : null,
                        isOpenAccess: Boolean(arxivMatch),
                        isUserSeed: true,
                        credibilityScore: 99,
                        sourceType: 'academic',
                        evidenceCategory: 'empirical',
                        source: 'user_seed_paper'
                    });
                }
            } catch (err) {
                log.warn('RESEARCH', `[SeedResolver] Could not resolve seed "${rawInput}": ${err.message}`);
            }
        }

        log.info('RESEARCH', `[SeedResolver] Resolved ${resolved.length} seed paper(s) for citation anchoring.`);
        return resolved;
    },

    async fetchSnowballCitations(seedSources = [], maxSnowball = 12) {
        if (typeof maxSnowball !== "number") maxSnowball = 12;
        const seeds = seedSources
            .filter(s => s.semanticScholarId || s.doi || s.arxivId)
            .sort((a, b) => ((b.influentialCitationCount || 0) * 3 + (b.citationCount || 0)) - ((a.influentialCitationCount || 0) * 3 + (a.citationCount || 0)))
            .slice(0, 3);

        if (seeds.length === 0) return [];

        const snowballed = [];
        const seen = new Set(seedSources.map(s => (s.doi || s.title || '').toLowerCase()));

        for (const seed of seeds) {
            const pid = seed.semanticScholarId || (seed.doi ? `DOI:${seed.doi}` : `ARXIV:${(seed.arxivId || '').split('v')[0]}`);
            if (!pid) continue;

            try {
                await _acquireS2RateLimit();
                const refUrl = `${PAPER_URL}/${encodeURIComponent(pid)}/references`;
                const refResp = await axios.get(refUrl, {
                    params: {
                        fields: 'paperId,title,abstract,year,citationCount,influentialCitationCount,authors,externalIds,openAccessPdf,journal,publicationVenue, isInfluential',
                        limit: 15
                    },
                    headers: buildHeaders(),
                    timeout: 8000
                }).catch(() => null);

                const refItems = (refResp?.data?.data || [])
                    .map(r => r.citedPaper)
                    .filter(p => p && p.title && (p.abstract || p.citationCount >= 20))
                    .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
                    .slice(0, 3);

                for (const p of refItems) {
                    const mapped = this._mapPaper(p);
                    mapped.snowballType = 'seminal_reference';
                    mapped.snowballParent = seed.title;
                    const key = (mapped.doi || mapped.title || '').toLowerCase();
                    if (key && !seen.has(key)) {
                        seen.add(key);
                        snowballed.push(mapped);
                    }
                }

                await _acquireS2RateLimit();
                const citUrl = `${PAPER_URL}/${encodeURIComponent(pid)}/citations`;
                const citResp = await axios.get(citUrl, {
                    params: {
                        fields: 'paperId,title,abstract,year,citationCount,influentialCitationCount,authors,externalIds,openAccessPdf,journal,publicationVenue',
                        limit: 15
                    },
                    headers: buildHeaders(),
                    timeout: 8000
                }).catch(() => null);

                const citItems = (citResp?.data?.data || [])
                    .map(c => c.citingPaper)
                    .filter(p => p && p.title && p.abstract)
                    .sort((a, b) => ((b.year || 0) - (a.year || 0)) || ((b.citationCount || 0) - (a.citationCount || 0)))
                    .slice(0, 3);

                for (const p of citItems) {
                    const mapped = this._mapPaper(p);
                    mapped.snowballType = 'forward_citation';
                    mapped.snowballParent = seed.title;
                    const key = (mapped.doi || mapped.title || '').toLowerCase();
                    if (key && !seen.has(key)) {
                        seen.add(key);
                        snowballed.push(mapped);
                    }
                }
            } catch (e) {
                log.debug('RESEARCH', `[Snowball] Skipped ${pid}: ${e.message}`);
            }

            if (snowballed.length >= maxSnowball) break;
        }

        if (snowballed.length > 0) {
            log.info('RESEARCH', `[Citation Snowballing] Discovered ${snowballed.length} seminal/forward-citing papers from top seeds`);
        }
        return snowballed.slice(0, maxSnowball);
    },

    _mapPaper(p) {
        const doi = p.externalIds?.DOI || null;
        const arxivId = p.externalIds?.ArXiv || null;

        let url = null;
        if (doi) url = `https://doi.org/${doi}`;
        else if (arxivId) url = `https://arxiv.org/abs/${arxivId}`;
        else if (p.paperId) url = `https://www.semanticscholar.org/paper/${p.paperId}`;

        const openAccessUrl = p.openAccessPdf?.url || (arxivId ? `https://arxiv.org/pdf/${arxivId}.pdf` : null);

        let year = p.year || null;
        if (!year && p.publicationDate) {
            const parsed = new Date(p.publicationDate).getFullYear();
            if (!Number.isNaN(parsed) && parsed > 1900) year = parsed;
        }

        const citationCount = p.citationCount || 0;
        const influentialCount = p.influentialCitationCount || 0;
        const credScore = Math.min(96, 80 + Math.log1p(citationCount) * 1.6 + influentialCount * 0.35);

        const journal   = p.journal?.name || p.publicationVenue?.name || null;
        const publisher = p.publicationVenue?.publisher || journal || null;
        const tldrText  = p.tldr?.text || '';
        const abstractText = p.abstract || tldrText || '';

        return {
            title: p.title || 'Untitled',
            abstract: abstractText,
            content: tldrText && p.abstract ? `${p.abstract}

[Semantic Scholar AI TLDR]: ${tldrText}` : abstractText,
            tldr: tldrText || null,
            authors: (p.authors || []).map(a => a.name).filter(Boolean),
            year,
            doi,
            url,
            openAccessUrl,
            pdf_url: openAccessUrl,
            isOpenAccess: Boolean(openAccessUrl),
            journal,
            publisher,
            semanticScholarId: p.paperId || null,
            arxivId,
            citationCount,
            influentialCitationCount: influentialCount,
            referenceCount: p.referenceCount || 0,
            concepts: p.fieldsOfStudy || [],
            referenced_works: [],
            sourceType: 'academic',
            sourceProvider: 'semantic_scholar',
            credibilityScore: Math.round(credScore),
            credibilityBaseScore: Math.round(credScore),
        };
    }
};

module.exports = semanticScholarService;
