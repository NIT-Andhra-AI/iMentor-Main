from typing import List, Dict, Any

def generate_bibliography(citations: List[Dict[str, Any]]) -> str:
    lines = ["## References & Bibliography\n"]
    for c in citations:
        lines.append(f"[{c['id']}] **{c['title']}** - [{c['url']}]({c['url']})")
        if c.get("snippet"):
            lines.append(f"> {c['snippet'][:200]}...\n")
    return "\n".join(lines)
