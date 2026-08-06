from typing import Dict, Any, List, Optional
from collections import defaultdict

class SharedMemoryManager:
    """Thread-safe context memory manager for research sessions."""
    def __init__(self):
        self._memory: Dict[str, Dict[str, Any]] = defaultdict(dict)

    def set(self, session_id: str, key: str, value: Any) -> None:
        self._memory[session_id][key] = value

    def get(self, session_id: str, key: str, default: Any = None) -> Any:
        return self._memory[session_id].get(key, default)

    def append(self, session_id: str, key: str, value: Any) -> None:
        if key not in self._memory[session_id]:
            self._memory[session_id][key] = []
        if isinstance(self._memory[session_id][key], list):
            self._memory[session_id][key].append(value)

    def clear(self, session_id: str) -> None:
        if session_id in self._memory:
            del self._memory[session_id]

shared_memory = SharedMemoryManager()
