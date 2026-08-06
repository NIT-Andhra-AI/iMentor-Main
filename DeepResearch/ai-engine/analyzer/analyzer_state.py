from typing import TypedDict, List, Dict, Any

class AnalyzerState(TypedDict):
    findings: List[Dict[str, Any]]
    contradictions: List[Dict[str, Any]]
    confidence_scores: Dict[str, float]
