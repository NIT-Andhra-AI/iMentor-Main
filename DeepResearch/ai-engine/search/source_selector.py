from typing import List, Dict, Any

def select_top_sources(results: List[Dict[str, Any]], limit: int = 10) -> List[Dict[str, Any]]:
    return results[:limit]
