from typing import Dict, Any
from state import SharedResearchState
from .verifier import VerifierAgent

async def verifier_node(state: SharedResearchState) -> Dict[str, Any]:
    """LangGraph node execution function for Verifier Agent."""
    findings = state.get("findings", [])
    sources = state.get("processed_sources", [])
    
    agent = VerifierAgent()
    result = await agent.verify(findings, sources)
    
    return {
        "verification_passed": result.get("passed", True),
        "hallucination_report": result.get("hallucinations", []),
        "citation_validations": result.get("validations", []),
        "current_agent": "verifier"
    }
