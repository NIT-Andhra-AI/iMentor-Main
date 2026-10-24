const log = require('../utils/logger');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const puppeteer = require('puppeteer');

/**
 * 2-Tier Full-Text Academic PDF Harvester & Section Parser
 *
 * Prioritizes QUALITY over speed for PhD Literature Reviews:
 *  - Tier 1 (Open-Access HTTP Stream): Downloads direct PDFs from OpenAlex best_oa_location,
 *    Semantic Scholar openAccessPdf, arXiv, OpenReview, EuropePMC, SpringerLink, and Crossref.
 *  - Tier 2 (NIT Andhra Pradesh Institutional Network Browser Harvester):
 *    Uses a pooled singleton headless Chrome (/usr/bin/google-chrome) authenticated via the
 *    campus IP to resolve DOIs on IEEE Xplore, ScienceDirect (Elsevier), Wiley, ACM DL,
 *    and Taylor & Francis — downloading either the institutional PDF stream or extracting the
 *    complete full-text DOM (Methodology, Experimental Setup, Quantitative Tables, Limitations).
 *  - Section Parser (/usr/bin/pdftotext -layout):
 *    Extracts structured academic sections (Methodology, Datasets/Setup, Quantitative Results,
 *    Limitations) and attaches up to 3,400 chars of high-density technical evidence per paper.
 */

const STORAGE_ROOT = path.join(__dirname, '../storage/research_pdfs');
if (!fs.existsSync(STORAGE_ROOT)) {
    fs.mkdirSync(STORAGE_ROOT, { recursive: true });
}

const CHROME_PATH = '/usr/bin/google-chrome';
const PDFTOTEXT_BIN = '/usr/bin/pdftotext';

const HTTP_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'application/pdf,application/xhtml+xml,text/html;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
};

let _sharedBrowser = null;
let _browserLaunching = null;
let _browserIdleTimer = null;

async function getSharedBrowser() {
    if (_browserIdleTimer) {
        clearTimeout(_browserIdleTimer);
        _browserIdleTimer = null;
    }
    if (_sharedBrowser && _sharedBrowser.connected) {
        scheduleBrowserIdleClose();
        return _sharedBrowser;
    }
    if (_browserLaunching) {
        return _browserLaunching;
    }

    const launchOpts = {
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--disable-gpu'
        ]
    };
    if (fs.existsSync(CHROME_PATH)) {
        launchOpts.executablePath = CHROME_PATH;
    }

    _browserLaunching = puppeteer.launch(launchOpts).then(b => {
        _sharedBrowser = b;
        _browserLaunching = null;
        b.on('disconnected', () => { _sharedBrowser = null; });
        scheduleBrowserIdleClose();
        return b;
    }).catch(err => {
        _browserLaunching = null;
        throw err;
    });

    return _browserLaunching;
}

function scheduleBrowserIdleClose() {
    if (_browserIdleTimer) clearTimeout(_browserIdleTimer);
    _browserIdleTimer = setTimeout(async () => {
        if (_sharedBrowser) {
            try { await _sharedBrowser.close(); } catch (_) {}
            _sharedBrowser = null;
        }
    }, 180000);
    if (_browserIdleTimer.unref) _browserIdleTimer.unref();
}

function extractTextWithPdftotext(pdfFilePath) {
    return new Promise((resolve) => {
        execFile(
            PDFTOTEXT_BIN,
            ['-layout', '-enc', 'UTF-8', pdfFilePath, '-'],
            { timeout: 15000, maxBuffer: 25 * 1024 * 1024 },
            (err, stdout) => {
                if (err || !stdout) return resolve('');
                resolve(stdout);
            }
        );
    });
}

function parseFullTextIntoSections(rawText = '') {
    const clean = String(rawText)
        .replace(/\r/g, '\n')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    if (clean.length < 300) return null;

    let bodyText = clean;
    const refMatch = clean.search(/\n\s*(?:REFERENCES|References|BIBLIOGRAPHY|Bibliography)\s*\n/);
    if (refMatch > clean.length * 0.45) {
        bodyText = clean.slice(0, refMatch);
    }

    function extractWindow(regexList, fallbackStartRatio, maxLen = 1100) {
        for (const rx of regexList) {
            const idx = bodyText.search(rx);
            if (idx !== -1) {
                return bodyText.slice(idx, idx + maxLen).replace(/\s+/g, ' ').trim();
            }
        }
        const start = Math.floor(bodyText.length * fallbackStartRatio);
        return bodyText.slice(start, start + maxLen).replace(/\s+/g, ' ').trim();
    }

    const methodology = extractWindow([
        /\n\s*(?:II|III|2|3)\.?\s*(?:METHODOLOGY|PROPOSED\s+METHOD|SYSTEM\s+MODEL|MATHEMATICAL\s+FORMULATION|ARCHITECTURE|FRAMEWORK|PROBLEM\s+FORMULATION)/i,
        /\b(?:Methodology|Proposed\s+Approach|Proposed\s+Framework|System\s+Architecture|Model\s+Formulation|Algorithm\s+Design)\b/i
    ], 0.20, 1200);

    const experimentalSetup = extractWindow([
        /\n\s*(?:III|IV|4|5)\.?\s*(?:EXPERIMENTAL\s+SETUP|EXPERIMENTS|DATASET|DATASETS|SIMULATION\s+SETUP|EVALUATION\s+SETUP|IMPLEMENTATION)/i,
        /\b(?:Experimental\s+Setup|Dataset\s+Description|Benchmark\s+Datasets|Simulation\s+Parameters|Evaluation\s+Metrics|Baseline\s+Models|Hyperparameters)\b/i
    ], 0.48, 1000);

    const quantitativeResults = extractWindow([
        /\n\s*(?:IV|V|4|5|6)\.?\s*(?:RESULTS|EXPERIMENTAL\s+RESULTS|PERFORMANCE\s+EVALUATION|QUANTITATIVE\s+RESULTS|ABLATION\s+STUDY|COMPARATIVE\s+ANALYSIS)/i,
        /\b(?:Table\s+I|Table\s+1|Table\s+2|Quantitative\s+Results|Ablation\s+Study|Performance\s+Comparison|outperforms|RMSE|MAE|accuracy|F1-score)\b/i
    ], 0.65, 1100);

    const limitationsAndGaps = extractWindow([
        /\n\s*(?:V|VI|VII|5|6|7)\.?\s*(?:LIMITATIONS|DISCUSSION|CONCLUSION|FUTURE\s+WORK|OPEN\s+CHALLENGES)/i,
        /\b(?:limitations|future\s+work|future\s+directions|computational\s+cost|drawback|remains\s+a\s+challenge|unexplored)\b/i
    ], 0.84, 850);

    const sentences = bodyText.split(/(?<=[.!?])\s+/);
    const metricSentences = sentences
        .filter(s => s.length > 40 && s.length < 320 && /(\b\d+\.\d+%?|\bRMSE\b|\bMAE\b|\bMAPE\b|\bF1\b|\bPSNR\b|\bAUC\b|\bp\s*<\s*0\.0|\baccuracy\b|\bspeedup\b|\btable\s+\d)/i.test(s))
        .slice(0, 6)
        .join(' ');

    const wordCount = clean.split(/\s+/).length;

    return {
        wordCount,
        methodology,
        experimentalSetup,
        quantitativeResults: metricSentences ? `${quantitativeResults}\n[Key Quantitative Sentences]: ${metricSentences}`.slice(0, 1300) : quantitativeResults,
        limitationsAndGaps
    };
}

function getCandidatePdfUrls(source) {
    const urls = [];
    if (source.pdf_url) urls.push(source.pdf_url);
    if (source.openAccessUrl) urls.push(source.openAccessUrl);

    const arxivId = source.arxivId || ((source.url || '').match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5})/i)?.[1]);
    if (arxivId) {
        urls.push(`https://arxiv.org/pdf/${arxivId.replace(/\.pdf$/i, '')}.pdf`);
    }

    const doi = source.doi ? source.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim() : null;
    if (doi) {
        if (doi.startsWith('10.1007/') || doi.startsWith('10.1038/') || doi.startsWith('10.1186/')) {
            urls.push(`https://link.springer.com/content/pdf/${encodeURIComponent(doi)}.pdf`);
        }
        if (doi.startsWith('10.1002/') || doi.startsWith('10.1111/')) {
            urls.push(`https://onlinelibrary.wiley.com/doi/pdfdirect/${doi}?download=true`);
        }
        if (doi.startsWith('10.1145/')) {
            urls.push(`https://dl.acm.org/doi/pdf/${doi}`);
        }
        if (doi.startsWith('10.1080/')) {
            urls.push(`https://www.tandfonline.com/doi/pdf/${doi}?needAccess=true`);
        }
    }

    if (source.url && source.url.includes('openreview.net/forum?id=')) {
        urls.push(source.url.replace('/forum?id=', '/pdf?id='));
    }

    return [...new Set(urls.filter(Boolean))];
}

async function tryDirectHttpPdfDownload(candidateUrls, destFilePath) {
    for (const url of candidateUrls) {
        try {
            const resp = await axios.get(url, {
                responseType: 'arraybuffer',
                headers: HTTP_HEADERS,
                timeout: 12000,
                maxRedirects: 6,
                validateStatus: status => status >= 200 && status < 400
            });

            const buf = Buffer.from(resp.data);
            if (buf.length > 8192 && buf.slice(0, 5).toString('ascii') === '%PDF-') {
                fs.writeFileSync(destFilePath, buf);
                return { ok: true, pdfPath: destFilePath, bytes: buf.length, sourceUrl: url, method: 'direct_http_pdf' };
            }
        } catch (_) {}
    }
    return { ok: false };
}

async function tryInstitutionalBrowserHarvest(source, destFilePath) {
    const doi = source.doi ? source.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim() : null;
    const targetUrl = doi ? `https://doi.org/${doi}` : source.url;
    if (!targetUrl) return { ok: false };

    let page = null;
    try {
        const browser = await getSharedBrowser();
        page = await browser.newPage();
        await page.setUserAgent(HTTP_HEADERS['User-Agent']);
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 16000 });
        const finalUrl = page.url();

        const ieeeMatch = finalUrl.match(/ieeexplore\.ieee\.org\/(?:document|abstract\/document)\/(\d+)/i);
        if (ieeeMatch) {
            const arnumber = ieeeMatch[1];
            const stampUrl = `https://ieeexplore.ieee.org/stampPDF/getPDF.jsp?tp=&arnumber=${arnumber}&ref=`;
            const pdfBase64 = await page.evaluate(async (u) => {
                try {
                    const r = await fetch(u, { credentials: 'include' });
                    if (!r.ok) return null;
                    const ab = await r.arrayBuffer();
                    const bytes = new Uint8Array(ab);
                    if (bytes.length < 8000 || String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== '%PDF') return null;
                    let binary = '';
                    const chunk = 0x8000;
                    for (let i = 0; i < bytes.length; i += chunk) {
                        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
                    }
                    return btoa(binary);
                } catch (_) {
                    return null;
                }
            }, stampUrl);

            if (pdfBase64) {
                const buf = Buffer.from(pdfBase64, 'base64');
                fs.writeFileSync(destFilePath, buf);
                return { ok: true, pdfPath: destFilePath, bytes: buf.length, sourceUrl: stampUrl, method: 'nit_ap_ieee_pdf' };
            }
        }

        const domPdfUrl = await page.evaluate(() => {
            const metaPdf = document.querySelector('meta[name="citation_pdf_url"]')?.getAttribute('content');
            if (metaPdf) return metaPdf;
            const links = Array.from(document.querySelectorAll('a[href]'));
            const pdfLink = links.find(a => /\.pdf($|\?)|\/pdf\/|\/epdf\/|\/pdfft|stamp\.jsp/i.test(a.href));
            return pdfLink ? pdfLink.href : null;
        });

        if (domPdfUrl && !domPdfUrl.includes('stamp.jsp')) {
            const pdfBase64 = await page.evaluate(async (u) => {
                try {
                    const r = await fetch(u, { credentials: 'include' });
                    if (!r.ok) return null;
                    const ab = await r.arrayBuffer();
                    const bytes = new Uint8Array(ab);
                    if (bytes.length < 8000 || String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== '%PDF') return null;
                    let binary = '';
                    const chunk = 0x8000;
                    for (let i = 0; i < bytes.length; i += chunk) {
                        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
                    }
                    return btoa(binary);
                } catch (_) {
                    return null;
                }
            }, domPdfUrl);

            if (pdfBase64) {
                const buf = Buffer.from(pdfBase64, 'base64');
                fs.writeFileSync(destFilePath, buf);
                return { ok: true, pdfPath: destFilePath, bytes: buf.length, sourceUrl: domPdfUrl, method: 'nit_ap_publisher_pdf' };
            }
        }

        const domText = await page.evaluate(() => {
            const selectors = [
                'article', '#body', '.Body', '.hlFld-Fulltext', '.article__body',
                '.c-article-body', '#sec1', 'main', '.document-main-content'
            ];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el && el.innerText && el.innerText.trim().length > 1500) {
                    return el.innerText.trim();
                }
            }
            return document.body ? document.body.innerText.trim() : '';
        });

        if (domText && domText.length > 1800) {
            return { ok: true, pdfPath: null, domFullText: domText, sourceUrl: finalUrl, method: 'nit_ap_institutional_dom' };
        }

        return { ok: false };
    } catch (err) {
        log.debug('RESEARCH', `[InstitutionalBrowser] Skipped ${targetUrl}: ${err.message}`);
        return { ok: false };
    } finally {
        if (page) {
            try { await page.close(); } catch (_) {}
        }
    }
}

const institutionalPdfService = {
    STORAGE_ROOT,
    getSharedBrowser,

    async harvestAndEnrichFullTextCorpus(sources = [], sessionFolderId = 'default', options = {}, onProgress = null) {
        const maxFullTextPapers = options.maxFullTextPapers || 18;
        const folderPath = path.join(STORAGE_ROOT, String(sessionFolderId).replace(/[^a-zA-Z0-9_-]/g, '_'));
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        const candidates = sources
            .map((s, idx) => ({ source: s, idx }))
            .filter(({ source }) => source.sourceType === 'academic' || source.doi || source.pdf_url || source.openAccessUrl || source.arxivId)
            .sort((a, b) => {
                const hasDirectA = (a.source.pdf_url || a.source.openAccessUrl || a.source.arxivId) ? 1 : 0;
                const hasDirectB = (b.source.pdf_url || b.source.openAccessUrl || b.source.arxivId) ? 1 : 0;
                if (hasDirectA !== hasDirectB) return hasDirectB - hasDirectA;
                return (b.source.credibilityScore || 0) - (a.source.credibilityScore || 0);
            })
            .slice(0, maxFullTextPapers);

        if (candidates.length === 0) return { sources, harvestedCount: 0, pdfSavedCount: 0, folderPath };

        log.info('RESEARCH', `[FullTextHarvester] Harvesting full text for top ${candidates.length} academic papers (Folder: ${sessionFolderId})`);

        let harvestedCount = 0;
        let pdfSavedCount = 0;
        const CONCURRENCY = 4;

        for (let i = 0; i < candidates.length; i += CONCURRENCY) {
            const batch = candidates.slice(i, i + CONCURRENCY);
            if (onProgress) {
                onProgress(`Harvesting & parsing full-text PDFs (${Math.min(i + CONCURRENCY, candidates.length)}/${candidates.length} top papers via Open-Access & NIT-AP Network)...`);
            }

            await Promise.all(batch.map(async ({ source, idx }) => {
                const citNum = source.citationIndex || (idx + 1);
                const safeTitle = String(source.title || 'paper').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 45);
                const pdfFileName = `Paper_${String(citNum).padStart(2, '0')}_${safeTitle}.pdf`;
                const destPdfPath = path.join(folderPath, pdfFileName);

                const candidateUrls = getCandidatePdfUrls(source);

                let harvestRes = await tryDirectHttpPdfDownload(candidateUrls, destPdfPath);

                if (!harvestRes.ok && source.doi) {
                    try {
                        const cleanDoi = source.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim();
                        const oaWork = await axios.get(`https://api.openalex.org/works/https://doi.org/${encodeURIComponent(cleanDoi)}`, {
                            params: { mailto: 'imentor@academic.search', select: 'best_oa_location,open_access,locations' },
                            timeout: 6000
                        }).then(r => r.data).catch(() => null);

                        const extraPdfUrl = oaWork?.best_oa_location?.pdf_url || (oaWork?.locations || []).find(l => l.pdf_url)?.pdf_url;
                        if (extraPdfUrl && !candidateUrls.includes(extraPdfUrl)) {
                            harvestRes = await tryDirectHttpPdfDownload([extraPdfUrl], destPdfPath);
                        }
                    } catch (_) {}
                }

                if (!harvestRes.ok && (source.doi || source.url)) {
                    harvestRes = await tryInstitutionalBrowserHarvest(source, destPdfPath);
                }

                if (!harvestRes.ok) return;

                let rawFullText = '';
                if (harvestRes.pdfPath && fs.existsSync(harvestRes.pdfPath)) {
                    pdfSavedCount++;
                    source.localPdfPath = harvestRes.pdfPath;
                    source.localPdfFilename = pdfFileName;
                    source.hasLocalPdf = true;
                    rawFullText = await extractTextWithPdftotext(harvestRes.pdfPath);
                } else if (harvestRes.domFullText) {
                    rawFullText = harvestRes.domFullText;
                }

                const parsedSections = parseFullTextIntoSections(rawFullText);
                if (parsedSections) {
                    harvestedCount++;
                    source.hasFullText = true;
                    source.pdfHarvestMethod = harvestRes.method;
                    source.fullTextWordCount = parsedSections.wordCount;
                    source.fullTextSections = {
                        methodology: parsedSections.methodology,
                        datasets: parsedSections.experimentalSetup,
                        results: parsedSections.quantitativeResults,
                        limitations: parsedSections.limitationsAndGaps
                    };

                    const abstractPart = (source.abstract || source.content || '').slice(0, 800);
                    source.content = [
                        `[Abstract]: ${abstractPart}`,
                        `[Full-Text Methodology & Formulation]: ${parsedSections.methodology}`,
                        `[Experimental Setup & Datasets]: ${parsedSections.experimentalSetup}`,
                        `[Quantitative Results & Metrics]: ${parsedSections.quantitativeResults}`,
                        `[Limitations & Open Gaps]: ${parsedSections.limitationsAndGaps}`
                    ].join('\n\n').slice(0, 3400);

                    source.credibilityScore = Math.min(99, (source.credibilityScore || 85) + 7);
                }
            }));
        }

        log.info('RESEARCH', `[FullTextHarvester] Completed: ${harvestedCount}/${candidates.length} papers parsed with full-text sections (${pdfSavedCount} PDFs saved).`);
        return { sources, harvestedCount, pdfSavedCount, folderPath };
    }
};

module.exports = institutionalPdfService;
