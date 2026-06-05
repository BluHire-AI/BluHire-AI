from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List
import json
from app.parsers.resume_parser import ResumeParser
from app.screeners.screener import AIScreener
from app.schemas.screening import ScreeningResult

router = APIRouter(prefix="/api/v1/ai")

@router.post("/screen", response_model=ScreeningResult)
async def screen_resume(
    file: UploadFile = File(...),
    job_title: str = Form(...),
    job_description: str = Form(...),
    job_required_skills: str = Form(...),  # Comma-separated or JSON array
    job_experience_required: str = Form(...),
    job_education_required: str = Form(...)
):
    try:
        # 1. Read uploaded file bytes
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        # 2. Parse text content
        resume_text = ResumeParser.parse(file.filename, file_bytes)
        if not resume_text.strip():
            raise HTTPException(
                status_code=400, 
                detail=f"Could not extract parseable text from document '{file.filename}'. Ensure it is a valid PDF or DOCX file."
            )

        # 3. Handle skills lists conversion
        try:
            skills_list = json.loads(job_required_skills)
            if not isinstance(skills_list, list):
                skills_list = [s.strip() for s in str(job_required_skills).split(",") if s.strip()]
        except Exception:
            skills_list = [s.strip() for s in str(job_required_skills).split(",") if s.strip()]

        # 4. Perform AI Screening match comparisons
        result = await AIScreener.screen(
            resume_text=resume_text,
            job_title=job_title,
            job_description=job_description,
            job_required_skills=skills_list,
            job_experience_required=job_experience_required,
            job_education_required=job_education_required
        )
        return result
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    import os
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    has_key = bool(api_key and api_key != "your_openrouter_api_key_here" and api_key != "")
    active_model = os.getenv("OPENROUTER_MODEL", "google/gemma-2-9b-it:free").strip()
    return {
        "status": "healthy",
        "openRouter": has_key,
        "model": active_model
    }
