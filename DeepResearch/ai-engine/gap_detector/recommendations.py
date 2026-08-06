from typing import List, Dict, Any

def format_recommendations(gaps: List[Dict[str, Any]]) -> List[str]:
    return [f"Investigate: {g.get('description', '')}" for g in gaps]
