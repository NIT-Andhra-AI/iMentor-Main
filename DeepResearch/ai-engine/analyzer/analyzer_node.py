from typing import Dict, Any
from state import SharedResearchState
from .analyzer import AnalyzerAgent
from .confidence import calculate_confidence

async def analyzer_node(state: SharedResearchState) -> Dict[str, Any]:
    """LangGraph node execution function for Analyzer Agent."""
    query = state.get("query", "")
    sources = state.get("processed_sources", [])
    
    agent = AnalyzerAgent()
    analysis = await agent.analyze(query, sources)
    
    findings = analysis.get("key_findings", [])
    conf = calculate_confidence(findings, len(sources))
    
    return {
        "findings": findings,
        "contradictions": analysis.get("contradictions", []),
        "confidence_scores": {"overall": conf},
        "current_agent": "analyzer"
    }
