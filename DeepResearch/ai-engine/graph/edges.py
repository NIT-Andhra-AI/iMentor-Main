from langgraph.graph import StateGraph, START, END
from state import SharedResearchState
from .transitions import should_loop_search, should_retry_analyzer

def connect_graph_edges(builder: StateGraph) -> StateGraph:
    builder.add_edge(START, "planner")
    builder.add_edge("planner", "search")
    builder.add_edge("search", "gap_detector")
    
    builder.add_conditional_edges(
        "gap_detector",
        should_loop_search,
        {"search": "search", "analyzer": "analyzer"}
    )
    
    builder.add_edge("analyzer", "verifier")
    
    builder.add_conditional_edges(
        "verifier",
        should_retry_analyzer,
        {"analyzer": "analyzer", "writer": "writer"}
    )
    
    builder.add_edge("writer", END)
    return builder
