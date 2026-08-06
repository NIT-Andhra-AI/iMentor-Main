from typing import List, Dict, Any

class ConversationMemory:
    """Stores conversation dialogue turns for interactive research."""
    def __init__(self):
        self.history: List[Dict[str, str]] = []

    def add_message(self, role: str, content: str) -> None:
        self.history.append({"role": role, "content": content})

    def get_messages(self) -> List[Dict[str, str]]:
        return self.history

    def clear(self) -> None:
        self.history = []
