from typing import Literal
from state import SharedResearchState

def should_loop_search(state: SharedResearchState) -> Literal["search", "analyzer"]:
    gaps = state.get("gaps", [])
    loop_count = state.get("gap_loop_count", 0)
    if gaps and loop_count < 2:
        return "search"
    return "analyzer"

def should_retry_analyzer(state: SharedResearchState) -> Literal["analyzer", "writer"]:
    passed = state.get("verification_passed", True)
    if not passed:
        return "analyzer"
    return "writer"
