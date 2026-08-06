import pytest
from planner.planner import PlannerAgent
from planner.planner_utils import extract_all_queries

def test_extract_all_queries():
    plan = [
        {"phase": 1, "search_queries": ["query 1", "query 2"]},
        {"phase": 2, "search_queries": ["query 2", "query 3"]}
    ]
    queries = extract_all_queries(plan)
    assert len(queries) == 3
    assert "query 1" in queries
