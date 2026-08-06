import httpx
from typing import Dict, Any
from config import ai_config

async def firecrawl_scrape(url: str) -> Dict[str, Any]:
    if not ai_config.FIRECRAWL_API_KEY:
        return {"url": url, "content": ""}
    api_url = "https://api.firecrawl.dev/v0/scrape"
    headers = {"Authorization": f"Bearer {ai_config.FIRECRAWL_API_KEY}"}
    payload = {"url": url}
    async with httpx.AsyncClient() as client:
        res = await client.post(api_url, json=payload, headers=headers, timeout=20.0)
        if res.status_code == 200:
            return res.json().get("data", {})
    return {"url": url, "content": ""}
