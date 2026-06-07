import pytest
import os
from typing import List, Dict, Any

from app.services.evaluation_service import EvaluationService
from app.providers.model_router import ModelRouter

# We mock the model router to test the fallback mechanism independently
class MockProvider:
    def __init__(self, fail_first=False):
        self.fail_first = fail_first
        self.attempts = 0

    async def generate_json(self, messages: List[Dict[str, str]], model: str) -> Dict[str, Any]:
        self.attempts += 1
        if self.fail_first and self.attempts == 1:
            raise Exception("Primary model failed due to mock overload")
        
        return {
            "technicalAccuracy": 8,
            "conceptUnderstanding": 9,
            "depth": 7,
            "practicalKnowledge": 8,
            "rubricEvaluations": [
                {
                    "topic": "Decision Trees",
                    "covered": True,
                    "score": 9,
                    "evidence": "Uses multiple decision trees"
                }
            ],
            "overallTechnicalScore": 8,
            "feedback": "Good response.",
            "model_used": model
        }

@pytest.mark.asyncio
async def test_openrouter_fallback():
    # Setup the mock router
    router = ModelRouter()
    mock_provider = MockProvider(fail_first=True)
    router.provider = mock_provider # Inject mock
    
    models_to_try = ["fake-primary-model", "fake-fallback-model"]
    
    result = await router._route_with_models([{"role": "user", "content": "test"}], models_to_try)
    
    # Assert it failed on the first, but succeeded on the second
    assert mock_provider.attempts == 2
    assert result["model_used"] == "fake-fallback-model"

@pytest.mark.asyncio
async def test_technical_evaluation_schema():
    # Setup mock
    service = EvaluationService()
    mock_provider = MockProvider(fail_first=False)
    service.router.provider = mock_provider
    
    result = await service.evaluate_technical_response(
        "Explain Random Forest",
        ["Decision Trees", "Ensemble"],
        "It uses many decision trees."
    )
    
    assert "rubricEvaluations" in result
    assert isinstance(result["rubricEvaluations"], list)
    assert len(result["rubricEvaluations"]) > 0
    assert "topic" in result["rubricEvaluations"][0]
    assert "overallTechnicalScore" in result
    assert result["overallTechnicalScore"] == 8
