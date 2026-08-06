from typing import List
from embeddings.embedding_model import EmbeddingGenerator

async def embed_documents(texts: List[str]) -> List[List[float]]:
    """
    Wrapper function to embed multiple document text strings.
    """
    generator = EmbeddingGenerator()
    return await generator.embed_documents(texts)
