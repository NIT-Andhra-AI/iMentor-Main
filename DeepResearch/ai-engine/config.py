import os
from typing import Dict, Any, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class AIEngineConfig(BaseSettings):
    """Configuration settings for AI Engine agents and workflows."""
    
    # LLM Settings
    DEFAULT_MODEL: str = Field("gpt-4o", validation_alias="OPENAI_MODEL")
    FAST_MODEL: str = Field("gpt-4o-mini", validation_alias="FAST_OPENAI_MODEL")
    OPENAI_API_KEY: str = Field("", validation_alias="OPENAI_API_KEY")
    MAX_TOKENS: int = 4096
    TEMPERATURE: float = 0.2
    
    # Search Provider Keys
    TAVILY_API_KEY: str = Field("", validation_alias="TAVILY_API_KEY")
    FIRECRAWL_API_KEY: str = Field("", validation_alias="FIRECRAWL_API_KEY")
    SEMANTIC_SCHOLAR_API_KEY: str = Field("", validation_alias="SEMANTIC_SCHOLAR_API_KEY")
    GITHUB_TOKEN: str = Field("", validation_alias="GITHUB_TOKEN")
    
    # RAG & Chroma
    CHROMA_PERSIST_DIR: str = Field("./chroma_db", validation_alias="CHROMA_PERSIST_DIRECTORY")
    EMBEDDING_MODEL: str = Field("text-embedding-3-small", validation_alias="OPENAI_EMBEDDING_MODEL")
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    
    # Workflow Execution Constraints
    MAX_SEARCH_LOOPS: int = 3
    MAX_GAP_ATTEMPTS: int = 2
    STRICT_VERIFICATION: bool = True
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

ai_config = AIEngineConfig()
