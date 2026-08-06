from typing import Dict, Any, List
from tools.openai_tool import get_openai_client
from utils.parser import parse_json_from_llm
from .analyzer_prompt import ANALYZER_PROMPT_TEMPLATE
from .summarizer import summarize_sources_text

class AnalyzerAgent:
    """Analyzer Agent synthesizes sources and extracts factual findings."""
    def __init__(self):
        self.llm = get_openai_client()

    async def analyze(self, query: str, sources: List[Dict[str, Any]]) -> Dict[str, Any]:
        sources_text = summarize_sources_text(sources)
        prompt = ANALYZER_PROMPT_TEMPLATE.format(query=query, sources_text=sources_text)
        res = await self.llm.ainvoke(prompt)
        parsed = parse_json_from_llm(res.content)
        return parsed
