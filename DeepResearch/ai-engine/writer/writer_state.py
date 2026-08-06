from typing import TypedDict, List, Dict, Any

class WriterState(TypedDict):
    draft_report: str
    final_report: str
    citations: List[Dict[str, Any]]
