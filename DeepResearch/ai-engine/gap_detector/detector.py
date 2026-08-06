from typing import Dict, Any, List
from .missing_topics import identify_missing_topics
from .followup_questions import generate_followup_queries

class GapDetectorAgent:
    """Gap Detector Agent finds unaddressed subtopics and produces followup search queries."""
    
    async def detect_gaps(
        self,
        subtopics: List[str],
        sources: List[Dict[str, Any]],
        current_loop: int
    ) -> Dict[str, Any]:
        if current_loop >= 2:
            return {"gaps": [], "followup_queries": []}
            
        missing = identify_missing_topics(subtopics, sources)
        gaps = [{"description": f"Missing coverage for {st}", "suggested_query": f"{st} research"} for st in missing]
        queries = generate_followup_queries(gaps)
        return {
            "gaps": gaps,
            "followup_queries": queries
        }
