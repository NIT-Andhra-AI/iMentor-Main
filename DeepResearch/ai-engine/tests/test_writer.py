import pytest
from writer.citation_builder import build_citations_list
from writer.report_formatter import format_full_report

def test_writer_building():
    sources = [{"url": "https://example.com", "title": "Example Source", "snippet": "Snippet text"}]
    citations = build_citations_list(sources)
    assert len(citations) == 1
    assert citations[0]["title"] == "Example Source"

    full = format_full_report("# Test Report", citations)
    assert "Example Source" in full
