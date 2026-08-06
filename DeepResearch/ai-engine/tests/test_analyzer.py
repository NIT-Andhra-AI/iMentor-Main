import pytest
from analyzer.confidence import calculate_confidence
from analyzer.summarizer import summarize_sources_text

def test_analyzer_helpers():
    findings = [{"confidence": 0.9}, {"confidence": 0.8}]
    conf = calculate_confidence(findings, num_sources=5)
    assert 0.8 <= conf <= 1.0

    sources = [{"title": "Test Source", "url": "https://test.com", "snippet": "Test snippet text"}]
    summary = summarize_sources_text(sources)
    assert "Test Source" in summary
