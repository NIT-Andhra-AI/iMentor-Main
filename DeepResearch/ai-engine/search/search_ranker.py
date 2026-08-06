from typing import List, Dict, Any

def rank_search_results(results: List[Dict[str, Any]], query: str) -> List[Dict[str, Any]]:
    """Simple heuristic score-based ranker for search results."""
    query_terms = set(query.lower().split())
    
    for r in results:
        text = (r.get("title", "") + " " + r.get("snippet", "")).lower()
        matches = sum(1 for term in query_terms if term in text)
        r["relevance_score"] = round(matches / max(len(query_terms), 1), 2)
        
    return sorted(results, key=lambda x: x.get("relevance_score", 0), reverse=True)
