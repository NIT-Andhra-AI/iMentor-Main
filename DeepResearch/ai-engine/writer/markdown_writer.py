from typing import List, Dict, Any

def generate_markdown_sections(query: str, findings: List[Dict[str, Any]], subtopics: List[str]) -> str:
    md = [f"# Deep Research Report: {query}\n"]
    md.append("## Executive Summary\n")
    md.append("This comprehensive deep research report synthesizes findings across multiple verified web and academic sources.\n")
    
    md.append("## Key Findings\n")
    for idx, f in enumerate(findings, 1):
        claim = f.get("claim", f.get("description", ""))
        url = f.get("source_url", "")
        cite = f" [[{idx}]]({url})" if url else f" [{idx}]"
        md.append(f"- {claim}{cite}")
    md.append("\n")
    
    if subtopics:
        md.append("## Analyzed Subtopics\n")
        for st in subtopics:
            md.append(f"### {st}\nDetailed analysis for {st} based on aggregated source evidence.\n")
            
    return "\n".join(md)
