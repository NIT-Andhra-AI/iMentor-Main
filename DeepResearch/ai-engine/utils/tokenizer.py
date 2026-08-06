from typing import Optional

def count_tokens(text: str, model: str = "gpt-4o") -> int:
    """Estimate token count for text."""
    if not text:
        return 0
    try:
        import tiktoken
        encoding = tiktoken.encoding_for_model(model)
        return len(encoding.encode(text))
    except Exception:
        # Approximate fallback ~4 chars per token
        return len(text) // 4
