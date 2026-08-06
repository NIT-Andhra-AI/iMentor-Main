import httpx
from typing import List, Dict, Any

async def openalex_search(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    url = f"https://api.openalex.org/works?search={query}&per_page={limit}"
    async with httpx.AsyncClient() as client:
        res = await client.get(url, timeout=15.0)
        if res.status_code == 200:
            return res.json().get("results", [])
    return []
