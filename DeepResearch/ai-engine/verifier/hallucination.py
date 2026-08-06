from typing import List, Dict, Any

def detect_hallucinations(findings: List[Dict[str, Any]], sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    hallucinations = []
    source_urls = {s.get("url", "") for s in sources}
    for f in findings:
        url = f.get("source_url", "")
        if url and url not in source_urls:
            hallucinations.append({"claim": f.get("claim", ""), "reason": "Unrecognized source URL"})
    return hallucinations
