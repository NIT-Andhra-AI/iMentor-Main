import httpx
from typing import List, Dict, Any
from config import ai_config

async def tavily_search(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
    if not ai_config.TAVILY_API_KEY:
        return []
    url = "https://api.tavily.com/search"
    payload = {
        "api_key": ai_config.TAVILY_API_KEY,
        "query": query,
        "max_results": max_results
    }
    async with httpx.AsyncClient() as client:
        res = await client.post(url, json=payload, timeout=15.0)
        if res.status_code == 200:
            return res.json().get("results", [])
    return []
