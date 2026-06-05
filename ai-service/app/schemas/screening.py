from pydantic import BaseModel, Field
from typing import List, Optional

class ScreeningResult(BaseModel):
    aiScore: int = Field(..., description="Matching score from 0 to 100", ge=0, le=100)
    matchingSkills: List[str] = Field(default=[], description="List of matching skills")
    missingSkills: List[str] = Field(default=[], description="List of missing skills")
    experienceMatch: str = Field(..., description="Explanation of experience alignment")
    educationMatch: str = Field(..., description="Explanation of education alignment")
    screeningSummary: str = Field(..., description="Recruiter-facing candidate summary insights")
    aiRecommendation: str = Field(..., description="Must be one of: Strong Hire, Hire, Needs Review, Reject")

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error: Optional[str] = None
