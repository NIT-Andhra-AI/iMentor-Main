import os
from typing import List, Dict, Any, Optional
import chromadb
from config import ai_config

class VectorMemory:
    """ChromaDB Persistent Vector Memory Manager."""
    def __init__(self, collection_name: str = "deep_research"):
        self.client = chromadb.PersistentClient(path=ai_config.CHROMA_PERSIST_DIR)
        self.collection = self.client.get_or_create_collection(name=collection_name)

    def add_texts(self, texts: List[str], metadatas: Optional[List[Dict[str, Any]]] = None) -> List[str]:
        ids = [f"id_{i}_{hash(text)}" for i, text in enumerate(texts)]
        self.collection.add(
            documents=texts,
            metadatas=metadatas or [{} for _ in texts],
            ids=ids
        )
        return ids

    def similarity_search(self, query: str, k: int = 4) -> List[Dict[str, Any]]:
        results = self.collection.query(query_texts=[query], n_results=k)
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        
        output = []
        for doc, meta in zip(documents, metadatas):
            output.append({"page_content": doc, "metadata": meta})
        return output
