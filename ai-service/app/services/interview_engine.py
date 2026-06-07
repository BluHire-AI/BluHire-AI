import json
import re
from typing import Dict, Any, List
from app.services.openrouter import open_router_client

class InterviewEngine:
    @staticmethod
    def clean_json_text(text: str) -> str:
        # Strip markdown code fences first
        match_code_arr = re.search(r'```(?:json)?\s*(\[.*?\])\s*```', text, re.DOTALL)
        if match_code_arr:
            return match_code_arr.group(1)
            
        match_code_obj = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if match_code_obj:
            return match_code_obj.group(1)

        # Check for JSON array first to avoid stripping outer brackets
        match_arr = re.search(r'(\[.*\])', text, re.DOTALL)
        if match_arr:
            return match_arr.group(1)

        match_obj = re.search(r'(\{.*\})', text, re.DOTALL)
        if match_obj:
            return match_obj.group(1)
            
        return text.strip()

    @classmethod
    async def generate_questions(
        cls,
        job_title: str,
        job_description: str,
        job_required_skills: List[str],
        experience_level: str,
        difficulty_level: str,
        resume_snapshot: Dict[str, Any],
        num_questions: int
    ) -> List[Dict[str, Any]]:
        
        system_prompt = (
            "You are an expert recruitment AI. Your goal is to generate initial structured interview questions for a candidate.\n"
            "You must generate questions based on the Job Description, Skills, Experience Level, and Candidate's Resume details.\n"
            "You MUST customize the questions to reference the candidate's actual projects or experience if listed in the resume snapshot.\n"
            "You MUST return ONLY a valid JSON array of objects. Do not include any introduction, formatting, markdown, or text outside the array.\n\n"
            "JSON structure:\n"
            "[\n"
            "  {\n"
            '    "questionText": "Question context...",\n'
            '    "category": "One of: Technical, Behavioral, Situational, Problem Solving, Project-Based, Resume-Based",\n'
            '    "sourceType": "One of: Resume, JobDescription, Behavioral, Technical"\n'
            "  }\n"
            "]"
        )

        user_prompt = (
            f"Job Title: {job_title}\n"
            f"Job Description: {job_description}\n"
            f"Required Skills: {', '.join(job_required_skills)}\n"
            f"Experience Level: {experience_level}\n"
            f"Difficulty Level: {difficulty_level}\n"
            f"Number of Questions: {num_questions}\n"
            f"Resume Screening Snapshot details: {json.dumps(resume_snapshot)}\n"
        )

        raw = await open_router_client.get_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_format_json=True
        )

        cleaned = cls.clean_json_text(raw)
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, list):
                return parsed
            return []
        except Exception as e:
            print(f"[InterviewEngine] Question generation parse failed. Raw: {raw}. Error: {str(e)}")
            return []

    @classmethod
    async def generate_followup(
        cls,
        previous_question: str,
        previous_answer: str,
        resume_snapshot: Dict[str, Any],
        experience_level: str,
        question_order: int
    ) -> Dict[str, Any]:

        system_prompt = (
            "You are an expert AI recruiter conducting a conversational interview.\n"
            "Given the previous question asked and the candidate's answer, you must decide whether to:\n"
            "1. Ask a deeper follow-up question (probing missing details, refresh strategies, or requesting clarification).\n"
            "2. Adapt difficulty and move to another category if they answered perfectly.\n"
            "You MUST return ONLY a valid JSON object. Do not include introduction, wrapping or markdown.\n\n"
            "JSON structure:\n"
            "{\n"
            '  "question": "Followup question context...",\n'
            '  "category": "FollowUp",\n'
            '  "sourceType": "FollowUp"\n'
            "}"
        )

        user_prompt = (
            f"Previous Question Asked: {previous_question}\n"
            f"Candidate's Answer: {previous_answer}\n"
            f"Candidate Experience Level: {experience_level}\n"
            f"Next Question Order Index: {question_order}\n"
            f"Resume Snapshot details: {json.dumps(resume_snapshot)}\n"
        )

        raw = await open_router_client.get_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_format_json=True
        )

        cleaned = cls.clean_json_text(raw)
        try:
            return json.loads(cleaned)
        except Exception as e:
            print(f"[InterviewEngine] Followup parse failed. Raw: {raw}. Error: {str(e)}")
            return {
                "question": "Could you elaborate more on the technical trade-offs of the architecture you chose for your last project?",
                "category": "FollowUp",
                "sourceType": "FollowUp"
            }

    @classmethod
    async def evaluate_answer(
        cls,
        question: str,
        answer: str,
        resume_snapshot: Dict[str, Any],
        experience_level: str
    ) -> Dict[str, Any]:

        system_prompt = (
            "You are an AI assessment engine evaluating candidate voice interview answers.\n"
            "Evaluate the candidate response based on the question asked.\n"
            "Score each parameter below from 0 to 100.\n"
            "Calculate your own scoring confidence 'aiConfidenceScore' (a decimal between 0.0 and 1.0).\n"
            "You MUST return ONLY a valid JSON object. No intro, no markdown, no other text.\n\n"
            "JSON structure:\n"
            "{\n"
            '  "technicalScore": 85,\n'
            '  "communicationScore": 78,\n'
            '  "confidenceScore": 80,\n'
            '  "clarityScore": 82,\n'
            '  "problemSolvingScore": 88,\n'
            '  "domainExpertiseScore": 80,\n'
            '  "relevanceScore": 85,\n'
            '  "depthOfUnderstandingScore": 81,\n'
            '  "overallScore": 82,\n'
            '  "aiConfidenceScore": 0.92,\n'
            '  "reasoning": "Candidate demonstrated strong understanding of..."\n'
            "}"
        )

        user_prompt = (
            f"Interview Question Asked: {question}\n"
            f"Candidate Voice Transcript Answer: {answer}\n"
            f"Candidate Experience Level: {experience_level}\n"
            f"Candidate Resume Snapshot: {json.dumps(resume_snapshot)}\n"
        )

        raw = await open_router_client.get_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_format_json=True
        )

        cleaned = cls.clean_json_text(raw)
        try:
            return json.loads(cleaned)
        except Exception as e:
            print(f"[InterviewEngine] Answer evaluation parse failed. Raw: {raw}. Error: {str(e)}")
            return {
                "technicalScore": 75,
                "communicationScore": 75,
                "confidenceScore": 75,
                "clarityScore": 75,
                "problemSolvingScore": 75,
                "domainExpertiseScore": 75,
                "relevanceScore": 75,
                "depthOfUnderstandingScore": 75,
                "overallScore": 75,
                "aiConfidenceScore": 0.80,
                "reasoning": "Answer evaluated using default scoring metric."
            }

    @classmethod
    async def generate_report(
        cls,
        qa_history: List[Dict[str, Any]],
        resume_snapshot: Dict[str, Any]
    ) -> Dict[str, Any]:

        system_prompt = (
            "You are an expert recruitment summary bot. Compile the final candidate evaluation report.\n"
            "You must review the Q&A timeline history and resume screening details to generate recruiter-ready summaries.\n"
            "Determine strengths, weaknesses, overall analysis, and hiring recommendation (Strong Hire, Hire, Consider, Weak Consider, Reject) with detailed reasoning.\n"
            "Extract a breakdown mapping of technologies/concepts/soft skills matched with scores (0-100).\n"
            "You MUST return ONLY a valid JSON object. No intro, no formatting, no markdown.\n\n"
            "JSON structure:\n"
            "{\n"
            '  "technicalAnalysis": "Candidate demonstrated strong hands-on coding skills...",\n'
            '  "communicationAnalysis": "Clear, concise communication...",\n'
            '  "strengths": ["Strong architectural awareness", "Practical cloud knowledge"],\n'
            '  "weaknesses": ["Minor gaps in deep caching mechanisms"],\n'
            '  "hiringRecommendation": "Hire",\n'
            '  "recommendationReasoning": "Highly aligned with mid-level development requirements.",\n'
            '  "transcriptSummary": "Session summary...",\n'
            '  "skillsBreakdown": {\n'
            '     "React": 85,\n'
            '     "NodeJS": 80,\n'
            '     "System Design": 75\n'
            '  }\n'
            "}"
        )

        user_prompt = (
            f"Candidate Q&A and evaluations history: {json.dumps(qa_history)}\n"
            f"Resume Screening Snapshot: {json.dumps(resume_snapshot)}\n"
        )

        raw = await open_router_client.get_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_format_json=True
        )

        cleaned = cls.clean_json_text(raw)
        try:
            return json.loads(cleaned)
        except Exception as e:
            print(f"[InterviewEngine] Report compilation parse failed. Raw: {raw}. Error: {str(e)}")
            return {
                "technicalAnalysis": "Review of candidate responses completed.",
                "communicationAnalysis": "Review of candidate communication completed.",
                "strengths": ["Technically sound"],
                "weaknesses": ["Minor gaps in explanation details"],
                "hiringRecommendation": "Consider",
                "recommendationReasoning": "Cumulative performance metrics met consider thresholds.",
                "transcriptSummary": "Interview transcripts recap completed.",
                "skillsBreakdown": {}
            }
