from typing import Dict, Any

def validate_plan_dict(data: Dict[str, Any]) -> bool:
    if "subtopics" not in data or "plan" not in data:
        return False
    if not isinstance(data["subtopics"], list) or not isinstance(data["plan"], list):
        return False
    return True
