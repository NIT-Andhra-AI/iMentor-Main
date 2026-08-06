import pytest
from graph.builder import build_research_graph

def test_graph_compilation():
    app = build_research_graph()
    assert app is not None
