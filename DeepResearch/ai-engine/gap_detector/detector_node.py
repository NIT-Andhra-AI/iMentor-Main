from typing import Dict, Any
from state import SharedResearchState
from .detector import GapDetectorAgent

async def gap_detector_node(state: SharedResearchState) -> Dict[str, Any]:
    """LangGraph node execution function for Gap Detector Agent."""
    subtopics = state.get("subtopics", [])
    sources = state.get("raw_sources", [])
    loop_count = state.get("gap_loop_count", 0)
    
    agent = GapDetectorAgent()
    res = await agent.detect_gaps(subtopics, sources, loop_count)
    
    followup = res.get("followup_queries", [])
    new_loop = loop_count + 1 if res.get("gaps") else loop_count
    
    return {
        "gaps": res.get("gaps", []),
        "followup_questions": followup,
        "search_queries": followup if followup else state.get("search_queries", []),
        "gap_loop_count": new_loop,
        "current_agent": "gap_detector"
    }
