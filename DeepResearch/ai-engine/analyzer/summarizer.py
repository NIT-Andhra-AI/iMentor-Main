from typing import List, Dict, Any

def summarize_sources_text(sources: List[Dict[str, Any]]) -> str:
    lines = []
    for idx, s in enumerate(sources, 1):
        title = s.get("title", "Untitled")
        url = s.get("url", "")
        snippet = s.get("snippet", "")
        lines.append(f"[{idx}] Source: {title} ({url})\nSnippet: {snippet}\n")
    return "\n".join(lines)
