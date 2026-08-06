from typing import Dict, Any, Callable, Type

class AgentRegistry:
    """Registry for managing and instantiating agent implementations."""
    _registry: Dict[str, Any] = {}

    @classmethod
    def register(cls, name: str):
        def decorator(agent_cls: Type):
            cls._registry[name] = agent_cls
            return agent_cls
        return decorator

    @classmethod
    def get(cls, name: str) -> Any:
        agent_cls = cls._registry.get(name)
        if not agent_cls:
            raise KeyError(f"Agent '{name}' not found in registry.")
        return agent_cls

    @classmethod
    def list_agents(cls) -> List[str]:
        return list(cls._registry.keys())
