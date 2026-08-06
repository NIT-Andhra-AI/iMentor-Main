from typing import List, Dict, Any, Optional, TypedDict
import operator

class SharedResearchState(TypedDict, total=False):
    """LangGraph Shared Research State passed across agent nodes."""
    session_id: str
    query: str
    depth: str
    user_id: Optional[str]
    
    # Planner output
    plan: List[Dict[str, Any]]
    subtopics: List[str]
    
    # Search & Crawling
    raw_sources: List[Dict[str, Any]]
    processed_sources: List[Dict[str, Any]]
    search_queries: List[str]
    search_loop_count: int
    
    # Analysis & Fact-checking
    findings: List[Dict[str, Any]]
    contradictions: List[Dict[str, Any]]
    confidence_scores: Dict[str, float]
    
    # Gap Detector
    gaps: List[Dict[str, Any]]
    followup_questions: List[str]
    gap_loop_count: int
    
    # Verifier
    verification_passed: bool
    hallucination_report: List[Dict[str, Any]]
    citation_validations: List[Dict[str, Any]]
    
    # Writer Output
    draft_report: str
    final_report: str
    citations: List[Dict[str, Any]]
    
    # Meta / Errors
    current_agent: str
    status: str
    errors: List[str]
