from typing import Dict, Any, List
from .hallucination import detect_hallucinations
from .citation_check import validate_citations_presence
from .score import compute_verification_score

class VerifierAgent:
    """Verifier Agent cross-references findings against source material."""
    
    async def verify(self, findings: List[Dict[str, Any]], sources: List[Dict[str, Any]]) -> Dict[str, Any]:
        hallucinations = detect_hallucinations(findings, sources)
        validations = validate_citations_presence(findings)
        score = compute_verification_score(hallucinations, findings)
        passed = score >= 0.7
        return {
            "passed": passed,
            "score": score,
            "hallucinations": hallucinations,
            "validations": validations
        }
