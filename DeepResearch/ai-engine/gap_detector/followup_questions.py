from typing import List, Dict, Any

def generate_followup_queries(gaps: List[Dict[str, Any]]) -> List[str]:
    queries = []
    for g in gaps:
        q = g.get("suggested_query") or g.get("description")
        if q:
            queries.append(q)
    return queries
