"""
DEPRECATED — SGLang utility shim.
SGLang has been fully removed from the project. All LLM inference uses SGLang.
This shim exists for backward compatibility with any Python code still importing sglang_util.
"""

import logging
logger = logging.getLogger(__name__)

# Legacy endpoints — no longer used
SGLANG_ENDPOINTS = []

async def ollama_generate(prompt: str, model: str = "", **kwargs) -> str:
    """No-op: SGLang is removed. Use SGLang via OpenAI-compatible API instead."""
    logger.warning("ollama_generate called but SGLang is removed — returning empty string")
    return ""

def ollama_generate_sync(prompt: str, model: str = "", **kwargs) -> str:
    """No-op: SGLang is removed. Use SGLang via OpenAI-compatible API instead."""
    logger.warning("ollama_generate_sync called but SGLang is removed — returning empty string")
    return ""
