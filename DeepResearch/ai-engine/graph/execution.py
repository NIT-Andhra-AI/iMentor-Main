from typing import Dict, Any
from state import SharedResearchState
from .builder import build_research_graph

async def execute_graph(initial_state: SharedResearchState) -> SharedResearchState:
    app = build_research_graph()
    result = await app.ainvoke(initial_state)
    return result
