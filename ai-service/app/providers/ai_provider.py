from abc import ABC, abstractmethod
from typing import Dict, Any, List

class AIProvider(ABC):
    """Abstract base class for all AI providers."""

    @abstractmethod
    async def generate_completion(self, prompt: str, model: str) -> str:
        """Generate a raw text completion."""
        pass
    
    @abstractmethod
    async def generate_json(self, messages: List[Dict[str, str]], model: str) -> Dict[str, Any]:
        """Generate a structured JSON response."""
        pass
