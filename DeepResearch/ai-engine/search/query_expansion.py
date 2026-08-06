from typing import List
from tools.openai_tool import get_openai_client
from utils.parser import parse_json_from_llm

async def expand_queries(base_query: str) -> List[str]:
    llm = get_openai_client()
    prompt = f"Generate 3 diverse search query variations for: '{base_query}'. Return JSON: {{\"queries\": [\"...\"]}}"
    try:
        res = await llm.ainvoke(prompt)
        parsed = parse_json_from_llm(res.content)
        queries = parsed.get("queries", [])
        if queries:
            return queries
    except Exception:
        pass
    return [base_query]
