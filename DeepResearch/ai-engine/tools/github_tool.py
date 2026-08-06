import httpx
from typing import List, Dict, Any
from config import ai_config

async def github_search(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    url = f"https://api.github.com/search/repositories?q={query}&per_page={limit}"
    headers = {"Accept": "application/vnd.github.v3+json"}
    if ai_config.GITHUB_TOKEN:
        headers["Authorization"] = f"token {ai_config.GITHUB_TOKEN}"
        
    async with httpx.AsyncClient() as client:
        res = await client.get(url, headers=headers, timeout=15.0)
        if res.status_code == 200:
            items = res.json().get("items", [])
            return [
                {
                    "title": item["full_name"],
                    "url": item["html_url"],
                    "snippet": item.get("description", "") or "",
                    "stars": item.get("stargazers_count", 0)
                }
                for item in items
            ]
    return []
