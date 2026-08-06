import numpy as np
from typing import List
from langchain_openai import OpenAIEmbeddings

from config import settings
from utils.logger import logger


class EmbeddingGenerator:
    """
    OpenAI Vector Embedding Generator wrapper.
    Generates dense vector representations for text chunks and search queries.
    """

    def __init__(self, model_name: str = None):
        self.api_key = settings.OPENAI_API_KEY
        self.dimension = 1536  # Default for text-embedding-3-small
        if self.api_key:
            self.embeddings = OpenAIEmbeddings(
                model=model_name or settings.OPENAI_EMBEDDING_MODEL,
                api_key=self.api_key
            )
        else:
            self.embeddings = None
            logger.warning("[EmbeddingGenerator] OPENAI_API_KEY not set. Using offline fallback mock embeddings.")

    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        Embed multiple document text strings.
        """
        if not texts:
            return []
        
        if not self.embeddings:
            mock_vecs = []
            for text in texts:
                np.random.seed(sum(ord(c) for c in text) % 2**32)
                vec = np.random.randn(self.dimension).tolist()
                mock_vecs.append(vec)
            return mock_vecs

        logger.info(f"[EmbeddingGenerator] Embedding {len(texts)} text chunks.")
        return await self.embeddings.aembed_documents(texts)

    async def embed_query(self, query: str) -> List[float]:
        """
        Embed a single search query string.
        """
        if not self.embeddings:
            np.random.seed(sum(ord(c) for c in query) % 2**32)
            return np.random.randn(self.dimension).tolist()

        return await self.embeddings.aembed_query(query)

