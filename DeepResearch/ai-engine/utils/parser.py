import json
import re
from typing import Any, Dict, Optional

def parse_json_from_llm(content: str) -> Dict[str, Any]:
    """Parse JSON output from LLM response strings, stripping markdown code fences."""
    if not content:
        return {}
    
    # Strip markdown block quotes ```json ... ```
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', content)
    if match:
        content = match.group(1)
        
    content = content.strip()
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # Fallback regex search for JSON object braces
        obj_match = re.search(r'\{[\s\S]*\}', content)
        if obj_match:
            try:
                return json.loads(obj_match.group(0))
            except json.JSONDecodeError:
                pass
        return {"raw_text": content}
