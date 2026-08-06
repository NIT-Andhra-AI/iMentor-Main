from embeddings.embedding_model import EmbeddingGenerator

async def embed_query(query: str) -> list[float]:
    """
    Wrapper function to embed a single query string.
    """
    generator = EmbeddingGenerator()
    return await generator.embed_query(query)
