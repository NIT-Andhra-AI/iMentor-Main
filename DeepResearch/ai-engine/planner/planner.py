from typing import Dict, Any
from tools.openai_tool import get_openai_client
from utils.parser import parse_json_from_llm
from .planner_prompt import PLANNER_PROMPT_TEMPLATE
from .planner_validator import validate_plan_dict

class PlannerAgent:
    """Planner Agent decomposes research query into structured subtopics & query plan."""
    def __init__(self):
        self.llm = get_openai_client()

    async def generate_plan(self, query: str, depth: str = "deep") -> Dict[str, Any]:
        prompt = PLANNER_PROMPT_TEMPLATE.format(query=query, depth=depth)
        res = await self.llm.ainvoke(prompt)
        parsed = parse_json_from_llm(res.content)
        if not validate_plan_dict(parsed):
            # Fallback default plan
            parsed = {
                "subtopics": [query],
                "plan": [{"phase": 1, "title": "Overview", "search_queries": [query]}]
            }
        return parsed
