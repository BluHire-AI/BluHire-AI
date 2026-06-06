import json
import re
from typing import Dict, Any, List
from app.services.openrouter import open_router_client

class AIScreener:
    @staticmethod
    def clean_json_text(text: str) -> str:
        # Regex to strip markdown code fences if outputted by the model
        match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if match:
            return match.group(1)
        match = re.search(r'(\{.*\})', text, re.DOTALL)
        if match:
            return match.group(1)
        return text.strip()

    @classmethod
    async def screen(
        cls,
        resume_text: str,
        job_title: str,
        job_description: str,
        job_required_skills: List[str],
        job_experience_required: str,
        job_education_required: str
    ) -> Dict[str, Any]:
        
        system_prompt = (
            "You are an expert AI recruiter. You evaluate candidate resumes against job description requirements.\n"
            "You MUST return ONLY a valid JSON object in the exact format shown below. "
            "No formatting, no intro, no wrap, no markdown except a clean JSON payload.\n\n"
            "JSON structure:\n"
            "{\n"
            '  "aiScore": 85,\n'
            '  "matchingSkills": ["SkillA", "SkillB"],\n'
            '  "missingSkills": ["SkillC"],\n'
            '  "experienceMatch": "Comparison explaining alignment with required experience",\n'
            '  "educationMatch": "Comparison explaining alignment with required education",\n'
            '  "screeningSummary": "Executive recruiter-facing candidate evaluation summary highlighting key strengths and concerns",\n'
            '  "aiRecommendation": "One of: Strong Hire, Hire, Needs Review, Reject"\n'
            "}"
        )

        user_prompt = (
            f"--- JOB DETAILS ---\n"
            f"Job Title: {job_title}\n"
            f"Description: {job_description}\n"
            f"Required Skills: {', '.join(job_required_skills)}\n"
            f"Experience Required: {job_experience_required}\n"
            f"Education Required: {job_education_required}\n\n"
            f"--- CANDIDATE RESUME TEXT ---\n"
            f"{resume_text}\n"
        )

        raw_response = await open_router_client.get_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_format_json=True
        )

        cleaned_text = cls.clean_json_text(raw_response)
        
        try:
            parsed = json.loads(cleaned_text)
        except Exception as e:
            raise Exception(f"Failed to parse AI response json. Raw response: {raw_response}. Error: {str(e)}")

        # Validate required fields and assign fallbacks
        ai_score = parsed.get("aiScore")
        try:
            ai_score = int(ai_score)
        except Exception:
            ai_score = 50  # fallback

        matching_skills = parsed.get("matchingSkills", [])
        if not isinstance(matching_skills, list):
            matching_skills = [str(matching_skills)] if matching_skills else []

        missing_skills = parsed.get("missingSkills", [])
        if not isinstance(missing_skills, list):
            missing_skills = [str(missing_skills)] if missing_skills else []

        recs = ["Strong Hire", "Hire", "Needs Review", "Reject"]
        recommendation = parsed.get("aiRecommendation", "Needs Review")
        if recommendation not in recs:
            recommendation = "Needs Review"

        return {
            "aiScore": ai_score,
            "matchingSkills": matching_skills,
            "missingSkills": missing_skills,
            "experienceMatch": parsed.get("experienceMatch", "Evaluation not completed"),
            "educationMatch": parsed.get("educationMatch", "Evaluation not completed"),
            "screeningSummary": parsed.get("screeningSummary", "Evaluation summary not generated"),
            "aiRecommendation": recommendation
        }
