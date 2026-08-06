from typing import TypedDict, List, Dict, Any

class PlannerState(TypedDict):
    query: str
    depth: str
    subtopics: List[str]
    plan: List[Dict[str, Any]]
