import json
from typing import Dict, Any

def export_to_json(data: Dict[str, Any]) -> str:
    return json.dumps(data, indent=2)
