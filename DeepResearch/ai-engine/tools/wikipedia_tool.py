import httpx
from typing import List, Dict, Any

async def wikipedia_search(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={query}&format=json&utf8=1&srlimit={limit}"
    async with httpx.AsyncClient() as client:
        res = await client.get(url, timeout=15.0)
        if res.status_code == 200:
            search_items = res.json().get("query", {}).get("search", [])
            return [
                {
                    "title": item["title"],
                    "url": f"https://en.wikipedia.org/wiki/{item['title'].replace(' ', '_')}",
                    "snippet": item["snippet"]
                }
                for item in search_items
            ]
    return []
