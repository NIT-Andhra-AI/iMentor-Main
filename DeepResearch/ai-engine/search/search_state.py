from typing import TypedDict, List, Dict, Any

class SearchAgentState(TypedDict):
    queries: List[str]
    raw_results: List[Dict[str, Any]]
    filtered_results: List[Dict[str, Any]]
