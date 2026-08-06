import httpx
import xml.etree.ElementTree as ET
from typing import List, Dict, Any

async def arxiv_search(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
    url = f"http://export.arxiv.org/api/query?search_query=all:{query}&start=0&max_results={max_results}"
    async with httpx.AsyncClient() as client:
        res = await client.get(url, timeout=15.0)
        if res.status_code == 200:
            root = ET.fromstring(res.text)
            ns = {"atom": "http://www.w3.org/2005/Atom"}
            entries = []
            for entry in root.findall("atom:entry", ns):
                title = entry.find("atom:title", ns).text.strip() if entry.find("atom:title", ns) is not None else ""
                summary = entry.find("atom:summary", ns).text.strip() if entry.find("atom:summary", ns) is not None else ""
                id_url = entry.find("atom:id", ns).text.strip() if entry.find("atom:id", ns) is not None else ""
                entries.append({"title": title, "snippet": summary, "url": id_url})
            return entries
    return []
