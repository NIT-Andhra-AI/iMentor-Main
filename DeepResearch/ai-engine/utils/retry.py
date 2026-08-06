import asyncio
import functools
import logging
from typing import Callable, Any

logger = logging.getLogger("ai_engine.retry")

def async_retry(retries: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """Async retry decorator with exponential backoff."""
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            current_delay = delay
            for attempt in range(1, retries + 1):
                try:
                    return await func(*args, **kwargs)
                except Exception as exc:
                    if attempt == retries:
                        logger.error(f"Function {func.__name__} failed after {retries} attempts: {str(exc)}")
                        raise exc
                    logger.warning(f"Function {func.__name__} failed attempt {attempt}/{retries}. Retrying in {current_delay}s... Error: {exc}")
                    await asyncio.sleep(current_delay)
                    current_delay *= backoff
        return wrapper
    return decorator
