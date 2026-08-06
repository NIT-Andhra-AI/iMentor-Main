from langgraph.graph import StateGraph
from state import SharedResearchState
from .nodes import (
    planner_node,
    search_node,
    gap_detector_node,
    analyzer_node,
    verifier_node,
    writer_node,
)
from .edges import connect_graph_edges

def build_research_graph() -> StateGraph:
    graph = StateGraph(SharedResearchState)
    graph.add_node("planner", planner_node)
    graph.add_node("search", search_node)
    graph.add_node("gap_detector", gap_detector_node)
    graph.add_node("analyzer", analyzer_node)
    graph.add_node("verifier", verifier_node)
    graph.add_node("writer", writer_node)
    
    connect_graph_edges(graph)
    return graph.compile()
