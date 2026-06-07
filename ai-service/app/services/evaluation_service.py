import logging
from typing import Dict, Any, List
from ..providers.model_router import ModelRouter

logger = logging.getLogger(__name__)

class EvaluationService:
    def __init__(self):
        self.router = ModelRouter()

    async def evaluate_technical_response(self, question: str, expected_topics: List[str], transcript: str) -> Dict[str, Any]:
        """Evaluates the technical accuracy and depth of a candidate's response."""
        system_prompt = """You are an expert technical interviewer. Evaluate the candidate's answer based on the provided question and expected topics.
Output a JSON object with EXACTLY these keys:
{
  "technicalAccuracy": <int 0-10>,
  "conceptUnderstanding": <int 0-10>,
  "depth": <int 0-10>,
  "practicalKnowledge": <int 0-10>,
  "rubricEvaluations": [
    {
      "topic": "<string: exact expected topic>",
      "covered": <boolean: was it mentioned?>,
      "score": <int 0-10: depth of coverage>,
      "evidence": "<string: brief quote or summary from transcript>"
    }
  ],
  "overallTechnicalScore": <int 0-10>,
  "feedback": "<string: brief explanation>"
}"""
        user_prompt = f"Question: {question}\nExpected Topics (Rubric): {', '.join(expected_topics)}\nCandidate Transcript: {transcript}"
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        return await self.router.evaluate_technical(messages)

    async def evaluate_problem_solving(self, question: str, transcript: str) -> Dict[str, Any]:
        """Evaluates problem solving approach from a candidate's response."""
        system_prompt = """You are an expert technical interviewer evaluating problem solving skills.
Output a JSON object with EXACTLY these keys:
{
  "logicalThinking": <int 0-10>,
  "approach": <int 0-10>,
  "tradeoffs": <int 0-10>,
  "decisionMaking": <int 0-10>,
  "overallProblemSolvingScore": <int 0-10>,
  "feedback": "<string: brief explanation>"
}"""
        user_prompt = f"Question: {question}\nCandidate Transcript: {transcript}"
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        return await self.router.evaluate_problem_solving(messages)

    async def generate_recommendation(self, scores: Dict[str, Any], transcripts: List[str]) -> Dict[str, Any]:
        """Generates a final hiring recommendation based on scores and transcripts."""
        system_prompt = """You are a Principal Recruiter evaluating a candidate's interview performance.
Output a JSON object with EXACTLY these keys:
{
  "recommendation": "<HIRE | MAYBE_HIRE | REJECT>",
  "confidence": <int 0-100>,
  "reasoning": "<string: concise justification>"
}"""
        user_prompt = f"Scores: {scores}\nTranscripts: {' '.join(transcripts)}"
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        return await self.router.generate_recommendation(messages)

    async def generate_final_report(self, scores: Dict[str, Any], recommendation: str, transcripts: List[str]) -> Dict[str, Any]:
        """Generates the final comprehensive interview report for the recruiter."""
        system_prompt = """You are an AI Interview Analyst. Based on the scores, transcripts, and final recommendation, generate a detailed summary report.
Output a JSON object with EXACTLY these keys:
{
  "candidateSummary": "<string: comprehensive summary paragraph>",
  "strengths": ["<string>", "<string>"],
  "weaknesses": ["<string>", "<string>"],
  "improvementAreas": ["<string>", "<string>"],
  "technicalFeedback": "<string: aggregated technical feedback>",
  "communicationFeedback": "<string: aggregated communication feedback>",
  "finalRecommendation": "<HIRE | MAYBE_HIRE | REJECT>"
}"""
        user_prompt = f"Scores: {scores}\nRecommendation: {recommendation}\nTranscripts: {' '.join(transcripts)}"
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        return await self.router.generate_report(messages)
