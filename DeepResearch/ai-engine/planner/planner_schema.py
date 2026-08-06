from typing import List, Dict, Any
from pydantic import BaseModel, Field

class SubtopicPlan(BaseModel):
    phase: int
    title: str
    search_queries: List[str]

class ResearchPlanSchema(BaseModel):
    subtopics: List[str] = Field(default_factory=list)
    plan: List[SubtopicPlan] = Field(default_factory=list)
