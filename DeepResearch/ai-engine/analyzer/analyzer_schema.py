from typing import List, Dict, Any
from pydantic import BaseModel, Field

class AnalysisReportSchema(BaseModel):
    synthesis: str = ""
    key_findings: List[Dict[str, Any]] = Field(default_factory=list)
    contradictions: List[Dict[str, Any]] = Field(default_factory=list)
    confidence_scores: Dict[str, float] = Field(default_factory=dict)
