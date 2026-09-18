from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Optional
import json
import time
from app.parsers.resume_parser import ResumeParser
from app.screeners.screener import AIScreener
from app.schemas.screening import ScreeningResult
from app.services.openrouter import open_router_client
from app.services.performance_coach import performance_coach_service
from app.services.transcription_service import transcription_service

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
        result["resumeLength"] = len(resume_text)
        result["modelUsed"] = open_router_client.default_model
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
        attendance_rate = float(payload.get("attendanceRate", 95.0))
        tenure_score = float(payload.get("tenureScore", 100.0))
        skill_score = float(payload.get("skillScore", 85.0))
        avg_performance = float(payload.get("avgPerformance", 75.0))
        readiness_score = payload.get("readinessScore")
        if readiness_score is not None:
            readiness_score = int(readiness_score)
        
        result = await performance_coach_service.generate_promotion_recommendation(
            scores=scores,
            goal_completion_rate=goal_completion_rate,
            skill_gaps=skill_gaps,
            tenure_months=tenure_months,
            leadership_score=leadership_score,
            attendance_rate=attendance_rate,
            tenure_score=tenure_score,
            skill_score=skill_score,
            avg_performance=avg_performance,
            readiness_score=readiness_score
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/performance/skills")
async def get_skill_gap_insights(payload: dict):
    try:
        current_skills = payload.get("currentSkills", [])
        desired_skills = payload.get("desiredSkills", [])
        role = payload.get("role", "Staff")
        department = payload.get("department", "Engineering")
        
        result = await performance_coach_service.generate_skill_gap_insights(
            current_skills=current_skills,
            desired_skills=desired_skills,
            role=role,
            department=department
        )
        return result
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
    t_start = time.perf_counter()
    try:
        from app.services.knowledge_ingestion import KnowledgeIngestionService
        t_parse = time.perf_counter()
        text = payload.get("text", "")
        if not text:
            raise HTTPException(status_code=400, detail="Text field is required.")
        
        t_model_start = time.perf_counter()
        embeddings = KnowledgeIngestionService.generate_embeddings([text])
        t_model_end = time.perf_counter()
        
        t_end = time.perf_counter()
        print(f"[FASTAPI TIMING /embed] Total: {(t_end - t_start)*1000:.2f} ms | Parse: {(t_model_start - t_start)*1000:.2f} ms | Model: {(t_model_end - t_model_start)*1000:.2f} ms")
        return {"embedding": embeddings[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

@router.post("/knowledge/rag")
async def generate_rag_answer(payload: dict):
    t_start = time.perf_counter()
    try:
        from app.services.rag_service import RAGService
        query = payload.get("query", "")
        chunks = payload.get("chunks", None)
        is_approved_only = payload.get("isApprovedOnly", False)
        t_parsed = time.perf_counter()
        
        if not query:
            raise HTTPException(status_code=400, detail="Query field is required.")
        
        result = await RAGService.generate_rag_answer(query=query, chunks=chunks, is_approved_only=is_approved_only)
        t_end = time.perf_counter()
        print(f"[FASTAPI TIMING /rag] Total: {(t_end - t_start)*1000:.2f} ms | Parse: {(t_parsed - t_start)*1000:.2f} ms | RAG Execution: {(t_end - t_parsed)*1000:.2f} ms")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG completion failed: {str(e)}")
@router.post("/transcribe")
async def transcribe_audio(payload: dict):
    try:
        recording_id = payload.get("recordingId")
        file_path = payload.get("filePath")
        
        if not file_path:
            raise HTTPException(status_code=400, detail="filePath is required")
        
        res = await transcription_service.transcribe(file_path)
        
        return {
            "recordingId": recording_id,
            "success": res.get("success", False),
            "transcript": res.get("transcript", ""),
            "error": res.get("error")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

from app.services.interview_generator import interview_generator_service

@router.post("/interview/plan-competencies")
async def plan_competencies_endpoint(payload: dict):
    try:
        job_data = payload.get("job") or payload
        if not job_data or not job_data.get("title"):
            raise HTTPException(status_code=400, detail="Job data with title is required.")
        plan = await interview_generator_service.plan_competencies(job_data)
        return plan.model_dump()
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Competency planning failed: {str(e)}")

@router.post("/interview/generate-question")
async def generate_question_endpoint(payload: dict):
    try:
        job_data = payload.get("job")
        target_competency = payload.get("targetCompetency")
        experience_level = payload.get("experienceLevel", "Mid-level")
        previous_questions = payload.get("previousQuestions", [])
        previous_answers = payload.get("previousAnswers", [])

        if not job_data or not target_competency:
            raise HTTPException(status_code=400, detail="job and targetCompetency are required.")

        question = await interview_generator_service.generate_question(
            job_data=job_data,
            target_competency=target_competency,
            experience_level=experience_level,
            previous_questions=previous_questions,
            previous_answers=previous_answers
        )
        return question.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")

@router.post("/interview/validate-question")
async def validate_question_endpoint(payload: dict):
    try:
        job_data = payload.get("job")
        question_data = payload.get("question")

        if not job_data or not question_data:
            raise HTTPException(status_code=400, detail="job and question are required.")

        validation = await interview_generator_service.validate_question_semantic(
            job_data=job_data,
            question_data=question_data
        )
        return validation.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question validation failed: {str(e)}")

@router.post("/interview/evaluate")
@router.post("/evaluate")
async def evaluate_transcript_endpoint(payload: dict):
    try:
        transcript_text = payload.get("transcript")
        if not transcript_text:
            raise HTTPException(status_code=400, detail="transcript is required")

        job_data = payload.get("job") or {
            "title": payload.get("jobRole", "Software Engineer"),
            "description": payload.get("jobDescription", ""),
            "requiredSkills": payload.get("requiredSkills", [])
        }
        question_data = payload.get("question") or {
            "question": payload.get("questionText", "Technical assessment question"),
            "competency": payload.get("competency", "Technical Ability"),
            "expectedTopics": payload.get("expectedTopics", [])
        }

        result = await interview_generator_service.evaluate_response(
            job_data=job_data,
            question_data=question_data,
            transcript=transcript_text
        )
        return result.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")
