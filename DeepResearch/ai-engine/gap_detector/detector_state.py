from typing import TypedDict, List, Dict, Any

class GapDetectorState(TypedDict):
    gaps: List[Dict[str, Any]]
    followup_questions: List[str]
    gap_loop_count: int
