from typing import List, Dict, Any

def build_citations_list(sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    citations = []
    seen = set()
    for idx, s in enumerate(sources, 1):
        url = s.get("url", "")
        if url and url not in seen:
            seen.add(url)
            citations.append({
                "id": len(citations) + 1,
                "title": s.get("title", "Untitled Source"),
                "url": url,
                "snippet": s.get("snippet", "")
            })
    return citations
