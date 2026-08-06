class EmbeddingCache:
    """
    Placeholder class for Embedding cache.
    """
    def __init__(self):
        self.cache = {}

    def get(self, text: str) -> list[float]:
        return self.cache.get(text)

    def set(self, text: str, embedding: list[float]):
        self.cache[text] = embedding
