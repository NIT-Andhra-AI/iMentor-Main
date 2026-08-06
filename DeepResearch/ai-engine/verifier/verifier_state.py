from typing import TypedDict, List, Dict, Any

class VerifierState(TypedDict):
    verification_passed: bool
    hallucination_report: List[Dict[str, Any]]
    citation_validations: List[Dict[str, Any]]
