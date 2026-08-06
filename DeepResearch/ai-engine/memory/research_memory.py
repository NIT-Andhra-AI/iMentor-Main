from typing import List, Dict, Any

class ResearchMemory:
    """Manages research session findings, plans, and source snapshots."""
    def __init__(self):
        self.sources: List[Dict[str, Any]] = []
        self.findings: List[Dict[str, Any]] = []

    def add_sources(self, new_sources: List[Dict[str, Any]]) -> None:
        self.sources.extend(new_sources)

    def add_findings(self, new_findings: List[Dict[str, Any]]) -> None:
        self.findings.extend(new_findings)

    def get_context_summary(self) -> Dict[str, Any]:
        return {
            "total_sources": len(self.sources),
            "total_findings": len(self.findings)
        }
