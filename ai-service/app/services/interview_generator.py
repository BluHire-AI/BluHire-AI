import json
import re
from typing import Dict, Any, List, Optional
from app.services.openrouter import open_router_client
from app.schemas.interview_schemas import (
    CompetencyPlanResponse,
    GeneratedQuestion,
    QuestionValidationResponse,
    EvaluationResponse,
    CompetencyItem,
    DemonstratedCompetency
)

def _clean_json_text(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()

MAX_QUESTION_CHARACTERS = 500

class InterviewGeneratorService:
    async def plan_competencies(self, job_data: Dict[str, Any]) -> CompetencyPlanResponse:
        return await self.generate_competency_plan(job_data)

    async def generate_competency_plan(self, job_data: Dict[str, Any]) -> CompetencyPlanResponse:
        """
        Stage 1: Job Analysis & Competency Planning.
        Analyzes the Job Description and maps out core competencies required for the role.
        """
        system_prompt = """You are an expert HR Technical Recruiter and Job Architect.
Analyze the following Job Description and extract the foundational technical and practical competencies required.

INSTRUCTIONS:
1. Identify 4 to 6 core competencies essential for this specific job role.
2. For each competency, designate importance: 'high', 'medium', or 'low'.
3. List the exact source skills or requirements from the Job Description that substantiate this competency.
4. Do NOT use generic or static fallback competencies. Everything must derive directly from the supplied job.

Return valid JSON matching this schema:
{
  "roleTitle": "<Job Title>",
  "experienceLevel": "<Junior / Mid-level / Senior / Lead>",
  "competencies": [
    {
      "name": "<Competency Name>",
      "importance": "high" | "medium" | "low",
      "sourceSkills": ["<skill 1>", "<skill 2>"]
    }
  ]
}"""
        user_prompt = f"""JOB TITLE: {job_data.get('title')}
JOB DESCRIPTION:
{job_data.get('description')}

REQUIRED SKILLS:
{json.dumps(job_data.get('requiredSkills', []))}

PREFERRED SKILLS:
{json.dumps(job_data.get('preferredSkills', []))}

RESPONSIBILITIES:
{job_data.get('responsibilities')}

EXPERIENCE REQUIRED:
{job_data.get('experienceRequired')}"""

        raw_response = await open_router_client.get_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_format_json=True
        )
        cleaned = _clean_json_text(raw_response)
        parsed = json.loads(cleaned)
        return CompetencyPlanResponse(**parsed)

    async def generate_question(
        self,
        job_data: Dict[str, Any],
        target_competency: Dict[str, Any],
        experience_level: str = "Mid-level",
        previous_questions: List[str] = None,
        previous_answers: List[Dict[str, Any]] = None
    ) -> GeneratedQuestion:
        """
        Stage 2: Competency-Driven Question Generation.
        Generates a concise, spoken-interview friendly question for a specific target competency.
        The candidate answers verbally on video/audio.
        """
        prev_q_str = "\n".join([f"- {q}" for q in (previous_questions or [])]) or "None"
        prev_a_str = ""
        if previous_answers:
            prev_a_str = "\n".join([
                f"- Q: {a.get('questionText')} | Candidate Answer: {a.get('transcript', '')[:250]} | Score: {a.get('score', 'N/A')}"
                for a in previous_answers
            ])
        else:
            prev_a_str = "None (First question)"

        system_prompt = f"""You are a professional, conversational AI technical interviewer conducting a LIVE SPOKEN VIDEO INTERVIEW.

CRITICAL INTERVIEW QUALITY RULES:
1. SPOKEN INTERVIEW FORMAT: The candidate is speaking on video/audio. The question MUST be easily understood when heard once.
2. CONCISE: Keep the question between 100 and 300 characters. STRICT HARD LIMIT: 500 characters. Never exceed 500 characters.
3. NO CODING ASSIGNMENTS: DO NOT generate coding problems, HackerRank/LeetCode assignments, or multi-clause query challenges.
4. NO GIANT SCHEMAS OR DATASETS: NEVER provide database schema definitions with table names and column types (e.g. "table transactions with columns transaction_id INT..."). NEVER dump artificial CSV schemas.
5. VERBAL REASONING: Ask how the candidate approaches a problem, explains a technique, optimizes an architecture, or handles real-world challenges verbally.
   - BAD: "You have a MySQL table transactions with columns (id INT, customer_id INT, amount DECIMAL...). Write a SQL query to..."
   - GOOD: "How would you use SQL to identify high-value customers whose total completed transactions exceed $1,000?"
   - GOOD: "How would you diagnose and optimize a SQL query in production that is running slowly?"
6. BALANCED QUESTION TYPES: Mix question styles across:
   - Conceptual: e.g. "Explain how you would detect and address overfitting in a machine learning model."
   - Practical: e.g. "How would you handle missing values in a messy real-world dataset?"
   - Scenario-based: e.g. "Suppose your model performs well during training but drops sharply in production. How would you investigate it?"
   - Problem-solving / Technical depth: e.g. "How would you choose between precision and recall for an imbalanced fraud detection problem?"
   - Follow-up: When candidate previous answers exist, ask an intelligent follow-up diving deeper into their stated approach.
7. TARGET COMPETENCY: Ground question strictly in competency "{target_competency.get('name')}" and job skills ({json.dumps(target_competency.get('sourceSkills', []))}).
8. NO DUPLICATES: Never repeat or rephrase previous questions:
{prev_q_str}

Return valid JSON matching this schema:
{{
  "question": "<Concise, spoken interview question>",
  "category": "TECHNICAL" | "PROBLEM_SOLVING" | "SYSTEM_DESIGN" | "EXPERIENCE" | "BEHAVIORAL",
  "competency": "{target_competency.get('name')}",
  "difficulty": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
  "reason": "<Concise explanation of why this question validates the competency for this role>",
  "sourceSkill": "<Specific skill or responsibility from the job description>",
  "expectedTopics": ["<concept 1>", "<concept 2>", "<concept 3>"]
}}"""

        user_prompt = f"""JOB TITLE: {job_data.get('title')}
JOB DESCRIPTION:
{job_data.get('description')}

TARGET COMPETENCY:
Name: {target_competency.get('name')}
Importance: {target_competency.get('importance')}
Source Skills: {json.dumps(target_competency.get('sourceSkills', []))}

PREVIOUS INTERVIEW CONTEXT:
Questions already asked:
{prev_q_str}

Candidate responses so far:
{prev_a_str}"""

        for attempt in range(3):
            raw_response = await open_router_client.get_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_format_json=True
            )
            cleaned = _clean_json_text(raw_response)
            parsed = json.loads(cleaned)
            if isinstance(parsed, list) and len(parsed) > 0:
                parsed = parsed[0]
            if "difficulty" in parsed:
                parsed["difficulty"] = str(parsed["difficulty"]).upper()
            if "category" in parsed:
                parsed["category"] = str(parsed["category"]).upper()

            q_text = str(parsed.get("question", "")).strip()
            if len(q_text) <= MAX_QUESTION_CHARACTERS:
                return GeneratedQuestion(**parsed)
            print(f"[InterviewGenerator] Question exceeded {MAX_QUESTION_CHARACTERS} chars ({len(q_text)} chars). Regenerating (attempt {attempt + 1}/3)...")

        # If still over 500 chars after 3 attempts, raise error for controlled handling
        raise ValueError(f"INTERVIEW_QUESTION_GENERATION_FAILED: Generated question exceeded {MAX_QUESTION_CHARACTERS} characters after 3 attempts.")

    async def validate_question_semantic(
        self,
        job_data: Dict[str, Any],
        question_data: Dict[str, Any]
    ) -> QuestionValidationResponse:
        """
        Layer 2: Semantic AI & Quality Validation.
        Validates BOTH:
        A. JOB RELEVANCE: Is the question genuinely relevant to the Job Description?
        B. INTERVIEW QUALITY: Is the question spoken-interview friendly, concise, and suitable for verbal response?
        """
        q_text = str(question_data.get("question", "")).strip()
        if len(q_text) > MAX_QUESTION_CHARACTERS:
            return QuestionValidationResponse(
                valid=False,
                jobRelevance=0.5,
                interviewQuality=0.0,
                relevanceScore=0.5,
                reason=f"Question is too long ({len(q_text)} chars). Maximum allowed is {MAX_QUESTION_CHARACTERS} characters."
            )

        system_prompt = """You are an independent AI QA Auditor for technical interview questions.
Evaluate the proposed question on TWO criteria:
1. JOB RELEVANCE: Is the question genuinely grounded in the supplied Job Description?
2. INTERVIEW QUALITY: Is this question suitable for a spoken video/audio interview?

CRITICAL QUALITY CHECKS:
- REJECT if it reads like a coding assignment, LeetCode prompt, or HackerRank problem.
- REJECT if it defines database schemas with table columns and types (e.g. "table with columns id INT...").
- REJECT if it dumps artificial CSV or JSON specifications.
- REJECT if it requires typing large code blocks rather than verbal explanation.
- REJECT if it is overly verbose, awkward to speak aloud, or contains multiple unrelated questions.
- ACCEPT if it is a concise, conversational question asking how the candidate would approach a problem, choose trade-offs, or apply concepts verbally.

Return valid JSON:
{
  "valid": true | false,
  "jobRelevance": <float between 0.0 and 1.0>,
  "interviewQuality": <float between 0.0 and 1.0>,
  "reason": "<Detailed evaluation explaining whether the question is job-relevant and spoken-interview friendly>"
}"""

        user_prompt = f"""JOB TITLE: {job_data.get('title')}
JOB DESCRIPTION:
{job_data.get('description')}
REQUIRED SKILLS: {json.dumps(job_data.get('requiredSkills', []))}

PROPOSED QUESTION:
Question: {q_text}
Target Competency: {question_data.get('competency')}
Source Skill: {question_data.get('sourceSkill')}
Expected Topics: {json.dumps(question_data.get('expectedTopics', []))}"""

        raw_response = await open_router_client.get_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_format_json=True
        )
        cleaned = _clean_json_text(raw_response)
        parsed = json.loads(cleaned)
        
        job_rel = float(parsed.get("jobRelevance", parsed.get("relevanceScore", 0.8)))
        int_qual = float(parsed.get("interviewQuality", 0.8))
        is_valid = bool(parsed.get("valid", True)) and job_rel >= 0.65 and int_qual >= 0.65

        return QuestionValidationResponse(
            valid=is_valid,
            jobRelevance=job_rel,
            interviewQuality=int_qual,
            relevanceScore=job_rel,
            reason=parsed.get("reason", "Validation complete")
        )

    async def evaluate_response(
        self,
        job_data: Dict[str, Any],
        question_data: Dict[str, Any],
        transcript: str
    ) -> EvaluationResponse:
        """
        Job-Aware Answer Evaluation.
        Evaluates the candidate's transcript against the specific Job, Question,
        Competency, and Expected Topics.
        """
        system_prompt = """You are an expert HR Technical Recruiter and Senior Engineering Manager.
You are evaluating a candidate's actual spoken interview transcript for the specific job and question provided.

STRICT EVALUATION RULES:
1. Evaluate ONLY what the candidate actually said in the transcript.
2. Score how effectively the candidate answered the question and demonstrated the specific target competency.
3. Compare against the expected topics and concepts.
4. If the transcript contains no substantive speech, score 0 and recommend NO_HIRE.
5. Identify which competencies were demonstrated and provide an estimated mastery score (0.0 - 1.0).
6. Provide constructive feedback for Technical, Communication, and Problem Solving.
7. Recommend which competency should be explored next if more questions are needed.

Return valid JSON matching this schema:
{
  "technicalScore": <0-100>,
  "technicalFeedback": "<string>",
  "communicationScore": <0-100>,
  "communicationFeedback": "<string>",
  "problemSolvingScore": <0-100>,
  "problemSolvingFeedback": "<string>",
  "recommendation": "HIRE" | "NO_HIRE" | "MAYBE_HIRE",
  "demonstratedCompetencies": [
    {
      "competency": "<Competency Name>",
      "demonstratedScore": <0.0 - 1.0>,
      "feedback": "<How well candidate proved this competency>"
    }
  ],
  "recommendedNextCompetency": "<Optional suggestion for next competency>",
  "followUpSuggested": "<Optional follow-up question if interesting lead detected>"
}"""

        user_prompt = f"""JOB TITLE: {job_data.get('title')}
JOB DESCRIPTION:
{job_data.get('description')}
REQUIRED SKILLS: {json.dumps(job_data.get('requiredSkills', []))}

QUESTION ASKED:
"{question_data.get('question')}"
TARGET COMPETENCY: {question_data.get('competency')}
EXPECTED TOPICS: {json.dumps(question_data.get('expectedTopics', []))}

CANDIDATE SPOKEN TRANSCRIPT:
"{transcript}" """

        raw_response = await open_router_client.get_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_format_json=True
        )
        cleaned = _clean_json_text(raw_response)
        parsed = json.loads(cleaned)
        if isinstance(parsed, list) and len(parsed) > 0:
            parsed = parsed[0]
        if "recommendation" in parsed:
            raw_rec = str(parsed["recommendation"]).upper()
            if "HIRE" in raw_rec and "NO" not in raw_rec and "MAYBE" not in raw_rec:
                parsed["recommendation"] = "HIRE"
            elif "MAYBE" in raw_rec:
                parsed["recommendation"] = "MAYBE_HIRE"
            else:
                parsed["recommendation"] = "NO_HIRE"
        return EvaluationResponse(**parsed)

interview_generator_service = InterviewGeneratorService()
