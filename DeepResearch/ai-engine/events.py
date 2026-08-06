import time
from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field

class EventType(str, Enum):
    AGENT_START = "agent_start"
    AGENT_THOUGHT = "agent_thought"
    AGENT_ACTION = "agent_action"
    AGENT_COMPLETE = "agent_complete"
    SEARCH_QUERY = "search_query"
    SOURCE_DISCOVERED = "source_discovered"
    GAP_DETECTED = "gap_detected"
    VERIFICATION_RESULT = "verification_result"
    REPORT_CHUNK = "report_chunk"
    WORKFLOW_COMPLETE = "workflow_complete"
    ERROR = "error"

class EngineEvent(BaseModel):
    """Structured event model for WebSocket & streaming output."""
    session_id: str
    event_type: EventType
    agent_name: str
    message: str
    data: Dict[str, Any] = Field(default_factory=dict)
    timestamp: float = Field(default_factory=time.time)
