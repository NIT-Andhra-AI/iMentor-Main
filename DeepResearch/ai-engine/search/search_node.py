from typing import Dict, Any
from state import SharedResearchState
from .search_agent import SearchAgent
from .source_selector import select_top_sources

async def search_node(state: SharedResearchState) -> Dict[str, Any]:
    """LangGraph node execution function for Search Agent."""
    queries = state.get("search_queries", [state.get("query", "")])
    loop_count = state.get("search_loop_count", 0) + 1
    
    agent = SearchAgent()
    new_results = await agent.search_queries(queries)
    
    existing_sources = state.get("raw_sources", [])
    combined_sources = existing_sources + new_results
    top_sources = select_top_sources(combined_sources, limit=15)
    
    return {
        "raw_sources": top_sources,
        "processed_sources": top_sources,
        "search_loop_count": loop_count,
        "current_agent": "search"
    }
