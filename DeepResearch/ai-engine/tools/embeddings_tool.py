from typing import List
from langchain_openai import OpenAIEmbeddings
from config import ai_config

def get_embeddings_model() -> OpenAIEmbeddings:
    return OpenAIEmbeddings(
        model=ai_config.EMBEDDING_MODEL,
        api_key=ai_config.OPENAI_API_KEY or "sk-dummy"
    )
