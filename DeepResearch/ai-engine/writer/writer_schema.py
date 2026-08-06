from typing import List, Dict, Any
from pydantic import BaseModel, Field

class FinalReportSchema(BaseModel):
    title: str = "Deep Research Report"
    summary: str = ""
    markdown_content: str = ""
    citations: List[Dict[str, Any]] = Field(default_factory=list)
