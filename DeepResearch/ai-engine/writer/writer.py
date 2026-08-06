from typing import Dict, Any, List
from .markdown_writer import generate_markdown_sections
from .citation_builder import build_citations_list
from .report_formatter import format_full_report

class WriterAgent:
    """Writer Agent compiles final research report in Markdown format with references."""
    
    async def write_report(
        self,
        query: str,
        findings: List[Dict[str, Any]],
        sources: List[Dict[str, Any]],
        subtopics: List[str]
    ) -> Dict[str, Any]:
        citations = build_citations_list(sources)
        body = generate_markdown_sections(query, findings, subtopics)
        full_report = format_full_report(body, citations)
        return {
            "draft_report": body,
            "final_report": full_report,
            "citations": citations
        }
