from pydantic import BaseModel, Field
from typing import List, Optional

class CompetencyItem(BaseModel):
    name: str = Field(..., description="Name of the core competency, e.g. Machine Learning, ROS, SQL")
    importance: str = Field("high", description="Importance level: high, medium, low")
    sourceSkills: List[str] = Field(default_factory=list, description="Skills explicitly listed in the job that feed into this competency")

class CompetencyPlanResponse(BaseModel):
    roleTitle: Optional[str] = ""
    experienceLevel: Optional[str] = ""
    competencies: List[CompetencyItem] = Field(default_factory=list)

class GeneratedQuestion(BaseModel):
    question: str = Field(..., description="The interview question text")
    category: str = Field("TECHNICAL", description="Category: TECHNICAL, PROBLEM_SOLVING, SYSTEM_DESIGN, EXPERIENCE, BEHAVIORAL")
    competency: str = Field(..., description="The specific competency being evaluated")
    difficulty: str = Field("INTERMEDIATE", description="Difficulty: BEGINNER, INTERMEDIATE, ADVANCED")
    reason: str = Field(..., description="Why this question evaluates the competency for this specific job")
    sourceSkill: str = Field(..., description="Skill or responsibility from the job description this derives from")
    expectedTopics: List[str] = Field(default_factory=list, description="Key concepts or keywords expected in a competent answer")

class QuestionValidationResponse(BaseModel):
    valid: bool
    jobRelevance: float = Field(default=0.85, ge=0.0, le=1.0)
    interviewQuality: float = Field(default=0.85, ge=0.0, le=1.0)
    relevanceScore: Optional[float] = None
    reason: str

class DemonstratedCompetency(BaseModel):
    competency: str
    demonstratedScore: float = Field(default=0.8, ge=0.0, le=1.0)
    feedback: str = ""

class EvaluationResponse(BaseModel):
    technicalScore: int = Field(default=70, ge=0, le=100)
    technicalFeedback: str = ""
    communicationScore: int = Field(default=70, ge=0, le=100)
    communicationFeedback: str = ""
    problemSolvingScore: int = Field(default=70, ge=0, le=100)
    problemSolvingFeedback: str = ""
    recommendation: str = Field("MAYBE_HIRE", description="HIRE, NO_HIRE, MAYBE_HIRE")
    demonstratedCompetencies: List[DemonstratedCompetency] = Field(default_factory=list)
    recommendedNextCompetency: Optional[str] = None
    followUpSuggested: Optional[str] = None
