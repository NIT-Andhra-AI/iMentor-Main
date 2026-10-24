const log = require('../utils/logger');
const axios = require('axios');
const cheerio = require('cheerio');
const { execFile } = require('child_process');

/**
 * Open-Access & Scholarly Aggregator Service (opencli + Direct Academic APIs)
 *
 * Collates scholarly literature across:
 *  1. Google Scholar (scholar.google.com HTTP + opencli google-scholar fallback)
 *  2. EuropePMC Open-Access Repository (43M+ records, direct OA PDF & full-text XML links)
 *  3. OpenReview (Peer-reviewed ML/AI/Data Science papers + direct PDF links)
 *  4. DBLP Computer Science & Engineering Bibliography (opencli dblp / API)
 *  5. Crossref Works API (Publisher license & full-text links)
 */

const OPENCLI_BIN = '/home/sri/.nvm/versions/node/v22.18.0/bin/opencli';
const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9'
};

function runOpenCliJson(args = [], timeoutMs = 12000) {
    return new Promise((resolve) => {
        execFile(
            OPENCLI_BIN,
            [...args, '-f', 'json'],
            {
                timeout: timeoutMs,
                maxBuffer: 8 * 1024 * 1024,
                env: {
                    ...process.env,
                    PATH: `/home/sri/.nvm/versions/node/v22.18.0/bin:${process.env.PATH || ''}`
                }
            },
            (err, stdout) => {
                if (err || !stdout) return resolve([]);
                try {
                    const start = stdout.indexOf('[');
                    const end = stdout.lastIndexOf(']');
                    if (start !== -1 && end !== -1 && end > start) {
                        return resolve(JSON.parse(stdout.slice(start, end + 1)));
                    }
                    return resolve([]);
                } catch (_) {
                    return resolve([]);
                }
            }
        );
    });
}

const openCliAcademicService = {
    /**
     * 1. EuropePMC Open-Access Corpus (43M+ papers, high-speed direct PDF links)
     */
    async searchEuropePMC(query, limit = 10, constraints = {}) {
        try {
            let q = query.trim();
            if (constraints.yearStart && constraints.yearEnd) {
                q += ` AND (PUB_YEAR:[${constraints.yearStart} TO ${constraints.yearEnd}])`;
            } else if (constraints.yearStart) {
                q += ` AND (PUB_YEAR:[${constraints.yearStart} TO 2030])`;
            }

            const resp = await axios.get('https://www.ebi.ac.uk/europepmc/webservices/rest/search', {
                params: {
                    query: q,
                    resultType: 'core',
                    pageSize: Math.min(limit, 25),
                    format: 'json'
                },
                headers: { 'User-Agent': 'iMentor-PhD-Research/2.5' },
                timeout: 10000
            });

            const list = resp.data?.resultList?.result || [];
            return list.map(item => {
                const fullTextUrls = item.fullTextUrlList?.fullTextUrl || [];
                const pdfEntry = fullTextUrls.find(u => (u.documentStyle || '').toLowerCase() === 'pdf' && u.url);
                const htmlEntry = fullTextUrls.find(u => u.url);
                const doi = item.doi || null;
                const pmid = item.pmid || null;
                const pmcid = item.pmcid || null;
                const pdfUrl = pdfEntry?.url || (pmcid ? `https://europepmc.org/backend/ptpmcrender.fcgi?accid=${pmcid}&blobtype=pdf` : null);

                return {
                    title: item.title ? item.title.replace(/<[^>]+>/g, '') : 'Untitled',
                    abstract: item.abstractText ? item.abstractText.replace(/<[^>]+>/g, '') : '',
                    content: item.abstractText ? item.abstractText.replace(/<[^>]+>/g, '') : '',
                    authors: item.authorString ? item.authorString.split(',').map(s => s.trim()).filter(Boolean) : [],
                    year: item.pubYear ? parseInt(item.pubYear, 10) : null,
                    doi,
                    url: doi ? `https://doi.org/${doi}` : (htmlEntry?.url || (pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : null)),
                    openAccessUrl: pdfUrl,
                    pdf_url: pdfUrl,
                    isOpenAccess: item.isOpenAccess === 'Y' || Boolean(pdfUrl),
                    journal: item.journalInfo?.journal?.title || item.journalTitle || null,
                    publisher: item.journalInfo?.journal?.title || 'EuropePMC Indexed Journal',
                    citationCount: item.citedByCount || 0,
                    concepts: (item.keywordList?.keyword || []).filter(Boolean),
                    sourceType: 'academic',
                    sourceProvider: 'europepmc',
                    credibilityBaseScore: 86,
                    credibilityScore: 86
                };
            }).filter(p => p.title && (p.abstract || p.pdf_url));
        } catch (err) {
            log.debug('RESEARCH', `[EuropePMC] error: ${err.message}`);
            return [];
        }
    },

    /**
     * 2. OpenReview (ICLR, NeurIPS, ICML, TMLR — Direct Open-Access PDFs + Peer-Reviewed AI/CS)
     */
    async searchOpenReview(query, limit = 8) {
        try {
            // Try opencli openreview search first
            const cliRows = await runOpenCliJson(['openreview', 'search', query.trim(), '--limit', String(Math.min(limit, 20))], 10000);
            if (Array.isArray(cliRows) && cliRows.length > 0) {
                return cliRows.map(r => {
                    const id = r.id;
                    const pdfUrl = id ? `https://openreview.net/pdf?id=${id}` : null;
                    const yearMatch = String(r.venue || r.pdate || '').match(/\b(20\d{2})\b/);
                    return {
                        title: r.title || 'Untitled',
                        abstract: r.abstract || `Peer-reviewed submission at ${r.venue || 'OpenReview'} by ${r.authors || 'authors'}.`,
                        content: r.abstract || `Peer-reviewed submission at ${r.venue || 'OpenReview'} by ${r.authors || 'authors'}.`,
                        authors: typeof r.authors === 'string' ? r.authors.split(',').map(a => a.trim()) : (r.authors || []),
                        year: yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear(),
                        doi: null,
                        url: r.url || (id ? `https://openreview.net/forum?id=${id}` : null),
                        openAccessUrl: pdfUrl,
                        pdf_url: pdfUrl,
                        isOpenAccess: true,
                        journal: r.venue || 'OpenReview Conference',
                        publisher: r.venue || 'OpenReview',
                        citationCount: 10,
                        sourceType: 'academic',
                        sourceProvider: 'openreview',
                        credibilityBaseScore: 85,
                        credibilityScore: 85
                    };
                });
            }

            // Direct OpenReview API v2 fallback
            const resp = await axios.get('https://api2.openreview.net/notes/search', {
                params: { query: query.trim(), limit: Math.min(limit, 15) },
                timeout: 9000
            });
            const notes = resp.data?.notes || [];
            return notes.map(n => {
                const c = n.content || {};
                const val = (f) => (f && typeof f === 'object' && 'value' in f) ? f.value : f;
                const title = val(c.title);
                const abstract = val(c.abstract) || val(c.TLDR) || '';
                const authors = val(c.authors) || [];
                const venue = val(c.venue) || 'OpenReview';
                const year = n.pdate ? new Date(n.pdate).getFullYear() : (n.cdate ? new Date(n.cdate).getFullYear() : null);
                const pdfUrl = n.id ? `https://openreview.net/pdf?id=${n.id}` : null;
                return {
                    title: title || 'Untitled',
                    abstract,
                    content: abstract,
                    authors: Array.isArray(authors) ? authors : [],
                    year,
                    doi: null,
                    url: n.id ? `https://openreview.net/forum?id=${n.id}` : null,
                    openAccessUrl: pdfUrl,
                    pdf_url: pdfUrl,
                    isOpenAccess: true,
                    journal: venue,
                    publisher: venue,
                    citationCount: 10,
                    concepts: Array.isArray(val(c.keywords)) ? val(c.keywords) : [],
                    sourceType: 'academic',
                    sourceProvider: 'openreview',
                    credibilityBaseScore: 85,
                    credibilityScore: 85
                };
            }).filter(p => p.title && p.abstract);
        } catch (err) {
            log.debug('RESEARCH', `[OpenReview] error: ${err.message}`);
            return [];
        }
    },

    /**
     * 3. DBLP Computer Science & Engineering Bibliography (opencli dblp + API)
     */
    async searchDblp(query, limit = 10, constraints = {}) {
        try {
            const cliRows = await runOpenCliJson(['dblp', 'search', query.trim(), '--limit', String(Math.min(limit, 20))], 9000);
            let items = [];
            if (Array.isArray(cliRows) && cliRows.length > 0) {
                items = cliRows.map(r => {
                    const doiMatch = String(r.doi || r.url || '').match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
                    const doi = doiMatch ? doiMatch[0] : null;
                    return {
                        title: r.title || 'Untitled',
                        abstract: `Indexed in DBLP Computer Science Bibliography. Venue: ${r.venue || 'IEEE/ACM'} (${r.year || ''}). Authors: ${r.authors || ''}.`,
                        content: `Indexed in DBLP Computer Science Bibliography. Venue: ${r.venue || 'IEEE/ACM'} (${r.year || ''}). Authors: ${r.authors || ''}.`,
                        authors: typeof r.authors === 'string' ? r.authors.split(',').map(a => a.trim()) : (r.authors || []),
                        year: r.year ? parseInt(r.year, 10) : null,
                        doi,
                        url: doi ? `https://doi.org/${doi}` : r.url,
                        journal: r.venue || 'DBLP Indexed Venue',
                        publisher: r.venue || 'IEEE / ACM / Springer (DBLP)',
                        citationCount: 15,
                        sourceType: 'academic',
                        sourceProvider: 'dblp',
                        credibilityBaseScore: 84,
                        credibilityScore: 84
                    };
                });
            } else {
                const resp = await axios.get('https://dblp.org/search/publ/api', {
                    params: { q: query.trim(), format: 'json', h: Math.min(limit, 20) },
                    timeout: 8000
                });
                const hits = resp.data?.result?.hits?.hit || [];
                items = hits.map(h => {
                    const info = h.info || {};
                    const rawAuthors = info.authors?.author;
                    const authors = Array.isArray(rawAuthors)
                        ? rawAuthors.map(a => a.text || a).filter(Boolean)
                        : (rawAuthors ? [rawAuthors.text || String(rawAuthors)] : []);
                    const doi = info.doi || null;
                    return {
                        title: (info.title || 'Untitled').replace(/\.$/, ''),
                        abstract: `Peer-reviewed publication in ${info.venue || 'Computer Science Venue'} (${info.year || ''}).`,
                        content: `Peer-reviewed publication in ${info.venue || 'Computer Science Venue'} (${info.year || ''}).`,
                        authors,
                        year: info.year ? parseInt(info.year, 10) : null,
                        doi,
                        url: doi ? `https://doi.org/${doi}` : (info.ee || info.url || null),
                        journal: info.venue || null,
                        publisher: info.venue || 'DBLP',
                        citationCount: 12,
                        sourceType: 'academic',
                        sourceProvider: 'dblp',
                        credibilityBaseScore: 84,
                        credibilityScore: 84
                    };
                });
            }

            if (constraints.yearStart) {
                items = items.filter(i => !i.year || i.year >= constraints.yearStart);
            }
            if (constraints.yearEnd) {
                items = items.filter(i => !i.year || i.year <= constraints.yearEnd);
            }
            return items.slice(0, limit);
        } catch (err) {
            log.debug('RESEARCH', `[DBLP] error: ${err.message}`);
            return [];
        }
    },

    /**
     * 4. Google Scholar Discovery (HTTP + opencli google-scholar)
     * Extracts title, authors, venue, year, citation count, snippet, and direct [PDF] links!
     */
    async searchGoogleScholar(query, limit = 10, constraints = {}) {
        try {
            const params = {
                q: query.trim(),
                hl: 'en',
                num: Math.min(limit, 15)
            };
            if (constraints.yearStart) params.as_ylo = constraints.yearStart;
            if (constraints.yearEnd) params.as_yhi = constraints.yearEnd;

            const resp = await axios.get('https://scholar.google.com/scholar', {
                params,
                headers: BROWSER_HEADERS,
                timeout: 9000
            });

            const $ = cheerio.load(resp.data || '');
            const results = [];

            $('.gs_r.gs_or.gs_scl').each((_, el) => {
                const block = $(el);
                const titleEl = block.find('.gs_rt a').first();
                const title = (titleEl.text() || block.find('.gs_rt').text() || '').replace(/^\[PDF\]\s*|\[HTML\]\s*|\[BOOK\]\s*/i, '').trim();
                const url = titleEl.attr('href') || null;
                if (!title) return;

                const pdfLink = block.find('.gs_or_ggsm a').attr('href') || null;
                const metaLine = block.find('.gs_a').text().trim();
                const snippet = block.find('.gs_rs').text().trim().replace(/\s+/g, ' ');

                let year = null;
                const yearMatch = metaLine.match(/\b(19|20)\d{2}\b/);
                if (yearMatch) year = parseInt(yearMatch[0], 10);

                const parts = metaLine.split(' - ');
                const authors = parts[0] ? parts[0].split(',').map(a => a.trim()).filter(Boolean) : [];
                const journal = parts[1] ? parts[1].replace(/,?\s*(19|20)\d{2}.*$/, '').trim() : 'Google Scholar Indexed';
                const publisher = parts[2] ? parts[2].trim() : journal;

                let cited = 0;
                block.find('.gs_fl a').each((__, fl) => {
                    const txt = $(fl).text();
                    const m = txt.match(/Cited by (\d+)/i);
                    if (m) cited = parseInt(m[1], 10);
                });

                const doiMatch = (url || '').match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
                const doi = doiMatch ? doiMatch[0] : null;

                results.push({
                    title,
                    abstract: snippet || `Google Scholar indexed paper published in ${journal}.`,
                    content: snippet || `Google Scholar indexed paper published in ${journal}.`,
                    authors,
                    year,
                    doi,
                    url,
                    openAccessUrl: pdfLink && pdfLink.includes('.pdf') ? pdfLink : pdfLink,
                    pdf_url: pdfLink,
                    isOpenAccess: Boolean(pdfLink),
                    journal,
                    publisher,
                    citationCount: cited,
                    sourceType: 'academic',
                    sourceProvider: 'google_scholar',
                    credibilityBaseScore: Math.min(95, 82 + Math.round(Math.log1p(cited) * 1.5)),
                    credibilityScore: Math.min(95, 82 + Math.round(Math.log1p(cited) * 1.5))
                });
            });

            if (results.length > 0) {
                log.info('RESEARCH', `[Google Scholar] Retrieved ${results.length} scholarly papers for "${query.slice(0, 45)}"`);
                return results.slice(0, limit);
            }
        } catch (err) {
            log.debug('RESEARCH', `[Google Scholar HTTP] fallback: ${err.message}`);
        }

        // Fallback to opencli google-scholar search
        try {
            const cliRows = await runOpenCliJson(['google-scholar', 'search', query.trim(), '--limit', String(Math.min(limit, 10))], 12000);
            if (Array.isArray(cliRows) && cliRows.length > 0) {
                return cliRows.map(r => ({
                    title: r.title || 'Untitled',
                    abstract: `Google Scholar result from ${r.source || 'Academic Venue'} (${r.year || ''}).`,
                    content: `Google Scholar result from ${r.source || 'Academic Venue'} (${r.year || ''}).`,
                    authors: typeof r.authors === 'string' ? r.authors.split(',').map(a => a.trim()) : [],
                    year: r.year ? parseInt(r.year, 10) : null,
                    doi: null,
                    url: r.url || null,
                    journal: r.source || 'Google Scholar',
                    publisher: r.source || 'Google Scholar',
                    citationCount: r.cited ? parseInt(r.cited, 10) : 0,
                    sourceType: 'academic',
                    sourceProvider: 'google_scholar',
                    credibilityBaseScore: 85,
                    credibilityScore: 85
                }));
            }
        } catch (_) {}

        return [];
    },

    /**
     * 5. Crossref Works Search (Direct publisher full-text PDF links & DOIs)
     */
    async searchCrossref(query, limit = 8, constraints = {}) {
        try {
            const filters = ['type:journal-article'];
            if (constraints.yearStart) filters.push(`from-pub-date:${constraints.yearStart}`);
            if (constraints.yearEnd) filters.push(`until-pub-date:${constraints.yearEnd}`);

            const resp = await axios.get('https://api.crossref.org/works', {
                params: {
                    query: query.trim(),
                    rows: Math.min(limit, 15),
                    filter: filters.join(','),
                    select: 'DOI,title,author,published-print,published-online,container-title,publisher,is-referenced-by-count,abstract,link,URL'
                },
                headers: {
                    'User-Agent': 'iMentor-PhD-Research/2.5 (mailto:research@imentor.edu)'
                },
                timeout: 9000
            });

            const items = resp.data?.message?.items || [];
            return items.map(item => {
                const title = Array.isArray(item.title) ? item.title[0] : item.title;
                const rawAbstract = (item.abstract || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                const pub = item['published-print'] || item['published-online'];
                const year = pub?.['date-parts']?.[0]?.[0] || null;
                const authors = (item.author || []).map(a => [a.given, a.family].filter(Boolean).join(' ')).filter(Boolean);
                const journal = Array.isArray(item['container-title']) ? item['container-title'][0] : item['container-title'];
                const pdfLink = (item.link || []).find(l => (l['content-type'] || '').includes('pdf'))?.URL || null;
                const doi = item.DOI || null;

                return {
                    title: title || 'Untitled',
                    abstract: rawAbstract || `Peer-reviewed journal article in ${journal || item.publisher || 'Crossref'} (DOI: ${doi}).`,
                    content: rawAbstract || `Peer-reviewed journal article in ${journal || item.publisher || 'Crossref'} (DOI: ${doi}).`,
                    authors,
                    year,
                    doi,
                    url: doi ? `https://doi.org/${doi}` : (item.URL || null),
                    openAccessUrl: pdfLink,
                    pdf_url: pdfLink,
                    isOpenAccess: Boolean(pdfLink),
                    journal: journal || null,
                    publisher: item.publisher || journal || 'Crossref',
                    citationCount: item['is-referenced-by-count'] || 0,
                    sourceType: 'academic',
                    sourceProvider: 'crossref',
                    credibilityBaseScore: 86,
                    credibilityScore: 86
                };
            }).filter(p => p.title && p.doi);
        } catch (err) {
            log.debug('RESEARCH', `[Crossref] error: ${err.message}`);
            return [];
        }
    },

    /**
     * Unified Federated Fetch across Google Scholar, EuropePMC, OpenReview, DBLP, and Crossref
     */
    async fetchMultiAggregatorBatch(queries = [], quota = 15, constraints = {}) {
        const primaryQueries = queries.slice(0, 3);
        if (primaryQueries.length === 0) return [];

        const perProvider = Math.max(4, Math.ceil(quota / 4));
        const tasks = [];

        for (const q of primaryQueries.slice(0, 2)) {
            tasks.push(this.searchGoogleScholar(q, perProvider, constraints));
            tasks.push(this.searchEuropePMC(q, perProvider, constraints));
            tasks.push(this.searchCrossref(q, perProvider, constraints));
        }
        tasks.push(this.searchOpenReview(primaryQueries[0], perProvider));
        tasks.push(this.searchDblp(primaryQueries[0], perProvider, constraints));

        const settled = await Promise.allSettled(tasks);
        const combined = [];
        const seen = new Set();

        for (const res of settled) {
            if (res.status !== 'fulfilled' || !Array.isArray(res.value)) continue;
            for (const p of res.value) {
                const key = (p.doi || p.title || '').toLowerCase().trim();
                if (key && !seen.has(key)) {
                    seen.add(key);
                    combined.push(p);
                }
            }
        }

        log.info('RESEARCH', `[MultiAggregator] Collated ${combined.length} unique papers across Google Scholar, EuropePMC, Crossref, OpenReview & DBLP`);
        return combined;
    }
};

module.exports = openCliAcademicService;
