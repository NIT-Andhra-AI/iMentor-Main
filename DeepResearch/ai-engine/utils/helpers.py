import re
import uuid
from typing import List, Dict, Any

def generate_id() -> str:
    """Generate a unique string ID."""
    return str(uuid.uuid4())

def clean_text(text: str) -> str:
    """Remove unwanted whitespace and special control characters from text."""
    if not text:
        return ""
    text = re.sub(r'[\r\n\t]+', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def deduplicate_dict_list(items: List[Dict[str, Any]], key: str) -> List[Dict[str, Any]]:
    """Deduplicate a list of dictionaries based on a specific key."""
    seen = set()
    result = []
    for item in items:
        val = item.get(key)
        if val not in seen:
            seen.add(val)
            result.append(item)
    return result
