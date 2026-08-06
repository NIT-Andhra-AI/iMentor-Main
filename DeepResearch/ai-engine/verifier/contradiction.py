from typing import List, Dict, Any

def check_contradictions(contradictions: List[Dict[str, Any]]) -> bool:
    # If severe unresolved contradictions exist, flag for retry
    return len(contradictions) > 3
