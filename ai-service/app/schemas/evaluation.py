from pydantic import BaseModel, Field
from typing import List, Dict, Any

class TechnicalEvaluationRequest(BaseModel):
    question: str
    expected_topics: List[str]
    transcript: str

class ProblemSolvingRequest(BaseModel):
    question: str
    transcript: str

class RecommendationRequest(BaseModel):
    scores: Dict[str, Any]
    transcripts: List[str]

class ReportRequest(BaseModel):
    scores: Dict[str, Any]
    recommendation: str
    transcripts: List[str]
