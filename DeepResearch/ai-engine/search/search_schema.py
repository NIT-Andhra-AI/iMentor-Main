from typing import List, Optional
from pydantic import BaseModel, Field

class SearchResultItem(BaseModel):
    title: str
    url: str
    snippet: str
    source_provider: str = "tavily"
    score: float = 1.0

class SearchQueryBatch(BaseModel):
    queries: List[str] = Field(default_factory=list)
