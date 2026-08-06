from typing import List, Dict, Any

def format_prompt(template: str, **kwargs) -> str:
    """Safely format prompt template string with key-value kwargs."""
    return template.format(**kwargs)

def format_search_results(results: List[Dict[str, Any]]) -> str:
    """Format search result items into LLM context snippet string."""
    formatted = []
    for idx, r in enumerate(results, 1):
        title = r.get("title", "Untitled")
        url = r.get("url", "#")
        snippet = r.get("snippet", r.get("content", ""))
        formatted.append(f"[{idx}] Source: {title}\nURL: {url}\nSnippet: {snippet}\n")
    return "\n".join(formatted)
