const log = require('../utils/logger');
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const ResearchCache = require('../models/ResearchCache');
const { authMiddleware } = require('../middleware/authMiddleware');
const pdfExportService = require('../services/pdfExportService');
const institutionalPdfService = require('../services/institutionalPdfService');
const researchSynthesisService = require('../services/researchSynthesisService');

/**
 * GET /api/research/history
 */
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        const history = await ResearchCache.find({ userId })
            .select('query title createdAt overallConfidenceScore onlineSourceCount localSourceCount evidenceProfile')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(history);
    } catch (error) {
        log.error('RESEARCH', `Research history fetch error: ${error.message}`);
        res.status(500).json({ message: "Failed to fetch research history." });
    }
});

/**
 * GET /api/research/:id
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const report = await ResearchCache.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!report) {
            return res.status(404).json({ message: "Research report not found." });
        }

        res.json(report);
    } catch (error) {
        log.error('RESEARCH', `Research report fetch error: ${error.message}`);
        res.status(500).json({ message: "Failed to fetch research report." });
    }
});

/**
 * Shared Multi-Format Export Handler (PDF, DOCX, LaTeX, CSV, Markdown, BibTeX, ZIP Bundle)
 */
async function handleMultiFormatExport(req, res) {
    try {
        const report = await ResearchCache.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: "Research report not found for export." });
        }
        if (String(report.userId) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this report.' });
        }

        const format = String(req.query.format || req.body?.format || 'pdf').toLowerCase();
        const safeBase = `DeepResearch_${String(report.title || report.query || report._id).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 45)}`;

        if (format === 'docx' || format === 'word') {
            const buf = await pdfExportService.generateDocx(report);
            res.writeHead(200, {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${safeBase}.docx"`,
                'Content-Length': buf.length
            });
            return res.end(buf);
        }

        if (format === 'csv' || format === 'matrix') {
            const csv = pdfExportService.generateComparisonCSV(report);
            const buf = Buffer.from(csv, 'utf8');
            res.writeHead(200, {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${safeBase}_Comparison_Matrix.csv"`,
                'Content-Length': buf.length
            });
            return res.end(buf);
        }

        if (format === 'latex' || format === 'tex') {
            const tex = pdfExportService.generateLaTeX(report);
            const buf = Buffer.from(tex, 'utf8');
            res.writeHead(200, {
                'Content-Type': 'application/x-tex; charset=utf-8',
                'Content-Disposition': `attachment; filename="${safeBase}.tex"`,
                'Content-Length': buf.length
            });
            return res.end(buf);
        }

        if (format === 'bib' || format === 'bibtex') {
            const bib = pdfExportService.generateBibTeX(report);
            const buf = Buffer.from(bib, 'utf8');
            res.writeHead(200, {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Disposition': `attachment; filename="${safeBase}_References.bib"`,
                'Content-Length': buf.length
            });
            return res.end(buf);
        }

        if (format === 'md' || format === 'markdown') {
            const md = pdfExportService.generateMarkdown(report);
            const buf = Buffer.from(md, 'utf8');
            res.writeHead(200, {
                'Content-Type': 'text/markdown; charset=utf-8',
                'Content-Disposition': `attachment; filename="${safeBase}.md"`,
                'Content-Length': buf.length
            });
            return res.end(buf);
        }

        if (format === 'zip' || format === 'bundle') {
            const zipBuf = await pdfExportService.generateCompleteZipBundle(report);
            res.writeHead(200, {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${safeBase}_Complete_Bundle.zip"`,
                'Content-Length': zipBuf.length
            });
            return res.end(zipBuf);
        }

        // Default: Academic PDF
        const pdfBuffer = await pdfExportService.generateAcademicPDF(report);
        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${safeBase}.pdf"`,
            'Content-Length': pdfBuffer.length,
            'Content-Transfer-Encoding': 'binary',
            'Cache-Control': 'no-cache'
        });
        return res.end(pdfBuffer);
    } catch (error) {
        log.error('RESEARCH', `Export failure (${req.query.format || 'pdf'}): ${error.message}`);
        return res.status(500).json({ message: `Export generation failed: ${error.message}` });
    }
}

router.post('/:id/export', authMiddleware, handleMultiFormatExport);
router.get('/:id/export', authMiddleware, handleMultiFormatExport);

/**
 * GET /api/research/:id/bundle
 * Download complete PhD Research Bundle (.zip) including PDF, DOCX, LaTeX, BibTeX, CSV Matrix & Source PDFs.
 */
router.get('/:id/bundle', authMiddleware, async (req, res) => {
    req.query.format = 'zip';
    return handleMultiFormatExport(req, res);
});

/**
 * GET /api/research/:id/papers/:citationIndex/pdf
 * Download an individual source paper's harvested full-text PDF.
 */
router.get('/:id/papers/:citationIndex/pdf', authMiddleware, async (req, res) => {
    try {
        const report = await ResearchCache.findById(req.params.id).lean();
        if (!report) {
            return res.status(404).json({ message: 'Research report not found.' });
        }
        if (String(report.userId) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const citNum = Number(req.params.citationIndex);
        const sources = report.researchReport?.sourcesUsed || report.sources || [];
        const src = sources.find(s => Number(s.citationIndex || s.id) === citNum) || sources[citNum - 1];

        const folderPath = path.join(institutionalPdfService.STORAGE_ROOT, String(report._id).replace(/[^a-zA-Z0-9_-]/g, '_'));
        if (fs.existsSync(folderPath)) {
            const files = fs.readdirSync(folderPath);
            const prefix = `Paper_${String(citNum).padStart(2, '0')}_`;
            const matchFile = (src?.localPdfFilename && files.includes(src.localPdfFilename))
                ? src.localPdfFilename
                : files.find(f => f.startsWith(prefix) && f.endsWith('.pdf'));

            if (matchFile) {
                const fullPath = path.join(folderPath, matchFile);
                const buf = fs.readFileSync(fullPath);
                res.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${matchFile}"`,
                    'Content-Length': buf.length
                });
                return res.end(buf);
            }
        }

        // If not stored on disk, redirect to openAccessUrl / pdf_url / DOI
        const redirectUrl = src?.openAccessUrl || src?.pdf_url || (src?.doi ? `https://doi.org/${src.doi}` : src?.url);
        if (redirectUrl) {
            return res.redirect(redirectUrl);
        }

        return res.status(404).json({ message: 'Full-text PDF not available for this citation.' });
    } catch (err) {
        log.error('RESEARCH', `Source PDF download error: ${err.message}`);
        return res.status(500).json({ message: 'Failed to retrieve source PDF.' });
    }
});


/**
 * POST /api/research/:id/ask
 * Post-Report Interactive Grounded Q&A over Harvested Full-Text Corpus
 */
router.post('/:id/ask', authMiddleware, async (req, res) => {
    try {
        const { question } = req.body;
        if (!question || typeof question !== 'string' || question.trim().length < 3) {
            return res.status(400).json({ success: false, message: 'Please provide a valid question.' });
        }

        const report = await ResearchCache.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ success: false, message: 'Research report not found.' });
        }

        const result = await researchSynthesisService.askCorpusFollowUp(report, question.trim(), req.user._id);
        const prevHistory = Array.isArray(report.researchReport?.followUpHistory) ? report.researchReport.followUpHistory : [];
        const newEntry = {
            id: Date.now(),
            question: question.trim(),
            answer: result.answer,
            citedIndices: result.citedIndices,
            createdAt: new Date().toISOString()
        };
        const updatedHistory = [...prevHistory, newEntry];

        if (report.researchReport) {
            report.researchReport = {
                ...report.researchReport,
                followUpHistory: updatedHistory
            };
            report.markModified('researchReport');
            await report.save();
        }

        return res.json({
            success: true,
            answer: result.answer,
            citedIndices: result.citedIndices,
            suggestedFollowUps: result.suggestedFollowUps,
            followUpHistory: updatedHistory
        });
    } catch (err) {
        log.error('RESEARCH', `Corpus Q&A error: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Failed to answer question from corpus.', error: err.message });
    }
});

/**
 * POST /api/research/:id/matrix/custom-column
 * Dynamically extract a user-requested column across all papers in the Comparison Matrix
 */
router.post('/:id/matrix/custom-column', authMiddleware, async (req, res) => {
    try {
        const { columnName, columnDescription = '' } = req.body;
        if (!columnName || typeof columnName !== 'string' || columnName.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Column name is required.' });
        }

        const report = await ResearchCache.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ success: false, message: 'Research report not found.' });
        }

        const result = await researchSynthesisService.extractCustomMatrixColumn(
            report,
            columnName.trim(),
            columnDescription.trim(),
            req.user._id
        );

        if (report.researchReport) {
            report.researchReport = {
                ...report.researchReport,
                comparisonMatrix: result.comparisonMatrix,
                customMatrixColumns: result.customMatrixColumns
            };
            report.markModified('researchReport');
            await report.save();
        }

        return res.json({
            success: true,
            columnKey: result.columnKey,
            columnLabel: result.columnLabel,
            comparisonMatrix: result.comparisonMatrix,
            customMatrixColumns: result.customMatrixColumns
        });
    } catch (err) {
        log.error('RESEARCH', `Custom matrix column error: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Failed to extract custom matrix column.', error: err.message });
    }
});

/**
 * POST /api/research/:id/sections/:sectionIndex/refine
 * Rewrite or expand a specific section of the Literature Review grounded in the full-text corpus
 */
router.post('/:id/sections/:sectionIndex/refine', authMiddleware, async (req, res) => {
    try {
        const sectionIndex = Number(req.params.sectionIndex);
        const { instruction } = req.body;
        if (!instruction || typeof instruction !== 'string' || instruction.trim().length < 3) {
            return res.status(400).json({ success: false, message: 'Refinement instruction is required.' });
        }

        const report = await ResearchCache.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ success: false, message: 'Research report not found.' });
        }

        const result = await researchSynthesisService.refineReportSection(
            report,
            sectionIndex,
            instruction.trim(),
            req.user._id
        );

        if (report.researchReport) {
            report.researchReport = {
                ...report.researchReport,
                sections: result.sections
            };
            report.markModified('researchReport');
            await report.save();
        }

        return res.json({
            success: true,
            sectionIndex,
            section: result.section,
            sections: result.sections
        });
    } catch (err) {
        log.error('RESEARCH', `Section refine error: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Failed to refine section.', error: err.message });
    }
});

module.exports = router;
