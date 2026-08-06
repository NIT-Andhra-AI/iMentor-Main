from typing import List, Dict, Any

def filter_low_quality_results(results: List[Dict[str, Any]], min_length: int = 20) -> List[Dict[str, Any]]:
    filtered = []
    seen_urls = set()
    for r in results:
        url = r.get("url", "")
        snippet = r.get("snippet", "")
        if url in seen_urls:
            continue
        if len(snippet) < min_length:
            continue
        seen_urls.add(url)
        filtered.append(r)
    return filtered
