import json
from app.services.openrouter import open_router_client

class InterviewEvaluationService:
    async def evaluate_transcript(self, transcript_text: str, job_role: str, experience_level: str) -> dict:
        system_prompt = f"""
You are an expert HR Technical Recruiter and Engineering Manager. 
You are evaluating a candidate's interview transcript for a {experience_level} {job_role} position.
Based on the transcript provided, score the candidate on:
1. Technical Skills (0-100)
2. Communication Skills (0-100)
3. Problem Solving Skills (0-100)
Provide constructive feedback for each category, and a final Hire/No-Hire recommendation.
You MUST output your response as valid JSON matching this schema:
{{
  "technicalScore": <int>,
  "technicalFeedback": "<string>",
  "communicationScore": <int>,
  "communicationFeedback": "<string>",
  "problemSolvingScore": <int>,
  "problemSolvingFeedback": "<string>",
  "recommendation": "HIRE" | "NO_HIRE"
}}
"""

        try:
            response_text = await open_router_client.get_completion(
                system_prompt=system_prompt,
                user_prompt=f"Here is the candidate's transcript:\n\n{transcript_text}",
                response_format_json=True
            )
            
            # Clean and parse JSON
            cleaned = response_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:-3]
            elif cleaned.startswith("```"):
                cleaned = cleaned[3:-3]
            
            return json.loads(cleaned)
        except Exception as e:
            raise Exception(f"Evaluation failed: {str(e)}")

evaluation_service = InterviewEvaluationService()
