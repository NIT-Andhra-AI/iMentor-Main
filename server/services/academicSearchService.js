// server/services/academicSearchService.js
const academicSourceService = require('./academicSourceService');

/**
 * Academic Search Service — fetches literature from arXiv and academic sources
 * and formats papers with valid direct URLs into references array.
 */
async function searchAcademic(query, maxResults = 5) {
    try {
        const sources = await academicSourceService.retrieveSources(query, { limit: maxResults });
        const papers = (sources || []).map(paper => {
            const paperId = paper.arxivId || paper.id || paper.doi || '';
            let url = paper.url;
            if (!url || url === '#' || url === 'null') {
                url = paperId.startsWith('http')
                    ? paperId
                    : paperId
                        ? `https://arxiv.org/abs/${paperId}`
                        : `https://arxiv.org/search/?query=${encodeURIComponent(paper.title || query)}&searchtype=all`;
            }
            return {
                id: paperId,
                title: paper.title || 'Untitled Paper',
                source: paper.sourceProvider || paper.source || 'arXiv',
                url: url.startsWith('http') ? url : `https://arxiv.org/abs/${url}`,
                authors: paper.authors || [],
                year: paper.year || paper.publishedYear || 2024,
                abstract: paper.abstract || paper.content || ''
            };
        });

        const references = papers.map((paper, idx) => ({
            number: idx + 1,
            title: paper.title,
            source: paper.source || 'arXiv',
            url: paper.url?.startsWith('http') ? paper.url : `https://arxiv.org/abs/${paper.id || ''}`,
            authors: paper.authors || [],
            year: paper.year || 2024
        }));

        return { papers, references };
    } catch (err) {
        return { papers: [], references: [] };
    }
}

module.exports = {
    searchAcademic
};
