from typing import Dict, Any
from state import SharedResearchState
from .planner import PlannerAgent
from .planner_utils import extract_all_queries

async def planner_node(state: SharedResearchState) -> Dict[str, Any]:
    """LangGraph node execution function for Planner Agent."""
    query = state.get("query", "")
    depth = state.get("depth", "deep")
    
    agent = PlannerAgent()
    plan_data = await agent.generate_plan(query=query, depth=depth)
    
    queries = extract_all_queries(plan_data.get("plan", []))
    
    return {
        "subtopics": plan_data.get("subtopics", []),
        "plan": plan_data.get("plan", []),
        "search_queries": queries,
        "current_agent": "planner"
    }
