const log = require('../utils/logger');
const axios = require('axios');

/**
 * Citation Enrichment Service (PhD Literature Review Edition)
 * Enriches research source metadata and builds full-text-aware context blocks for LLM synthesis.
 */

function similarityScore(a, b) {
    if (!a || !b) return 0;
    const s1 = a.toLowerCase().trim();
    const s2 = b.toLowerCase().trim();
    if (s1 === s2) return 1.0;

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    if (longer.includes(shorter) || shorter.includes(longer)) {
        return shorter.length / longer.length;
    }

    const words1 = new Set(s1.split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(s2.split(/\s+/).filter(w => w.length > 2));
    if (words1.size === 0 || words2.size === 0) return 0;

    let overlap = 0;
    for (const w of words1) {
        if (words2.has(w)) overlap++;
    }
    return overlap / Math.max(words1.size, words2.size);
}

const SIMILARITY_THRESHOLD = 0.75;

const citationEnrichmentService = {

    /**
     * Enrich an array of sources with metadata from academic APIs.
     */
    async enrichSources(sources) {
        if (!sources || sources.length === 0) return [];

        const enrichedSources = [];
        const BATCH_SIZE = 6;
        for (let i = 0; i < sources.length; i += BATCH_SIZE) {
            const batch = sources.slice(i, i + BATCH_SIZE);
            const enrichedBatch = await Promise.all(
                batch.map(source => this.enrichSingleSource(source))
            );
            enrichedSources.push(...enrichedBatch);

            if (i + BATCH_SIZE < sources.length) {
                await new Promise(r => setTimeout(r, 200));
            }
        }

        return this.assignCitationIndices(enrichedSources);
    },

    /**
     * Enrich a single source object while preserving all full-text and OA fields.
     */
    async enrichSingleSource(source) {
        const enriched = {
            ...source,
            title: source.title || 'Untitled Source',
            authors: Array.isArray(source.authors) ? source.authors : (source.authors ? [String(source.authors)] : []),
            year: source.publishedYear || source.year || this.extractYearFromDate(source.publishedDate),
            publisher: source.publisher || source.journal || source.venue || null,
            journal: source.journal || source.venue || source.publisher || null,
            doi: source.doi || null,
            url: source.url || (source.metadata?.url) || null,
            openAccessUrl: source.openAccessUrl || source.pdf_url || null,
            pdf_url: source.pdf_url || source.openAccessUrl || null,
            isOpenAccess: Boolean(source.isOpenAccess || source.openAccessUrl || source.pdf_url),
            hasFullText: Boolean(source.hasFullText),
            hasLocalPdf: Boolean(source.hasLocalPdf),
            localPdfPath: source.localPdfPath || null,
            localPdfFilename: source.localPdfFilename || null,
            pdfHarvestMethod: source.pdfHarvestMethod || null,
            fullTextSections: source.fullTextSections || null,
            snowballType: source.snowballType || null,
            sourceType: source.sourceType || 'web',
            enrichmentAttempted: false,
            enrichmentSource: source.enrichmentSource || null
        };

        const needsEnrichment =
            enriched.authors.length === 0 ||
            !enriched.year ||
            !enriched.publisher;

        if (!needsEnrichment) {
            enriched.enrichmentAttempted = true;
            enriched.enrichmentSource = enriched.enrichmentSource || 'original';
            return enriched;
        }

        try {
            const crossrefResult = await this.queryCrossref(enriched.title);
            if (crossrefResult) {
                this.mergeMetadata(enriched, crossrefResult, 'crossref');
                return enriched;
            }
        } catch (_) {}

        this.inferFromUrl(enriched);

        enriched.enrichmentAttempted = true;
        enriched.enrichmentSource = enriched.enrichmentSource || 'none';
        return enriched;
    },

    /**
     * Query Crossref API for metadata by title.
     */
    async queryCrossref(title) {
        if (!title || title.length < 10) return null;

        const searchTitle = title.substring(0, 200);
        const url = `https://api.crossref.org/works?query.title=${encodeURIComponent(searchTitle)}&rows=3&select=title,author,published-print,published-online,container-title,DOI,publisher,type`;

        const response = await axios.get(url, {
            timeout: 4500,
            headers: {
                'User-Agent': 'iMentor-DeepResearch/2.0 (mailto:research@nitandhra.ac.in)'
            }
        });

        const items = response.data?.message?.items || [];
        if (items.length === 0) return null;

        for (const item of items) {
            const itemTitle = Array.isArray(item.title) ? item.title[0] : item.title;
            const score = similarityScore(title, itemTitle);

            if (score >= SIMILARITY_THRESHOLD) {
                const published = item['published-print'] || item['published-online'];
                const year = published?.['date-parts']?.[0]?.[0];

                return {
                    title: itemTitle || title,
                    authors: (item.author || []).map(a => {
                        if (a.given && a.family) return `${a.given} ${a.family}`;
                        if (a.family) return a.family;
                        if (a.name) return a.name;
                        return null;
                    }).filter(Boolean),
                    year: year || null,
                    publisher: item.publisher || null,
                    journal: Array.isArray(item['container-title']) ? item['container-title'][0] : item['container-title'],
                    doi: item.DOI || null,
                    matchScore: score
                };
            }
        }

        return null;
    },

    mergeMetadata(source, enrichment, provider) {
        if (source.authors.length === 0 && enrichment.authors?.length > 0) {
            source.authors = enrichment.authors;
        }
        if (!source.year && enrichment.year) {
            source.year = enrichment.year;
            source.publishedYear = enrichment.year;
        }
        if (!source.publisher && (enrichment.journal || enrichment.publisher)) {
            source.publisher = enrichment.journal || enrichment.publisher;
        }
        if (!source.journal && (enrichment.journal || enrichment.publisher)) {
            source.journal = enrichment.journal || enrichment.publisher;
        }
        if (!source.doi && enrichment.doi) {
            source.doi = enrichment.doi;
        }

        source.enrichmentAttempted = true;
        source.enrichmentSource = provider;
    },

    inferFromUrl(source) {
        if (!source.url) return;

        try {
            const hostname = new URL(source.url).hostname.replace('www.', '');

            if (!source.publisher) {
                const publisherMap = {
                    'arxiv.org': 'arXiv Preprint',
                    'openreview.net': 'OpenReview (ICLR/NeurIPS)',
                    'nature.com': 'Nature Portfolio',
                    'science.org': 'Science (AAAS)',
                    'ieee.org': 'IEEE Xplore',
                    'acm.org': 'ACM Digital Library',
                    'springer.com': 'SpringerLink',
                    'sciencedirect.com': 'Elsevier ScienceDirect',
                    'wiley.com': 'Wiley Online Library',
                    'tandfonline.com': 'Taylor & Francis',
                    'ncbi.nlm.nih.gov': 'PubMed Central',
                    'europepmc.org': 'Europe PMC',
                    'scholar.google.com': 'Google Scholar',
                    'mdpi.com': 'MDPI',
                    'frontiersin.org': 'Frontiers',
                    'plos.org': 'PLOS',
                    'biorxiv.org': 'bioRxiv',
                    'medrxiv.org': 'medRxiv'
                };

                for (const [domain, pub] of Object.entries(publisherMap)) {
                    if (hostname.includes(domain)) {
                        source.publisher = pub;
                        break;
                    }
                }

                if (!source.publisher) {
                    source.publisher = hostname;
                }
            }

            if (!source.doi) {
                const doiMatch = source.url.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
                if (doiMatch) {
                    source.doi = doiMatch[0];
                }
            }

            if (!source.doi && hostname.includes('arxiv.org')) {
                const arxivMatch = source.url.match(/(\d{4}\.\d{4,5})/);
                if (arxivMatch) {
                    source.doi = `arXiv:${arxivMatch[1]}`;
                }
            }
        } catch (e) {
            log.warn('CITATION', `Could not infer citation metadata from URL: ${e.message}`);
        }
    },

    extractYearFromDate(dateInput) {
        if (!dateInput) return null;
        try {
            const d = new Date(dateInput);
            const year = d.getFullYear();
            return (year > 1900 && year <= new Date().getFullYear() + 1) ? year : null;
        } catch {
            return null;
        }
    },

    /**
     * Assign deterministic citation indices [1], [2], [3]...
     * Prioritizes Academic -> Full-Text Parsed -> Open-Access -> Credibility Score.
     */
    assignCitationIndices(sources) {
        const sorted = [...sources].sort((a, b) => {
            const typeOrder = { academic: 0, local: 1, web: 2 };
            const typeA = typeOrder[a.sourceType] ?? 2;
            const typeB = typeOrder[b.sourceType] ?? 2;
            if (typeA !== typeB) return typeA - typeB;

            const ftA = a.hasFullText ? 1 : 0;
            const ftB = b.hasFullText ? 1 : 0;
            if (ftA !== ftB) return ftB - ftA;

            return (b.credibilityScore || 0) - (a.credibilityScore || 0);
        });

        return sorted.map((source, index) => ({
            ...source,
            citationIndex: index + 1
        }));
    },

    calculateMetadataCompleteness(sources) {
        if (!sources || sources.length === 0) return 0;

        let totalFields = 0;
        let filledFields = 0;
        const requiredFields = ['title', 'authors', 'year', 'publisher', 'url'];

        for (const source of sources) {
            for (const field of requiredFields) {
                totalFields++;
                if (field === 'authors') {
                    if (source.authors && source.authors.length > 0) filledFields++;
                } else if (source[field]) {
                    filledFields++;
                }
            }
        }

        return Math.round((filledFields / totalFields) * 100);
    },

    /**
     * Build a structured citation map string for LLM consumption.
     */
    buildCitationMapForLLM(enrichedSources) {
        return enrichedSources.map(s => {
            const authors = s.authors?.length > 0
                ? (s.authors.length > 3 ? `${s.authors[0]} et al.` : s.authors.join(', '))
                : 'Unknown';
            const year = s.year || s.publishedYear || 'n.d.';
            const publisher = s.journal || s.publisher || s.sourceType || 'Academic';
            const ftTag = s.hasFullText ? '[FULL-TEXT PDF PARSED]' : (s.isOpenAccess ? '[OA METADATA+ABSTRACT]' : '[INDEXED ABSTRACT]');
            const cites = s.citationCount ? ` | Citations: ${s.citationCount}` : '';

            return `[${s.citationIndex}] ${authors} (${year}). "${s.title}". ${publisher}. ${ftTag}${cites} | Credibility: ${s.credibilityScore || 80}/100.`;
        }).join('\n');
    },

    /**
     * Build a structured full-text-aware source context block for LLM consumption.
     * Expands per-source evidence window to 3,200 chars so full-text Methodology, Datasets,
     * Quantitative Results, and Limitations are visible during synthesis.
     */
    buildSourceContextForLLM(enrichedSources) {
        if (!Array.isArray(enrichedSources) || enrichedSources.length === 0) return '';

        // Dynamically size evidence corpus to fit SGLang modelMaxContext (e.g. 24,576 tokens)
        // with zero overflow and 100% RadixAttention staticPrefix stability across all synthesis stages.
        let modelMaxContext = 24576;
        try {
            const sglangCaps = require('./sglangCapabilities');
            modelMaxContext = sglangCaps.getModelMaxContext(24576);
        } catch (_) {}

        // Reserve ~8,400 tokens for: SHARED_RADIX_SYSTEM_PROMPT + citationMap (~2,200) +
        // section/matrix task instructions (~2,200) + reasoning/prose completion (~3,400) + BPE margin (~600).
        const availableSourceTokens = Math.max(4500, modelMaxContext - 8400);
        // Dense academic text (DOIs, inline citations, equations) averages ~2.75 chars/token on Qwen BPE.
        const maxTotalChars = Math.floor(availableSourceTokens * 2.75);

        const weights = enrichedSources.map(s => (s.hasFullText ? 1.45 : 0.85));
        const totalWeight = weights.reduce((a, b) => a + b, 0) || enrichedSources.length;
        const estimatedHeaderCharsPerSource = 290;
        const netContentPool = Math.max(
            enrichedSources.length * 260,
            maxTotalChars - (enrichedSources.length * estimatedHeaderCharsPerSource)
        );

        let usedChars = 0;
        const blocks = [];

        for (let i = 0; i < enrichedSources.length; i++) {
            const s = enrichedSources[i];
            const authors = s.authors?.length > 0
                ? (s.authors.length > 4 ? `${s.authors.slice(0, 3).join(', ')} et al.` : s.authors.join(', '))
                : 'Unknown';
            const year = s.year || s.publishedYear || 'n.d.';
            const venue = s.journal || s.publisher || s.venue || 'N/A';
            const ftStatus = s.hasFullText
                ? `FULL-TEXT PARSED (${s.pdfHarvestMethod || 'PDF'}) — Methodology, Setup, Metrics & Limitations extracted`
                : 'Abstract + Bibliographic Metadata';

            const weightedBudget = Math.floor((weights[i] / totalWeight) * netContentPool);
            const perSourceCap = Math.max(260, Math.min(3200, weightedBudget));
            const remainingSources = enrichedSources.length - i - 1;
            const remainingHardAllowance = Math.max(
                240,
                maxTotalChars - usedChars - estimatedHeaderCharsPerSource - (remainingSources * 420)
            );
            const sliceLimit = Math.min(perSourceCap, remainingHardAllowance);

            const rawContent = s.content || s.abstract || 'No content available.';
            const contentSlice = rawContent.substring(0, sliceLimit);

            const block = `=== SOURCE [${s.citationIndex}] ===
Title: ${s.title}
Authors: ${authors} | Year: ${year} | Venue: ${venue} | DOI: ${s.doi || 'N/A'}
Evidence Depth: ${ftStatus} | Credibility: ${s.credibilityScore || 80}/100${s.citationCount ? ` | Citations: ${s.citationCount}` : ''}
Content & Extracted Sections:
${contentSlice}
===`;
            usedChars += block.length + 2;
            blocks.push(block);
        }

        return blocks.join('\n\n');
    }
};

module.exports = citationEnrichmentService;
