from typing import List, Dict, Any
from pydantic import BaseModel, Field

class GapAnalysisSchema(BaseModel):
    gaps: List[Dict[str, Any]] = Field(default_factory=list)
    followup_queries: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
