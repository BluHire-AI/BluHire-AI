from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Optional
import json
from app.parsers.resume_parser import ResumeParser
from app.screeners.screener import AIScreener
from app.schemas.screening import ScreeningResult
from app.services.openrouter import open_router_client
from app.services.performance_coach import performance_coach_service

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

@router.post("/chat")
async def chat_completion(payload: dict):
    try:
        messages = payload.get("messages", [])
        tools = payload.get("tools", None)
        tool_choice = payload.get("tool_choice", None)

        result = await open_router_client.get_chat_completion(
            messages=messages,
            tools=tools,
            tool_choice=tool_choice
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/stream")
async def chat_stream(payload: dict):
    try:
        messages = payload.get("messages", [])
        tools = payload.get("tools", None)

        generator = await open_router_client.stream_chat_completion(
            messages=messages,
            tools=tools
        )
        return StreamingResponse(generator, media_type="text/event-stream")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/performance/summary")
async def get_performance_summary(payload: dict):
    try:
        scores = payload.get("scores", {})
        comments = payload.get("comments", "")
        strengths = payload.get("strengths", [])
        weaknesses = payload.get("weaknesses", [])
        
        result = await performance_coach_service.generate_performance_summary(
            scores=scores,
            comments=comments,
            strengths=strengths,
            weaknesses=weaknesses
        )
        return {"summary": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/performance/promotion")
async def get_promotion_recommendation(payload: dict):
    try:
        scores = payload.get("scores", {})
        goal_completion_rate = float(payload.get("goalCompletionRate", 0.0))
        skill_gaps = payload.get("skillGaps", [])
        tenure_months = int(payload.get("tenureMonths", 0))
        leadership_score = float(payload.get("leadershipScore", 5.0))
        
        result = await performance_coach_service.generate_promotion_recommendation(
            scores=scores,
            goal_completion_rate=goal_completion_rate,
            skill_gaps=skill_gaps,
            tenure_months=tenure_months,
            leadership_score=leadership_score
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/performance/skills")
async def get_skill_gap_insights(payload: dict):
    try:
        current_skills = payload.get("currentSkills", [])
        desired_skills = payload.get("desiredSkills", [])
        
        result = await performance_coach_service.generate_skill_gap_insights(
            current_skills=current_skills,
            desired_skills=desired_skills
        )
        return {"insights": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/performance/feedback")
async def get_manager_feedback(payload: dict):
    try:
        manager_name = payload.get("managerName", "Manager")
        team_avg_score = float(payload.get("teamAvgScore", 70.0))
        team_strengths = payload.get("teamStrengths", [])
        growth_areas = payload.get("growthAreas", [])
        
        result = await performance_coach_service.generate_manager_feedback(
            manager_name=manager_name,
            team_avg_score=team_avg_score,
            team_strengths=team_strengths,
            growth_areas=growth_areas
        )
        return {"feedback": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/performance/learning-plan")
async def get_learning_plan(payload: dict):
    try:
        current_skills = payload.get("currentSkills", [])
        desired_skills = payload.get("desiredSkills", [])
        role = payload.get("role", "")
        department = payload.get("department", "")
        
        result = await performance_coach_service.generate_learning_plan(
            current_skills=current_skills,
            desired_skills=desired_skills,
            role=role,
            department=department
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/knowledge/ingest")
async def ingest_knowledge_document(file: UploadFile = File(...)):
    try:
        from app.services.knowledge_ingestion import KnowledgeIngestionService
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        
        chunks = KnowledgeIngestionService.ingest_document(file.filename, file_bytes)
        return {"chunks": chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

@router.post("/knowledge/embed")
async def generate_query_embedding(payload: dict):
    try:
        from app.services.knowledge_ingestion import KnowledgeIngestionService
        text = payload.get("text", "")
        if not text:
            raise HTTPException(status_code=400, detail="Text field is required.")
        
        embeddings = KnowledgeIngestionService.generate_embeddings([text])
        return {"embedding": embeddings[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

@router.post("/knowledge/rag")
async def generate_rag_answer(payload: dict):
    try:
        from app.services.rag_service import RAGService
        query = payload.get("query", "")
        chunks = payload.get("chunks", None)
        is_approved_only = payload.get("isApprovedOnly", False)
        
        if not query:
            raise HTTPException(status_code=400, detail="Query field is required.")
        
        result = await RAGService.generate_rag_answer(query=query, chunks=chunks, is_approved_only=is_approved_only)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG completion failed: {str(e)}")


