import asyncio
from typing import List, Dict, Any
from tools.tavily_tool import tavily_search
from tools.wikipedia_tool import wikipedia_search
from tools.arxiv_tool import arxiv_search
from .search_filter import filter_low_quality_results
from .search_ranker import rank_search_results

class SearchAgent:
    """Multi-provider Search Agent gathering search results asynchronously."""
    
    async def search_queries(self, queries: List[str]) -> List[Dict[str, Any]]:
        all_results = []
        for q in queries:
            t_res, w_res, a_res = await asyncio.gather(
                tavily_search(q, max_results=3),
                wikipedia_search(q, limit=2),
                arxiv_search(q, max_results=2),
                return_exceptions=True
            )
            if isinstance(t_res, list):
                all_results.extend(t_res)
            if isinstance(w_res, list):
                all_results.extend(w_res)
            if isinstance(a_res, list):
                all_results.extend(a_res)
                
        cleaned = filter_low_quality_results(all_results)
        ranked = rank_search_results(cleaned, query=queries[0] if queries else "")
        return ranked
