from typing import Dict, Any, List

def validate_state_keys(state: Dict[str, Any], required_keys: List[str]) -> bool:
    """Verify that required state keys exist in dictionary."""
    missing = [k for k in required_keys if k not in state or state[k] is None]
    if missing:
        raise ValueError(f"Missing required state keys: {missing}")
    return True
