import logging
from typing import Optional, Any
from langchain_openai import ChatOpenAI
from config import ai_config

logger = logging.getLogger("ai_engine.tools.openai")

def get_openai_client(
    model_name: Optional[str] = None,
    temperature: Optional[float] = None
) -> ChatOpenAI:
    model = model_name or ai_config.DEFAULT_MODEL
    temp = temperature if temperature is not None else ai_config.TEMPERATURE
    return ChatOpenAI(
        model=model,
        temperature=temp,
        api_key=ai_config.OPENAI_API_KEY or "sk-dummy"
    )
