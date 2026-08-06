import pytest
from verifier.hallucination import detect_hallucinations
from verifier.score import compute_verification_score

def test_verifier_functions():
    findings = [{"claim": "AI is fast", "source_url": "https://unknown.com"}]
    sources = [{"url": "https://known.com"}]
    halls = detect_hallucinations(findings, sources)
    assert len(halls) == 1
    score = compute_verification_score(halls, findings)
    assert score == 0.0
