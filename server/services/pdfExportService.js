const log = require('../utils/logger');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');
const institutionalPdfService = require('./institutionalPdfService');

const PANDOC_BIN = '/usr/bin/pandoc';
const ZIP_BIN = '/usr/bin/zip';

function execFilePromise(cmd, args, opts = {}) {
    return new Promise((resolve, reject) => {
        execFile(cmd, args, opts, (err, stdout, stderr) => {
            if (err) return reject(new Error(stderr || err.message));
            resolve(stdout);
        });
    });
}

const pdfExportService = {
    /**
     * Generate a professional PhD Literature Review PDF using the shared headless Chrome pool.
     */
    async generateAcademicPDF(report) {
        const researchData = report.researchReport || {};
        const sourcesRaw = researchData.sourcesUsed || report.sourcesUsed || report.sources || [];
        const sources = Array.isArray(sourcesRaw) ? sourcesRaw : [];

        const htmlContent = this.buildHTMLTemplate(report, researchData, sources);

        let page = null;
        try {
            const browser = await institutionalPdfService.getSharedBrowser();
            page = await browser.newPage();
            log.info('SYSTEM', `Generating PhD PDF for "${(researchData.title || report.query || '').substring(0, 40)}..."`);
            await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 60000 });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '22mm',
                    bottom: '22mm',
                    left: '18mm',
                    right: '18mm'
                },
                displayHeaderFooter: true,
                footerTemplate: `
          <div style="font-size: 8px; color: #777; width: 100%; text-align: center; font-family: 'Georgia', serif; padding: 0 18mm;">
            <span style="float: left;">iMentor PhD Literature Review &amp; Synthesis Engine</span>
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          </div>
        `,
                headerTemplate: '<div></div>',
            });

            log.success('SYSTEM', "Academic PDF generated successfully");
            return Buffer.from(pdfBuffer);
        } catch (error) {
            log.error('SYSTEM', `PDF generation failed: ${error.message}`);
            throw error;
        } finally {
            if (page) {
                try { await page.close(); } catch (_) {}
            }
        }
    },

    /**
     * Generate Markdown (.md) representation of the entire PhD Literature Review,
     * including Search Strategy Blueprint, Comparison Matrix Table, Thematic Sections,
     * PhD Research Gaps, Academic Sentence Framing Bank, and References.
     */
    generateMarkdown(report) {
        const data = report.researchReport || report.metadata || report || {};
        const sources = Array.isArray(data.sourcesUsed || report.sources) ? (data.sourcesUsed || report.sources) : [];
        const title = data.title || report.title || report.query || 'PhD Literature Review Report';
        const summary = data.executiveSummary || {};
        const matrix = Array.isArray(data.comparisonMatrix) ? data.comparisonMatrix : (Array.isArray(report.comparisonMatrix) ? report.comparisonMatrix : (Array.isArray(report.metadata?.comparisonMatrix) ? report.metadata.comparisonMatrix : []));
        const gaps = Array.isArray(data.phdResearchDirections) ? data.phdResearchDirections : (Array.isArray(report.phdResearchDirections || report.researchGaps) ? (report.phdResearchDirections || report.researchGaps) : []);
        const blueprint = data.searchStrategyBlueprint || report.plan || {};
        const pd = blueprint.problemDeconstruction || {};
        const kt = blueprint.keywordTaxonomy || {};
        const sfb = blueprint.sentenceFramingBank || {};

        let md = `# ${title}\n\n`;
        md += `**Research Query:** ${report.query || title}  \n`;
        md += `**Date:** ${new Date(report.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | **Analytical Confidence:** ${data.overallConfidenceScore || report.overallConfidenceScore || 85}% | **Sources Synthesized:** ${sources.length} (${sources.filter(s => s.hasFullText).length} Full-Text PDFs Parsed)\n\n---\n\n`;

        md += `## I. Executive Summary\n\n`;
        md += `${summary.analyticalOverview || 'Comprehensive literature synthesis completed.'}\n\n`;
        if (summary.primaryDriver) md += `- **Primary Methodological / Physical Driver:** ${summary.primaryDriver}\n`;
        if (summary.primaryContradiction) md += `- **Primary Empirical Contradiction / Trade-off:** ${summary.primaryContradiction}\n`;
        if (summary.strongestInsight) md += `- **Decisive Finding:** ${summary.strongestInsight}\n`;
        md += `\n`;

        if (pd && pd.corePhenomenonOrSystem) {
            md += `## II. Research Strategy & Problem Deconstruction\n\n`;
            md += `- **Core Phenomenon / System:** ${pd.corePhenomenonOrSystem}\n`;
            md += `- **Methodological Focus:** ${pd.methodologicalFocus || 'N/A'}\n`;
            md += `- **Baseline Paradigms:** ${pd.baselineParadigms || 'N/A'}\n`;
            md += `- **Evaluation Metrics & Benchmarks:** ${pd.evaluationMetricsAndDatasets || 'N/A'}\n`;
            md += `- **Boundary Constraints & Regimes:** ${pd.keyConstraintsAndRegimes || 'N/A'}\n\n`;

            if (kt.booleanSearchStrings) {
                md += `### Boolean Search Strategy\n`;
                for (const [engine, qStr] of Object.entries(kt.booleanSearchStrings)) {
                    md += `- **${engine}:** \`${qStr}\`\n`;
                }
                md += `\n`;
            }
        }

        if (matrix.length > 0) {
            md += `## III. Side-by-Side Literature Comparison Matrix\n\n`;
            md += `| Ref | Study & Venue | Core Problem | Methodology / Model | Datasets & Setup | Key Quantitative Metrics | Limitations & Gaps |\n`;
            md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
            for (const row of matrix) {
                const cleanCell = (v) => String(v || 'N/A').replace(/\|/g, '/').replace(/\r?\n/g, ' ').trim();
                md += `| [${row.citationIndex}] | **${cleanCell(row.paperTitle)}** (${cleanCell(row.authorsYearVenue)}) | ${cleanCell(row.coreProblem)} | ${cleanCell(row.methodology)} | ${cleanCell(row.datasetsAndSetup)} | ${cleanCell(row.keyMetrics)} | ${cleanCell(row.limitationsAndGaps)} |\n`;
            }
            md += `\n`;
        }

        md += `## IV. Thematic Literature Synthesis\n\n`;
        (data.sections || []).forEach((sec, idx) => {
            md += `### 4.${idx + 1} ${sec.title}\n\n${sec.content}\n\n`;
            if (sec.causalMechanism) {
                md += `> **Governing Mechanism:** ${sec.causalMechanism}\n\n`;
            }
        });

        if (gaps.length > 0) {
            md += `## V. Open Research Lacunae & PhD Thesis Directions\n\n`;
            gaps.forEach((g, idx) => {
                md += `### Gap ${idx + 1}: ${g.gapTitle}\n`;
                md += `- **Literature Contradiction / Lacuna:** ${g.contradictionOrLacuna}\n`;
                md += `- **Proposed PhD Contribution:** ${g.proposedPhdDirection}\n`;
                md += `- **Suggested Methodology:** ${g.suggestedMethodology}\n`;
                md += `- **Target Benchmarks & Metrics:** ${g.targetDatasetsAndMetrics}\n\n`;
            });
        }

        if (sfb && Object.keys(sfb).length > 0) {
            md += `## VI. Academic Sentence Framing Bank for Manuscript Drafting\n\n`;
            for (const [cat, list] of Object.entries(sfb)) {
                if (Array.isArray(list) && list.length > 0) {
                    md += `### ${cat}\n`;
                    list.forEach(item => { md += `- "${item}"\n`; });
                    md += `\n`;
                }
            }
        }

        if (sources.length > 0) {
            md += `## VII. Verified Scholarly References\n\n`;
            sources.forEach((s, idx) => {
                const citNum = s.citationIndex || (idx + 1);
                const authors = Array.isArray(s.authors) ? s.authors.join(', ') : (s.authors || 'Unknown');
                const year = s.year || s.publishedYear || 'n.d.';
                const venue = s.journal || s.publisher || s.sourceProvider || 'Academic Venue';
                const doiStr = s.doi ? ` DOI: https://doi.org/${s.doi}` : '';
                const ftBadge = s.hasFullText ? ' [Full-Text PDF Parsed]' : (s.isOpenAccess ? ' [Open-Access]' : '');
                md += `[${citNum}] ${authors} (${year}). "${s.title}." *${venue}*.${doiStr}${ftBadge}\n\n`;
            });
        }

        return md;
    },

    /**
     * Generate CSV (.csv) Comparison Matrix for Excel / R / Pandas analysis.
     */
    generateComparisonCSV(report) {
        const data = report.researchReport || report.metadata || report || {};
        const matrix = Array.isArray(data.comparisonMatrix)
            ? data.comparisonMatrix
            : (Array.isArray(report.comparisonMatrix) ? report.comparisonMatrix : (Array.isArray(report.metadata?.comparisonMatrix) ? report.metadata.comparisonMatrix : []));
        const customCols = Array.isArray(data.customMatrixColumns)
            ? data.customMatrixColumns
            : (Array.isArray(report.customMatrixColumns) ? report.customMatrixColumns : []);

        const escCsv = (val) => {
            const s = String(val ?? '').split('\r').join(' ').split('\n').join(' ').trim();
            return '"' + s.replace(/"/g, '""') + '"';
        };

        const baseHeaders = [
            'Ref',
            'Paper Title',
            'Authors, Year & Venue',
            'Core Problem Addressed',
            'Methodology / Architecture',
            'Datasets & Experimental Setup',
            'Key Quantitative Metrics',
            'Limitations & Open Gaps',
            ...customCols.map(c => c.label || c.key),
            'Full-Text Parsed',
            'Harvest Method',
            'DOI',
            'URL'
        ];

        const rows = [baseHeaders.map(escCsv).join(',')];
        for (const r of matrix) {
            const customVals = customCols.map(c => (r.customFields && r.customFields[c.key]) ? r.customFields[c.key] : 'N/A');
            rows.push([
                '[' + (r.citationIndex || '') + ']',
                r.paperTitle || '',
                r.authorsYearVenue || '',
                r.coreProblem || '',
                r.methodology || '',
                r.datasetsAndSetup || '',
                r.keyMetrics || '',
                r.limitationsAndGaps || '',
                ...customVals,
                r.hasFullText ? 'Yes' : 'Abstract-Only',
                r.pdfHarvestMethod || 'metadata',
                r.doi || '',
                r.url || ''
            ].map(escCsv).join(','));
        }
        return rows.join('\n');
    },

    generateBibTeX(report) {
        const data = report.researchReport || report.metadata || report || {};
        const sources = Array.isArray(data.sourcesUsed || report.sources) ? (data.sourcesUsed || report.sources) : [];

        return sources.map((s, idx) => {
            const citNum = s.citationIndex || (idx + 1);
            const firstAuthor = (s.authors?.[0]?.split(' ').pop() || 'ref').replace(/[^a-zA-Z]/g, '').toLowerCase() || 'paper';
            const year = s.year || s.publishedYear || new Date().getFullYear();
            const key = `ref${citNum}_${firstAuthor}${year}`;
            const cleanTitle = String(s.title || 'Untitled').replace(/[{}]/g, '');
            const authors = Array.isArray(s.authors) && s.authors.length > 0 ? s.authors.join(' and ') : 'Unknown';
            const journal = String(s.journal || s.publisher || 'Academic Publication').replace(/[{}]/g, '');
            const doiLine = s.doi ? `,\n  doi = {${s.doi}}` : '';
            const urlLine = (s.openAccessUrl || s.url) ? `,\n  url = {${s.openAccessUrl || s.url}}` : '';
            return `@article{${key},\n  title = {{${cleanTitle}}},\n  author = {${authors}},\n  journal = {${journal}},\n  year = {${year}}${doiLine}${urlLine}\n}`;
        }).join('\n\n');
    },

    /**
     * Generate IEEE/Survey-Ready LaTeX (.tex) Manuscript.
     */
    generateLaTeX(report) {
        const data = report.researchReport || report.metadata || report || {};
        const sources = Array.isArray(data.sourcesUsed || report.sources) ? (data.sourcesUsed || report.sources) : [];
        const title = data.title || report.title || report.query || 'Literature Review';
        const summary = data.executiveSummary || {};
        const matrix = Array.isArray(data.comparisonMatrix) ? data.comparisonMatrix : (Array.isArray(report.comparisonMatrix) ? report.comparisonMatrix : (Array.isArray(report.metadata?.comparisonMatrix) ? report.metadata.comparisonMatrix : []));
        const gaps = Array.isArray(data.phdResearchDirections) ? data.phdResearchDirections : (Array.isArray(report.phdResearchDirections || report.researchGaps) ? (report.phdResearchDirections || report.researchGaps) : []);

        const escTex = (str) => String(str || '')
            .replace(/\\/g, '\textbackslash{}')
            .replace(/([&%$#_{}])/g, '\\$1')
            .replace(/~/g, '\textasciitilde{}')
            .replace(/\^/g, '\textasciicircum{}');

        const convertCites = (str) => escTex(str).replace(/\[(?:Source\s+)?(\d+)\]/g, '\\cite{ref$1}');

        let tex = `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[margin=1in]{geometry}
\\usepackage{booktabs}
\\usepackage{longtable}
\\usepackage{array}
\\usepackage{hyperref}

\\title{\\textbf{${escTex(title)}}}
\\author{Generated via iMentor PhD Literature Review Engine}
\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
${convertCites(summary.analyticalOverview || '')}
\\end{abstract}
`;

        if (matrix.length > 0) {
            tex += `\n\\section{Comparative Literature Matrix}
\\begin{scriptsize}
\\begin{longtable}{p{0.05\\textwidth}p{0.18\\textwidth}p{0.16\\textwidth}p{0.18\\textwidth}p{0.16\\textwidth}p{0.16\\textwidth}}
\\toprule
\\textbf{Ref} & \\textbf{Study \\& Venue} & \\textbf{Problem} & \\textbf{Methodology} & \\textbf{Metrics} & \\textbf{Limitations} \\\\
\\midrule
\\endhead
`;
            for (const r of matrix) {
                tex += `[${r.citationIndex}] & ${escTex(r.paperTitle)} (${escTex(r.authorsYearVenue)}) & ${escTex(r.coreProblem)} & ${escTex(r.methodology)} & ${escTex(r.keyMetrics)} & ${escTex(r.limitationsAndGaps)} \\\\ \\midrule\n`;
            }
            tex += `\\bottomrule
\\end{longtable}
\\end{scriptsize}\n`;
        }

        (data.sections || []).forEach((sec) => {
            tex += `\n\\section{${escTex(sec.title)}}\n`;
            const paras = String(sec.content || '').split(/\n\n+/).filter(Boolean);
            for (const p of paras) {
                tex += `${convertCites(p.trim())}\n\n`;
            }
        });

        if (gaps.length > 0) {
            tex += `\n\\section{Open Research Gaps \\& PhD Thesis Directions}\n\\begin{itemize}\n`;
            for (const g of gaps) {
                tex += `  \\item \\textbf{${escTex(g.gapTitle)}:} ${convertCites(g.contradictionOrLacuna)} \\textit{Proposed Direction:} ${convertCites(g.proposedPhdDirection)}\n`;
            }
            tex += `\\end{itemize}\n`;
        }

        tex += `\n\\begin{thebibliography}{99}\n`;
        sources.forEach((s, idx) => {
            const citNum = s.citationIndex || (idx + 1);
            const authors = Array.isArray(s.authors) ? s.authors.join(', ') : (s.authors || 'Unknown');
            const year = s.year || s.publishedYear || 'n.d.';
            const venue = s.journal || s.publisher || 'Academic Venue';
            tex += "\\bibitem{ref" + citNum + "} " + escTex(authors) + " (" + escTex(year) + "). \"" + escTex(s.title) + "\", \\textit{" + escTex(venue) + "}.\n";
        });
        tex += `\\end{thebibliography}\n\\end{document}\n`;

        return tex;
    },

    /**
     * Generate Microsoft Word (.docx) via /usr/bin/pandoc.
     */
    async generateDocx(report) {
        const mdContent = this.generateMarkdown(report);
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'imentor-docx-'));
        const mdPath = path.join(tmpDir, 'report.md');
        const docxPath = path.join(tmpDir, 'report.docx');

        try {
            fs.writeFileSync(mdPath, mdContent, 'utf8');
            await execFilePromise(PANDOC_BIN, [mdPath, '-f', 'markdown', '-t', 'docx', '-o', docxPath], { timeout: 30000 });
            const buf = fs.readFileSync(docxPath);
            return buf;
        } finally {
            try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
        }
    },

    /**
     * Generate Complete PhD Research Bundle (.zip) containing:
     * - PDF report, DOCX report, Markdown report, Comparison Matrix CSV, LaTeX .tex, BibTeX .bib,
     *   and all locally harvested full-text source PDFs!
     */
    async generateCompleteZipBundle(report) {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'imentor-bundle-'));
        const bundleDir = path.join(tmpDir, 'PhD_Literature_Review_Bundle');
        const papersOutDir = path.join(bundleDir, 'Full_Text_Source_PDFs');
        fs.mkdirSync(papersOutDir, { recursive: true });

        try {
            const [pdfBuf, docxBuf] = await Promise.all([
                this.generateAcademicPDF(report).catch(() => null),
                this.generateDocx(report).catch(() => null),
            ]);

            if (pdfBuf) fs.writeFileSync(path.join(bundleDir, '01_Literature_Review_Report.pdf'), pdfBuf);
            if (docxBuf) fs.writeFileSync(path.join(bundleDir, '02_Literature_Review_Report.docx'), docxBuf);
            fs.writeFileSync(path.join(bundleDir, '03_Literature_Review_Report.md'), this.generateMarkdown(report), 'utf8');
            fs.writeFileSync(path.join(bundleDir, '04_Literature_Comparison_Matrix.csv'), this.generateComparisonCSV(report), 'utf8');
            fs.writeFileSync(path.join(bundleDir, '05_IEEE_Survey_Manuscript.tex'), this.generateLaTeX(report), 'utf8');
            fs.writeFileSync(path.join(bundleDir, '06_References.bib'), this.generateBibTeX(report), 'utf8');

            // Copy all harvested source PDFs for this report
            const reportIdStr = String(report._id || report.reportId || report.researchReport?.reportId || '');
            const sourcePdfFolder = path.join(institutionalPdfService.STORAGE_ROOT, reportIdStr.replace(/[^a-zA-Z0-9_-]/g, '_'));
            if (reportIdStr && fs.existsSync(sourcePdfFolder)) {
                const pdfFiles = fs.readdirSync(sourcePdfFolder).filter(f => f.endsWith('.pdf'));
                for (const f of pdfFiles) {
                    fs.copyFileSync(path.join(sourcePdfFolder, f), path.join(papersOutDir, f));
                }
            }

            const zipPath = path.join(tmpDir, 'bundle.zip');
            await execFilePromise(ZIP_BIN, ['-r', '-q', zipPath, 'PhD_Literature_Review_Bundle'], { cwd: tmpDir, timeout: 45000 });
            return fs.readFileSync(zipPath);
        } finally {
            try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
        }
    },

    buildHTMLTemplate(report, data, sources) {
        const confidence = data.overallConfidenceScore || report.overallConfidenceScore || 0;
        const summary = data.executiveSummary || {};
        const crossAnalysis = data.crossSourceAnalysis || {};
        const risks = data.riskAssessment || {};
        const confCalc = data.confidenceCalculation || {};
        const matrix = Array.isArray(data.comparisonMatrix) ? data.comparisonMatrix : (Array.isArray(report.comparisonMatrix) ? report.comparisonMatrix : (Array.isArray(report.metadata?.comparisonMatrix) ? report.metadata.comparisonMatrix : []));
        const gaps = Array.isArray(data.phdResearchDirections) ? data.phdResearchDirections : (Array.isArray(report.phdResearchDirections || report.researchGaps) ? (report.phdResearchDirections || report.researchGaps) : []);
        const blueprint = data.searchStrategyBlueprint || report.plan || {};
        const pd = blueprint.problemDeconstruction || {};
        const fullTextCount = sources.filter(s => s.hasFullText).length;

        const reportTitle = data.title || report.researchReport?.title || report.query || 'Untitled Research';

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Georgia', serif;
            font-size: 13.5px;
            line-height: 1.72;
            color: #1a1a1a;
            background: #fff;
        }
        .container { max-width: 740px; margin: 0 auto; padding: 0; }
        .cover-page {
            min-height: 820px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: center;
            border-bottom: 3px solid #000;
            page-break-after: always;
            padding: 50px 20px;
        }
        .cover-institution {
            font-family: Arial, sans-serif;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 4px;
            color: #666;
            margin-bottom: 50px;
        }
        .cover-title {
            font-size: 32px;
            font-weight: 700;
            line-height: 1.25;
            margin-bottom: 18px;
            color: #000;
        }
        .cover-subtitle {
            font-size: 15px;
            color: #555;
            font-style: italic;
            margin-bottom: 14px;
        }
        .cover-query {
            font-size: 12px;
            color: #777;
            font-family: Arial, sans-serif;
            margin-bottom: 45px;
        }
        .cover-meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 20px;
            max-width: 600px;
            margin: 30px auto 0;
            text-align: center;
        }
        .cover-meta-label {
            font-family: Arial, sans-serif;
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #888;
            display: block;
            margin-bottom: 4px;
            font-weight: 700;
        }
        .cover-meta-value {
            font-family: Arial, sans-serif;
            font-size: 13px;
            color: #111;
            font-weight: 700;
        }
        .cover-badges {
            margin-top: 40px;
            display: flex;
            justify-content: center;
            gap: 16px;
        }
        .confidence-badge {
            display: inline-block;
            padding: 9px 20px;
            border: 2px solid #000;
            font-family: Arial, sans-serif;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .section { margin-bottom: 40px; }
        .section-header {
            display: flex;
            align-items: baseline;
            gap: 14px;
            border-bottom: 2px solid #ddd;
            margin-bottom: 20px;
            padding-bottom: 10px;
            margin-top: 40px;
        }
        .section-number {
            font-family: Arial, sans-serif;
            font-size: 28px;
            font-weight: 700;
            color: #ccc;
        }
        .section-title {
            font-size: 20px;
            font-weight: 700;
            flex: 1;
            color: #000;
        }
        .body-text {
            font-size: 13.5px;
            text-align: justify;
            color: #222;
            line-height: 1.78;
        }
        .body-text p { margin-bottom: 12px; }
        .summary-box {
            background: #f8f9fa;
            padding: 24px 28px;
            border-left: 4px solid #000;
            margin-bottom: 35px;
        }
        .summary-overview {
            font-size: 15px;
            font-style: italic;
            line-height: 1.68;
            color: #222;
            margin-bottom: 18px;
        }
        .summary-detail { margin-bottom: 12px; }
        .summary-detail-label {
            font-family: Arial, sans-serif;
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 1.8px;
            color: #777;
            font-weight: 700;
            display: block;
            margin-bottom: 3px;
        }
        .matrix-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-top: 14px;
            margin-bottom: 28px;
        }
        .matrix-table th {
            background: #111;
            color: #fff;
            font-family: Arial, sans-serif;
            text-transform: uppercase;
            font-size: 8.5px;
            letter-spacing: 0.8px;
            padding: 7px 6px;
            text-align: left;
            border: 1px solid #222;
        }
        .matrix-table td {
            padding: 6px;
            border: 1px solid #ddd;
            vertical-align: top;
            line-height: 1.42;
        }
        .matrix-table tr:nth-child(even) { background: #f9f9f9; }
        .gap-card {
            background: #f8f9fa;
            border: 1px solid #e2e8f0;
            border-left: 4px solid #1e40af;
            padding: 14px 18px;
            margin-bottom: 14px;
            page-break-inside: avoid;
        }
        .gap-title {
            font-weight: 700;
            font-size: 13.5px;
            color: #111;
            margin-bottom: 6px;
        }
        .references-section { page-break-before: always; padding-top: 15px; }
        .reference-item {
            margin-bottom: 13px;
            font-size: 11.5px;
            line-height: 1.55;
            padding-left: 28px;
            text-indent: -28px;
        }
        sup {
            font-family: Arial, sans-serif;
            font-weight: 700;
            font-size: 8.5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="cover-page">
            <div class="cover-institution">iMentor PhD Literature Review &amp; Institutional Full-Text Engine</div>
            <h1 class="cover-title">${this.escapeHtml(reportTitle)}</h1>
            <h2 class="cover-subtitle">Systematic Literature Synthesis, Comparison Matrix &amp; Research Gap Analysis</h2>
            ${reportTitle !== report.query ? `<div class="cover-query">Research Query: "${this.escapeHtml(report.query)}"</div>` : ''}
            <div class="cover-meta-grid">
                <div>
                    <span class="cover-meta-label">Published</span>
                    <span class="cover-meta-value">${new Date(report.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
                <div>
                    <span class="cover-meta-label">Sources</span>
                    <span class="cover-meta-value">${sources.length} Cited</span>
                </div>
                <div>
                    <span class="cover-meta-label">Full-Text PDFs</span>
                    <span class="cover-meta-value">${fullTextCount} Parsed</span>
                </div>
                <div>
                    <span class="cover-meta-label">Confidence</span>
                    <span class="cover-meta-value">${confidence}%</span>
                </div>
            </div>
            <div class="cover-badges">
                <div class="confidence-badge">Analytical Confidence: ${confidence}%</div>
            </div>
        </div>

        <div class="section">
            <div class="section-header" style="margin-top: 0;">
                <span class="section-number">I</span>
                <h2 class="section-title">Executive Summary &amp; Problem Deconstruction</h2>
            </div>
            <div class="summary-box">
                <div class="summary-overview">${this.formatCitations(this.escapeHtml(summary.analyticalOverview || 'Analysis complete.'))}</div>
                ${summary.primaryDriver ? `<div class="summary-detail"><span class="summary-detail-label">Primary Methodological / Physical Driver</span><div>${this.formatCitations(this.escapeHtml(summary.primaryDriver))}</div></div>` : ''}
                ${summary.primaryContradiction ? `<div class="summary-detail"><span class="summary-detail-label">Primary Empirical Contradiction / Trade-off</span><div>${this.formatCitations(this.escapeHtml(summary.primaryContradiction))}</div></div>` : ''}
                ${summary.strongestInsight ? `<div class="summary-detail"><span class="summary-detail-label">Decisive Finding</span><div style="font-weight:600;">${this.formatCitations(this.escapeHtml(summary.strongestInsight))}</div></div>` : ''}
                ${pd.corePhenomenonOrSystem ? `<div class="summary-detail" style="margin-top:14px;padding-top:12px;border-top:1px solid #ddd;"><span class="summary-detail-label">Deconstructed Scope &amp; Benchmarks</span><div><strong>System:</strong> ${this.escapeHtml(pd.corePhenomenonOrSystem)} | <strong>Methods:</strong> ${this.escapeHtml(pd.methodologicalFocus || '')} | <strong>Metrics:</strong> ${this.escapeHtml(pd.evaluationMetricsAndDatasets || '')}</div></div>` : ''}
            </div>
        </div>

        ${matrix.length > 0 ? `
        <div class="section">
            <div class="section-header">
                <span class="section-number">II</span>
                <h2 class="section-title">Side-by-Side Literature Comparison Matrix</h2>
            </div>
            <table class="matrix-table">
                <thead>
                    <tr>
                        <th style="width:5%;">Ref</th>
                        <th style="width:20%;">Study &amp; Venue</th>
                        <th style="width:17%;">Core Problem</th>
                        <th style="width:20%;">Methodology / Model</th>
                        <th style="width:19%;">Datasets &amp; Metrics</th>
                        <th style="width:19%;">Limitations &amp; Gaps</th>
                    </tr>
                </thead>
                <tbody>
                    ${matrix.map(r => `
                    <tr>
                        <td><strong>[${r.citationIndex}]</strong>${r.hasFullText ? '<br/><span style="font-size:7.5px;color:#047857;font-weight:700;">PDF</span>' : ''}</td>
                        <td><strong>${this.escapeHtml(r.paperTitle)}</strong><br/><span style="color:#555;">${this.escapeHtml(r.authorsYearVenue)}</span></td>
                        <td>${this.escapeHtml(r.coreProblem)}</td>
                        <td>${this.escapeHtml(r.methodology)}</td>
                        <td><strong>Setup:</strong> ${this.escapeHtml(r.datasetsAndSetup)}<br/><strong>Metrics:</strong> ${this.escapeHtml(r.keyMetrics)}</td>
                        <td>${this.escapeHtml(r.limitationsAndGaps)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        ${(Array.isArray(data.sections) ? data.sections : []).map((section, idx) => `
            <div class="section">
                <div class="section-header">
                    <span class="section-number">${this.toRoman(idx + 3)}</span>
                    <h2 class="section-title">${this.escapeHtml(section.title)}</h2>
                </div>
                <div class="body-text">
                    ${this.formatParagraphs(this.escapeHtml(section.content))}
                </div>
            </div>
        `).join('\n')}

        ${gaps.length > 0 ? `
        <div class="section">
            <div class="section-header">
                <span class="section-number">${this.toRoman((data.sections?.length || 0) + 3)}</span>
                <h2 class="section-title">Open PhD Research Gaps &amp; Thesis Directions</h2>
            </div>
            ${gaps.map((g, i) => `
                <div class="gap-card">
                    <div class="gap-title">Gap ${i + 1}: ${this.escapeHtml(g.gapTitle)}</div>
                    <div style="font-size:12px;margin-bottom:4px;"><strong>Contradiction / Lacuna:</strong> ${this.formatCitations(this.escapeHtml(g.contradictionOrLacuna))}</div>
                    <div style="font-size:12px;margin-bottom:4px;"><strong>Proposed PhD Direction:</strong> ${this.formatCitations(this.escapeHtml(g.proposedPhdDirection))}</div>
                    <div style="font-size:11.5px;color:#444;"><strong>Methodology:</strong> ${this.escapeHtml(g.suggestedMethodology)} | <strong>Target Benchmarks:</strong> ${this.escapeHtml(g.targetDatasetsAndMetrics)}</div>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="references-section">
            <h2 class="section-title" style="border-bottom:2px solid #ddd;padding-bottom:10px;margin-bottom:20px;">Verified Scholarly References (${sources.length})</h2>
            <div>
                ${sources.map((s, i) => {
                    const citNum = s.citationIndex || s.id || (i + 1);
                    const authors = this.formatAuthorsForReference(s.authors);
                    const year = s.year || s.publishedYear || null;
                    const title = s.title || 'Untitled';
                    const publisher = s.journal || s.publisher || s.type || s.sourceType || '';
                    const doi = s.doi || null;
                    const badge = s.hasFullText ? '[Full-Text PDF Parsed]' : (s.isOpenAccess ? '[Open-Access]' : '');
                    return `
                        <div class="reference-item">
                            <strong>[${citNum}]</strong>
                            <span>${this.escapeHtml(authors)}</span>
                            ${year ? ` (${year}).` : '.'}
                            <em> ${this.escapeHtml(title)}.</em>
                            ${publisher ? ` ${this.escapeHtml(publisher)}.` : ''}
                            ${doi ? ` DOI: ${this.escapeHtml(doi)}.` : ''}
                            ${badge ? ` <strong style="font-size:9.5px;color:#047857;">${badge}</strong>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    </div>
</body>
</html>`;
    },

    formatAuthorsForReference(authors) {
        if (!authors || authors.length === 0) return 'Unknown';
        if (authors.length > 3) return `${authors[0]} et al.`;
        return authors.join(', ');
    },

    formatParagraphs(text) {
        if (!text) return "";
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
        if (paragraphs.length <= 1) return `<p>${this.formatCitations(text)}</p>`;
        return paragraphs.map(p => `<p>${this.formatCitations(p.trim())}</p>`).join('\n');
    },

    formatCitations(text) {
        if (!text) return "";
        return text
            .replace(/\[Source (\d+)\]/g, '<sup>[$1]</sup>')
            .replace(/\[(\d+)\]/g, '<sup>[$1]</sup>');
    },

    toRoman(num) {
        const romanNumerals = [['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]];
        let result = '';
        for (const [roman, value] of romanNumerals) {
            while (num >= value) {
                result += roman;
                num -= value;
            }
        }
        return result;
    },

    escapeHtml(text) {
        if (!text || typeof text !== 'string') return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
};

module.exports = pdfExportService;
