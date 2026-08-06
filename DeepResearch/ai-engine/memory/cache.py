import time
from typing import Dict, Any, Optional

class CacheMemory:
    """In-memory TTL cache for search queries and scraped results."""
    def __init__(self, default_ttl: int = 3600):
        self._store: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        expiry = time.time() + (ttl or self.default_ttl)
        self._store[key] = {"data": value, "expiry": expiry}

    def get(self, key: str) -> Optional[Any]:
        item = self._store.get(key)
        if not item:
            return None
        if time.time() > item["expiry"]:
            del self._store[key]
            return None
        return item["data"]
