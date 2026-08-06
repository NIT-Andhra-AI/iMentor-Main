from typing import List, Dict, Any

def normalize_search_item(title: str, url: str, snippet: str, provider: str) -> Dict[str, Any]:
    return {
        "title": title.strip() if title else "Untitled",
        "url": url.strip() if url else "",
        "snippet": snippet.strip() if snippet else "",
        "provider": provider
    }
