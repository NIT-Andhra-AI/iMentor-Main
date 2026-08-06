from typing import Dict, Any, Literal
from langgraph.graph import StateGraph, END, START
from state import SharedResearchState

def create_research_workflow(
    planner_node: Any,
    search_node: Any,
    gap_node: Any,
    analyzer_node: Any,
    verifier_node: Any,
    writer_node: Any,
) -> StateGraph:
    """Build and compile the complete Deep Research LangGraph state workflow graph."""
    
    workflow = StateGraph(SharedResearchState)

    # Add Nodes
    workflow.add_node("planner", planner_node)
    workflow.add_node("search", search_node)
    workflow.add_node("gap_detector", gap_node)
    workflow.add_node("analyzer", analyzer_node)
    workflow.add_node("verifier", verifier_node)
    workflow.add_node("writer", writer_node)

    # Set Entry Point
    workflow.add_edge(START, "planner")
    workflow.add_edge("planner", "search")
    workflow.add_edge("search", "gap_detector")

    # Conditional Routing from Gap Detector
    def route_gap_detector(state: SharedResearchState) -> Literal["search", "analyzer"]:
        gaps = state.get("gaps", [])
        loop_count = state.get("gap_loop_count", 0)
        max_loops = 2
        
        if gaps and loop_count < max_loops:
            return "search"
        return "analyzer"

    workflow.add_conditional_edges(
        "gap_detector",
        route_gap_detector,
        {
            "search": "search",
            "analyzer": "analyzer"
        }
    )

    workflow.add_edge("analyzer", "verifier")

    # Conditional Routing from Verifier
    def route_verifier(state: SharedResearchState) -> Literal["analyzer", "writer"]:
        passed = state.get("verification_passed", True)
        if not passed:
            return "analyzer"
        return "writer"

    workflow.add_conditional_edges(
        "verifier",
        route_verifier,
        {
            "analyzer": "analyzer",
            "writer": "writer"
        }
    )

    workflow.add_edge("writer", END)

    return workflow.compile()
