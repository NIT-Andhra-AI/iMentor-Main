from typing import Dict, Any
from state import SharedResearchState
from .writer import WriterAgent

async def writer_node(state: SharedResearchState) -> Dict[str, Any]:
    """LangGraph node execution function for Writer Agent."""
    query = state.get("query", "")
    findings = state.get("findings", [])
    sources = state.get("processed_sources", [])
    subtopics = state.get("subtopics", [])
    
    agent = WriterAgent()
    result = await agent.write_report(query, findings, sources, subtopics)
    
    return {
        "draft_report": result.get("draft_report", ""),
        "final_report": result.get("final_report", ""),
        "citations": result.get("citations", []),
        "status": "completed",
        "current_agent": "writer"
    }
