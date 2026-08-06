from typing import List, Dict, Any

def compute_verification_score(hallucinations: List[Dict[str, Any]], findings: List[Dict[str, Any]]) -> float:
    if not findings:
        return 1.0
    error_rate = len(hallucinations) / len(findings)
    return round(max(1.0 - error_rate, 0.0), 2)
