from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any

from app.schemas import (
    TechnicalEvaluationRequest,
    ProblemSolvingRequest,
    RecommendationRequest,
    ReportRequest
)
from app.services.evaluation_service import EvaluationService

router = APIRouter()

# Dependency to get EvaluationService
def get_evaluation_service() -> EvaluationService:
    return EvaluationService()

@router.post("/evaluate/technical", response_model=Dict[str, Any])
async def evaluate_technical(
    request: TechnicalEvaluationRequest,
    service: EvaluationService = Depends(get_evaluation_service)
):
    try:
        result = await service.evaluate_technical_response(
            question=request.question,
            expected_topics=request.expected_topics,
            transcript=request.transcript
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluate/problem-solving", response_model=Dict[str, Any])
async def evaluate_problem_solving(
    request: ProblemSolvingRequest,
    service: EvaluationService = Depends(get_evaluation_service)
):
    try:
        result = await service.evaluate_problem_solving(
            question=request.question,
            transcript=request.transcript
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate/recommendation", response_model=Dict[str, Any])
async def generate_recommendation(
    request: RecommendationRequest,
    service: EvaluationService = Depends(get_evaluation_service)
):
    try:
        result = await service.generate_recommendation(
            scores=request.scores,
            transcripts=request.transcripts
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate/report", response_model=Dict[str, Any])
async def generate_report(
    request: ReportRequest,
    service: EvaluationService = Depends(get_evaluation_service)
):
    try:
        result = await service.generate_final_report(
            scores=request.scores,
            recommendation=request.recommendation,
            transcripts=request.transcripts
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
