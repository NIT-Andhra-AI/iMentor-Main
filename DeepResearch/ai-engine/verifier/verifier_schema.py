from typing import List, Dict, Any
from pydantic import BaseModel, Field

class VerificationReportSchema(BaseModel):
    passed: bool = True
    score: float = 1.0
    hallucinations: List[Dict[str, Any]] = Field(default_factory=list)
    missing_citations: List[str] = Field(default_factory=list)
