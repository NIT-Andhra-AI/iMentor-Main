import asyncio
import logging
from typing import Dict, Any, AsyncGenerator, Optional

from state import SharedResearchState
from events import EngineEvent, EventType
from workflow import create_research_workflow

logger = logging.getLogger("ai_engine.orchestrator")

class ResearchOrchestrator:
    """Main Orchestrator executing the Deep Research agent pipeline."""
    
    def __init__(
        self,
        planner_node: Any,
        search_node: Any,
        gap_node: Any,
        analyzer_node: Any,
        verifier_node: Any,
        writer_node: Any
    ):
        self.app = create_research_workflow(
            planner_node=planner_node,
            search_node=search_node,
            gap_node=gap_node,
            analyzer_node=analyzer_node,
            verifier_node=verifier_node,
            writer_node=writer_node
        )

    async def run(self, session_id: str, query: str, depth: str = "deep") -> SharedResearchState:
        """Execute workflow synchronously to completion."""
        initial_state: SharedResearchState = {
            "session_id": session_id,
            "query": query,
            "depth": depth,
            "raw_sources": [],
            "processed_sources": [],
            "search_queries": [],
            "search_loop_count": 0,
            "gap_loop_count": 0,
            "findings": [],
            "gaps": [],
            "errors": [],
            "status": "started",
            "current_agent": "planner"
        }
        
        logger.info(f"Starting research workflow for session {session_id}")
        final_state = await self.app.ainvoke(initial_state)
        return final_state

    async def stream_events(self, session_id: str, query: str, depth: str = "deep") -> AsyncGenerator[EngineEvent, None]:
        """Stream execution events as agents execute steps."""
        initial_state: SharedResearchState = {
            "session_id": session_id,
            "query": query,
            "depth": depth,
            "raw_sources": [],
            "processed_sources": [],
            "search_queries": [],
            "search_loop_count": 0,
            "gap_loop_count": 0,
            "findings": [],
            "gaps": [],
            "errors": [],
            "status": "started",
            "current_agent": "planner"
        }
        
        yield EngineEvent(
            session_id=session_id,
            event_type=EventType.AGENT_START,
            agent_name="orchestrator",
            message=f"Starting Deep Research for query: '{query}'"
        )

        async for event in self.app.astream(initial_state):
            for node_name, state_update in event.items():
                yield EngineEvent(
                    session_id=session_id,
                    event_type=EventType.AGENT_COMPLETE,
                    agent_name=node_name,
                    message=f"Agent {node_name} completed step.",
                    data={"current_agent": node_name}
                )

        yield EngineEvent(
            session_id=session_id,
            event_type=EventType.WORKFLOW_COMPLETE,
            agent_name="orchestrator",
            message="Research workflow completed successfully."
        )
