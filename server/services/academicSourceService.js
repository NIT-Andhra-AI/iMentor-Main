const log = require('../utils/logger');
const axios = require('axios');
const cheerio = require('cheerio');
const semanticScholarService = require('./semanticScholarService');
const openCliAcademicService = require('./openCliAcademicService');

const OPENALEX_API = 'https://api.openalex.org/works';
const ARXIV_API    = 'http://export.arxiv.org/api/query';

// ── Academic Query Multi-tier LRU Cache ──────────────────────────────────────
const _academicQueryCache = new Map();
const ACADEMIC_CACHE_MAX = 1000;
const ACADEMIC_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function _getCachedAcademicQuery(key) {
    const entry = _academicQueryCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > ACADEMIC_CACHE_TTL_MS) {
        _academicQueryCache.delete(key);
        return null;
    }
    return entry.data;
}

function _setCachedAcademicQuery(key, data) {
    if (_academicQueryCache.size >= ACADEMIC_CACHE_MAX) {
        const firstKey = _academicQueryCache.keys().next().value;
        _academicQueryCache.delete(firstKey);
    }
    _academicQueryCache.set(key, { data, timestamp: Date.now() });
}

// ── OpenAlex Token Bucket Rate Limiter (10 req/s polite pool) ────────────────
let _openAlexTokens = 10;
let _lastOpenAlexTokenRefill = Date.now();

async function _acquireOpenAlexRateLimitToken() {
    const now = Date.now();
    const elapsed = (now - _lastOpenAlexTokenRefill) / 1000;
    _openAlexTokens = Math.min(10, _openAlexTokens + elapsed * 10);
    _lastOpenAlexTokenRefill = now;

    if (_openAlexTokens < 1) {
        const waitMs = Math.ceil((1 - _openAlexTokens) * 100);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        return _acquireOpenAlexRateLimitToken();
    }
    _openAlexTokens -= 1;
}

// ── Expanded Trusted Academic Publishers for PhD Literature Reviews ─────────
const TRUSTED_PUBLISHERS = {
    openalex: [
        'ieee',
        'institute of electrical and electronics engineers',
        'elsevier',
        'springer',
        'springer nature',
        'sciencedirect',
        'science direct',
        'nature',
        'american chemical society',
        'acm',
        'association for computing machinery',
        'wiley',
        'john wiley',
        'taylor & francis',
        'informa',
        'oxford university press',
        'cambridge university press',
        'american physical society',
        'iop publishing',
        'mdpi',
        'frontiers',
        'plos',
        'public library of science',
        'royal society of chemistry',
        'asme',
        'asce',
        'siam',
        'aaai',
        'neurips',
        'icml',
        'iclr',
        'openreview',
        'jmlr',
        'acl',
        'mit press'
    ],
    arxivMinCitations: 5,
};

function applyPublisherGate(sources, strict = false) {
    const allowed = TRUSTED_PUBLISHERS.openalex;
    const minCit  = TRUSTED_PUBLISHERS.arxivMinCitations;
    const cutoffYear = new Date().getFullYear() - 2;

    return sources.filter(s => {
        const provider = (s.sourceProvider || '').toLowerCase();

        if (provider === 'arxiv') {
            if ((s.year || 0) >= cutoffYear) return true;
            return (s.citationCount || 0) >= minCit;
        }

        const publisherRaw = (s.publisher || s.journal || s.sourceProvider || '').toLowerCase();
        if (!publisherRaw || ['openalex', 'semantic_scholar', 'google_scholar', 'europepmc', 'openreview', 'dblp', 'crossref'].includes(publisherRaw)) {
            return true;
        }
        const matched = allowed.some(p => publisherRaw.includes(p));
        return matched || !strict || (s.citationCount || 0) >= 10 || Boolean(s.pdf_url || s.openAccessUrl);
    });
}

function threeMonthsAgo() {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d;
}

function parseDate(value) {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

const academicSourceService = {
    /**
     * Unified academic retrieval — OpenAlex + Semantic Scholar + ArXiv + Multi-Aggregator (Google Scholar, EuropePMC, OpenReview, DBLP).
     */
    async retrieveSources(query, options = { limit: 15 }) {
        const limit         = options.limit        || 15;
        const openAlexLimit = options.openAlexLimit || Math.ceil(limit * 0.45);
        const semanticLimit = options.semanticLimit || Math.ceil(limit * 0.30);
        const arxivLimit    = options.arxivLimit    || Math.ceil(limit * 0.20);

        log.info('RESEARCH', `Academic retrieval: "${query.slice(0,50)}" (OA:${openAlexLimit} SS:${semanticLimit} Ax:${arxivLimit})`);

        const [openAlexResult, semanticResult, arxivResult, multiAggResult] = await Promise.allSettled([
            this.fetchOpenAlex(query, openAlexLimit),
            semanticScholarService.retrieveSources(query, { limit: semanticLimit }),
            this.fetchArxiv(query, arxivLimit),
            openCliAcademicService.fetchMultiAggregatorBatch([query], Math.ceil(limit * 0.35))
        ]);

        const openAlexSources = openAlexResult.status === 'fulfilled' ? openAlexResult.value : [];
        const semanticSources = semanticResult.status === 'fulfilled' ? semanticResult.value : [];
        const arxivSources    = arxivResult.status    === 'fulfilled' ? arxivResult.value    : [];
        const multiSources    = multiAggResult.status === 'fulfilled' ? multiAggResult.value : [];

        const merged = this._mergeDedup([...openAlexSources, ...semanticSources, ...arxivSources, ...multiSources]);

        merged.sort((a, b) => {
            const oaA = (a.pdf_url || a.openAccessUrl) ? 1 : 0;
            const oaB = (b.pdf_url || b.openAccessUrl) ? 1 : 0;
            const scoreA = (a.citationCount || 0) + (a.influentialCitationCount || 0) * 3 + oaA * 15;
            const scoreB = (b.citationCount || 0) + (b.influentialCitationCount || 0) * 3 + oaB * 15;
            return scoreB - scoreA;
        });

        return merged.slice(0, limit);
    },

    /** Batch-fetch from OpenAlex across multiple queries. */
    async fetchMultiAggregatorBatch(queries = [], limitPerQuery = 6, constraints = {}) {
        try {
            return await openCliAcademicService.fetchMultiAggregatorAcademic(queries.slice(0, 3), limitPerQuery, constraints);
        } catch (_) {
            return [];
        }
    },

    async fetchOpenAlexBatch(queries = [], limitPerQuery = 10, constraints = {}) {
        const seen = new Set();
        const results = [];
        for (const q of queries) {
            const sources = await this.fetchOpenAlex(q, limitPerQuery, constraints);
            for (const s of sources) {
                const key = (s.doi || s.title || '').toLowerCase();
                if (key && !seen.has(key)) { seen.add(key); results.push(s); }
            }
        }
        return results;
    },

    /** Batch-fetch from Semantic Scholar (with optional Multi-Aggregator + Snowballing when not already invoked by orchestrator). */
    async fetchSemanticBatch(queries = [], limitPerQuery = 8, constraints = {}, options = {}) {
        const includeMultiAndSnowball = options.includeMultiAndSnowball === true;
        const tasks = [semanticScholarService.retrieveSourcesBulk(queries, limitPerQuery, constraints)];
        if (includeMultiAndSnowball) {
            tasks.push(openCliAcademicService.fetchMultiAggregatorBatch(queries, Math.max(12, limitPerQuery * 2), constraints));
        }
        const settled = await Promise.allSettled(tasks);
        const s2Papers    = settled[0]?.status === 'fulfilled' ? settled[0].value : [];
        const extraPapers = settled[1]?.status === 'fulfilled' ? settled[1].value : [];

        let snowballed = [];
        if (includeMultiAndSnowball) {
            try {
                snowballed = await semanticScholarService.fetchSnowballCitations([...s2Papers, ...extraPapers], 10);
            } catch (err) {
                log.debug('RESEARCH', `[Snowball] skipped: ${err.message}`);
            }
        }

        return this._mergeDedup([...s2Papers, ...extraPapers, ...snowballed]);
    },

    /** Batch-fetch from ArXiv across multiple queries. */
    async fetchArxivBatch(queries = [], limitPerQuery = 6, constraints = {}) {
        const seen = new Set();
        const results = [];
        for (const q of queries) {
            const sources = await this.fetchArxiv(q, limitPerQuery, constraints);
            for (const s of sources) {
                const key = (s.arxivId || s.title || '').toLowerCase();
                if (key && !seen.has(key)) { seen.add(key); results.push(s); }
            }
        }
        return results;
    },

    tagWebSources(webSources = []) {
        const cutoff = threeMonthsAgo();
        return webSources.map(s => {
            const pubDate = parseDate(s.publishedDate || s.datePublished || s.year?.toString());
            const isOld   = pubDate !== null && pubDate < cutoff;
            return {
                ...s,
                goldStandard: isOld,
                goldStandardReason: isOld
                    ? 'Authoritative source published > 3 months ago — included as historical reference'
                    : null,
                recentWebSource: !isOld,
            };
        });
    },

    /**
     * OpenAlex retrieval with full Open-Access location collation (best_oa_location, open_access, locations).
     */
    async fetchOpenAlex(query, limit, constraints = {}) {
        try {
            const cacheKey = `oa_v2_${query.trim().toLowerCase()}_${limit}_${JSON.stringify(constraints)}`;
            const cached = _getCachedAcademicQuery(cacheKey);
            if (cached) {
                return cached.slice(0, limit);
            }

            await _acquireOpenAlexRateLimitToken();

            const filterParts = [];
            if (constraints.yearStart && constraints.yearEnd) {
                if (constraints.yearStart === constraints.yearEnd) {
                    filterParts.push(`publication_year:${constraints.yearStart}`);
                } else {
                    filterParts.push(`from_publication_date:${constraints.yearStart}-01-01,to_publication_date:${constraints.yearEnd}-12-31`);
                }
            } else if (constraints.yearStart) {
                filterParts.push(`publication_year:>${constraints.yearStart - 1}`);
            }

            // Expanded trusted publisher org IDs in OpenAlex (IEEE, Elsevier, Springer, Nature, Wiley, ACM, T&F, Oxford, MDPI)
            const TRUSTED_ORG_IDS = [
                'https://openalex.org/P4310315706',  // IEEE
                'https://openalex.org/P4310319900',  // Elsevier (ScienceDirect)
                'https://openalex.org/P4310319965',  // Springer Nature
                'https://openalex.org/P4310315823',  // Nature Portfolio
                'https://openalex.org/P4310320595',  // Wiley
                'https://openalex.org/P4310319798',  // ACM
                'https://openalex.org/P4310320547',  // Taylor & Francis
                'https://openalex.org/P4310311648',  // Oxford University Press
                'https://openalex.org/P4310310987',  // MDPI
            ];

            if (constraints.venueFilter) {
                const VENUE_MAP = {
                    'IEEE':     'https://openalex.org/P4310315706',
                    'Elsevier': 'https://openalex.org/P4310319900',
                    'Springer': 'https://openalex.org/P4310319965',
                    'Nature':   'https://openalex.org/P4310315823',
                    'Wiley':    'https://openalex.org/P4310320595',
                    'ACM':      'https://openalex.org/P4310319798',
                };
                const orgId = VENUE_MAP[constraints.venueFilter];
                if (orgId) {
                    filterParts.push(`primary_location.source.host_organization:${orgId}`);
                }
            } else if (constraints.trustedPublishersOnly) {
                filterParts.push(`primary_location.source.host_organization:${TRUSTED_ORG_IDS.join('|')}`);
            }

            const fetchLimit = Math.min(Math.max(limit * 2, 20), 100);

            const params = {
                search:   query,
                per_page: fetchLimit,
                mailto:   'imentor@academic.search',
                sort:     'relevance_score:desc,cited_by_count:desc',
                select:   'id,title,abstract_inverted_index,authorships,publication_year,doi,cited_by_count,concepts,referenced_works,primary_location,open_access,best_oa_location,locations',
            };
            if (filterParts.length > 0) {
                params.filter = filterParts.join(',');
            }

            const response = await axios.get(OPENALEX_API, { params, timeout: 15000 });
            let works = response.data?.results || [];

            // If strict publisher filter yielded too few results, immediately run an unfiltered OpenAlex pass so OA repository papers are included!
            if (works.length < Math.min(limit, 5) && filterParts.some(f => f.includes('host_organization'))) {
                const relaxedFilter = filterParts.filter(f => !f.includes('host_organization')).join(',');
                const retryParams = { ...params };
                if (relaxedFilter) retryParams.filter = relaxedFilter;
                else delete retryParams.filter;
                const retryResp = await axios.get(OPENALEX_API, { params: retryParams, timeout: 12000 }).catch(() => null);
                if (retryResp?.data?.results) {
                    works = [...works, ...retryResp.data.results];
                }
            }

            let mapped = works.map(work => {
                const journal    = work.primary_location?.source?.display_name || work.best_oa_location?.source?.display_name || null;
                const publisher  = work.primary_location?.source?.host_organization_name || work.best_oa_location?.source?.host_organization_name || journal || null;
                const doiClean   = work.doi ? work.doi.replace('https://doi.org/', '') : null;

                // Collate all possible direct Open-Access PDF links across OpenAlex's repository index
                const oaPdfUrl =
                    work.best_oa_location?.pdf_url ||
                    work.primary_location?.pdf_url ||
                    (work.locations || []).find(l => l.pdf_url)?.pdf_url ||
                    (work.open_access?.oa_url && work.open_access.oa_url.endsWith('.pdf') ? work.open_access.oa_url : null) ||
                    null;

                const oaLandingUrl =
                    oaPdfUrl ||
                    work.open_access?.oa_url ||
                    work.best_oa_location?.landing_page_url ||
                    work.primary_location?.landing_page_url ||
                    (doiClean ? `https://doi.org/${doiClean}` : work.id);

                const abstractText = this.reconstructOpenAlexAbstract(work.abstract_inverted_index);

                return {
                    title:            work.title || 'Untitled',
                    content:          abstractText,
                    abstract:         abstractText,
                    authors:          (work.authorships || []).map(a => a.author?.display_name).filter(Boolean),
                    year:             work.publication_year || null,
                    doi:              doiClean,
                    url:              doiClean ? `https://doi.org/${doiClean}` : oaLandingUrl,
                    openAccessUrl:    oaPdfUrl || work.open_access?.oa_url || null,
                    pdf_url:          oaPdfUrl,
                    isOpenAccess:     Boolean(work.open_access?.is_oa || oaPdfUrl),
                    oaStatus:         work.open_access?.oa_status || (oaPdfUrl ? 'green' : 'closed'),
                    journal,
                    publisher,
                    citationCount:    work.cited_by_count || 0,
                    concepts:         (work.concepts || []).map(c => c.display_name),
                    referenced_works: work.referenced_works || [],
                    sourceType:       'academic',
                    sourceProvider:   'openalex',
                    credibilityBaseScore: 88,
                    credibilityScore: 88,
                };
            });

            if (constraints.trustedPublishersOnly) {
                mapped = applyPublisherGate(mapped, false);
            }

            const finalResults = this._mergeDedup(mapped).slice(0, limit);
            _setCachedAcademicQuery(cacheKey, finalResults);
            return finalResults;
        } catch (err) {
            log.warn('RESEARCH', `OpenAlex error: ${err.message}`);
            return [];
        }
    },

    async fetchArxiv(query, limit, constraints = {}) {
        try {
            const cleanTokens = query.trim().replace(/[^a-zA-Z0-9\s-]/g, ' ').split(/\s+/).filter(t => t.length > 2).slice(0, 6);
            const arxivQuery = cleanTokens.join('+AND+');
            let searchQuery = `all:${arxivQuery}`;
            if (constraints.yearStart) {
                const start = `${constraints.yearStart}01010000`;
                const end   = `${constraints.yearEnd || new Date().getFullYear()}12312359`;
                searchQuery += `+AND+submittedDate:[${start}+TO+${end}]`;
            }

            const response = await axios.get(ARXIV_API, {
                params: {
                    search_query: searchQuery,
                    start:        0,
                    max_results:  Math.min(limit * 2, 50),
                    sortBy:       'relevance',
                    sortOrder:    'descending',
                },
                timeout: 10000,
            });

            const $ = cheerio.load(response.data, { xmlMode: true });
            const arxivEntries = $('entry').toArray().map(entry => {
                const el       = $(entry);
                const title    = el.find('title').text().trim().replace(/\s+/g, ' ');
                const abstract = el.find('summary').text().trim().replace(/\s+/g, ' ');
                const pubRaw   = el.find('published').text();
                const year     = pubRaw ? new Date(pubRaw).getFullYear() : null;
                const idUrl    = el.find('id').text().trim();
                const arxivId  = (idUrl.split('/abs/')[1] || idUrl).replace(/v\d+$/, '');
                const pdfUrl   = `https://arxiv.org/pdf/${arxivId}.pdf`;

                let doi = null;
                el.find('link[title="doi"]').each((_, link) => { doi = $(link).attr('href'); });
                if (doi) doi = doi.replace(/https?:\/\/(dx\.)?doi\.org\//, '');

                const authors = [];
                el.find('author name').each((_, name) => { authors.push($(name).text()); });

                return {
                    title,
                    content:          abstract,
                    abstract,
                    authors,
                    year,
                    doi,
                    url:              idUrl,
                    openAccessUrl:    pdfUrl,
                    pdf_url:          pdfUrl,
                    isOpenAccess:     true,
                    arxivId,
                    journal:          'arXiv Preprint',
                    publisher:        'arXiv (Cornell University)',
                    publishedDate:    pubRaw ? new Date(pubRaw) : null,
                    citationCount:    5,
                    concepts:         [],
                    referenced_works: [],
                    sourceType:       'academic',
                    sourceProvider:   'arxiv',
                    credibilityBaseScore: 82,
                    credibilityScore: 82,
                };
            });

            return arxivEntries.slice(0, limit);
        } catch (err) {
            log.warn('RESEARCH', `ArXiv error: ${err.message}`);
            return [];
        }
    },

    reconstructOpenAlexAbstract(invertedIndex) {
        if (!invertedIndex) return '';
        const wordList = [];
        let maxLen = 0;
        for (const [word, positions] of Object.entries(invertedIndex)) {
            for (const pos of positions) {
                wordList[pos] = word;
                if (pos > maxLen) maxLen = pos;
            }
        }
        return Array.from({ length: maxLen + 1 }, (_, i) => wordList[i] || '').join(' ').trim();
    },

    _mergeDedup(sources = []) {
        const map = new Map();
        for (const s of sources) {
            const doiKey   = s.doi   ? `doi:${s.doi.toLowerCase().trim()}`                  : null;
            const titleKey = s.title ? `title:${s.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 75)}` : null;
            const key      = doiKey || titleKey;
            if (!key) { map.set(Math.random().toString(), s); continue; }
            if (!map.has(key)) {
                map.set(key, s);
            } else {
                const existing = map.get(key);
                const mergedObj = {
                    ...existing,
                    ...s,
                    abstract: (s.abstract || '').length > (existing.abstract || '').length ? s.abstract : existing.abstract,
                    content:  (s.content || '').length  > (existing.content || '').length  ? s.content  : existing.content,
                    pdf_url:  existing.pdf_url || s.pdf_url || existing.openAccessUrl || s.openAccessUrl || null,
                    openAccessUrl: existing.openAccessUrl || s.openAccessUrl || existing.pdf_url || s.pdf_url || null,
                    isOpenAccess: Boolean(existing.isOpenAccess || s.isOpenAccess || existing.pdf_url || s.pdf_url),
                    citationCount: Math.max(existing.citationCount || 0, s.citationCount || 0),
                    influentialCitationCount: Math.max(existing.influentialCitationCount || 0, s.influentialCitationCount || 0),
                    doi: existing.doi || s.doi || null,
                    year: existing.year || s.year || null,
                    journal: existing.journal || s.journal || null,
                    publisher: existing.publisher || s.publisher || null,
                };
                map.set(key, mergedObj);
            }
        }
        return Array.from(map.values());
    },

    async resolveDoi(doi) {
        if (!doi) return null;
        const cleanDoi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim();
        try {
            const resp = await axios.get(`https://api.openalex.org/works/https://doi.org/${encodeURIComponent(cleanDoi)}`, {
                params: { mailto: 'imentor@academic.search' },
                timeout: 8000
            });
            return resp.data || null;
        } catch (_) {
            return null;
        }
    }
};

module.exports = academicSourceService;
