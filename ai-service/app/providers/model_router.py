import logging
from typing import Dict, Any, List
from .openrouter_provider import OpenRouterProvider

logger = logging.getLogger(__name__)

class ModelRouter:
    """Routes requests through available free models with fallback mechanisms."""
    
    def __init__(self):
        self.provider = OpenRouterProvider()
        # Strategy as defined in Phase 1 constraints:
        # Primary: deepseek/deepseek-v3-base:free
        # Fallback 1: qwen/qwen3-32b:free
        # Fallback 2: openrouter/auto
        self.models = [
            "deepseek/deepseek-v3-base:free",
            "qwen/qwen3-32b:free",
            "openrouter/auto"
        ]

    async def generate_questions(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Generate questions using the defined free model strategy."""
        
        last_exception = None
        for model in self.models:
            try:
                logger.info(f"Attempting to generate questions using model: {model}")
                result = await self.provider.generate_json(messages, model)
                return result
            except Exception as e:
                logger.warning(f"Failed to generate questions with model {model}. Error: {e}")
                last_exception = e
                continue
                
        logger.error("All fallback models exhausted and failed.")
        raise RuntimeError(f"All models failed. Last error: {last_exception}")

    async def _route_with_models(self, messages: List[Dict[str, str]], target_models: List[str]) -> Dict[str, Any]:
        """Generic router for JSON extraction with fallbacks."""
        last_exception = None
        for model in target_models:
            try:
                logger.info(f"Attempting inference using model: {model}")
                return await self.provider.generate_json(messages, model)
            except Exception as e:
                logger.warning(f"Model {model} failed. Error: {e}")
                last_exception = e
                continue
        raise RuntimeError(f"All models failed. Last error: {last_exception}")

    async def evaluate_technical(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        models = [
            "deepseek/deepseek-v4-flash:free",
            "openrouter/auto"
        ]
        return await self._route_with_models(messages, models)

    async def evaluate_problem_solving(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        models = [
            "deepseek/deepseek-v4-flash:free",
            "openrouter/auto"
        ]
        return await self._route_with_models(messages, models)

    async def generate_recommendation(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        models = [
            "meta-llama/llama-3.3-70b:free",
            "openrouter/auto"
        ]
        return await self._route_with_models(messages, models)

    async def generate_report(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        models = [
            "meta-llama/llama-3.3-70b:free",
            "openrouter/auto"
        ]
        return await self._route_with_models(messages, models)

