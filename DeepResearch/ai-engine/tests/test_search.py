import pytest
from search.search_filter import filter_low_quality_results
from search.search_ranker import rank_search_results

def test_search_filter_and_ranker():
    results = [
        {"title": "AI Research", "url": "https://example.com/1", "snippet": "Detailed snippet about AI Deep Research."},
        {"title": "Short", "url": "https://example.com/2", "snippet": "Too short"}
    ]
    filtered = filter_low_quality_results(results, min_length=15)
    assert len(filtered) == 1
    ranked = rank_search_results(filtered, query="AI Research")
    assert ranked[0]["relevance_score"] > 0
