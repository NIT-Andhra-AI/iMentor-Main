from typing import List, Dict, Any
from .bibliography import generate_bibliography

def format_full_report(markdown_body: str, citations: List[Dict[str, Any]]) -> str:
    bib = generate_bibliography(citations)
    return f"{markdown_body}\n\n{bib}"
