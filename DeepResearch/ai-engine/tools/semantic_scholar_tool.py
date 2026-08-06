import httpx
from typing import List, Dict, Any

async def semantic_scholar_search(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    url = f"https://api.semanticscholar.org/graph/v1/paper/search?query={query}&limit={limit}&fields=title,abstract,url,authors,year"
    async with httpx.AsyncClient() as client:
        res = await client.get(url, timeout=15.0)
        if res.status_code == 200:
            return res.json().get("data", [])
    return []
