from typing import List, Dict, Any

def extract_all_queries(plan: List[Dict[str, Any]]) -> List[str]:
    queries = []
    for item in plan:
        queries.extend(item.get("search_queries", []))
    return list(dict.fromkeys(queries))
