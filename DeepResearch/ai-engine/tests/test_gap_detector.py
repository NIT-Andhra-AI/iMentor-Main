import pytest
from gap_detector.missing_topics import identify_missing_topics

def test_missing_topics_identification():
    subtopics = ["Quantum Computing", "Deep Learning"]
    sources = [{"snippet": "Deep Learning is a subset of AI"}]
    missing = identify_missing_topics(subtopics, sources)
    assert "Quantum Computing" in missing
    assert "Deep Learning" not in missing
