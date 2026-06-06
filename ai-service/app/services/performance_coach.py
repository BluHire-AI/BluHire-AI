import json
from typing import List, Dict, Any
from app.services.openrouter import open_router_client

class PerformanceCoachService:
    async def generate_performance_summary(
        self,
        scores: Dict[str, float],
        comments: str,
        strengths: List[str],
        weaknesses: List[str]
    ) -> str:
        system_prompt = (
            "You are an executive HR Performance Coach. Your task is to analyze employee review ratings "
            "and supervisor notes to construct a concise, professional, and actionable performance summary report. "
            "Focus on highlighting key competencies, immediate growth milestones, and professional development areas."
        )
        
        user_prompt = f"""
        Analyze the following performance evaluation data:
        
        - Score breakdown: {json.dumps(scores)}
        - Supervisor comments: {comments}
        - Core strengths: {", ".join(strengths)}
        - Core growth areas: {", ".join(weaknesses)}
        
        Output a professional 2-3 paragraph performance summary that the manager can share with the employee. Keep it constructive and growth-focused.
        """
        
        return await open_router_client.get_completion(system_prompt, user_prompt)

    async def generate_promotion_recommendation(
        self,
        scores: Dict[str, float],
        goal_completion_rate: float,
        skill_gaps: List[str],
        tenure_months: int,
        leadership_score: float
    ) -> Dict[str, Any]:
        system_prompt = (
            "You are an executive talent assessment algorithm. Your job is to output promotion readiness evaluations. "
            "You must output a JSON object containing: "
            "1. 'readinessScore' (int between 0 and 100 based on input scores, goal completion rate, tenure, and leadership rating)"
            "2. 'recommendedLevel' (string matching timeline/tier eligibility)"
            "3. 'strengths' (list of strings)"
            "4. 'skillGaps' (list of strings of skills needing focus before promotion)"
            "5. 'aiSummary' (Markdown formatted timeline analysis and concrete roadmap recommendations)"
        )
        
        user_prompt = f"""
        Evaluate promotion readiness based on these inputs:
        
        - Core performance scores: {json.dumps(scores)}
        - Goal completion rate: {goal_completion_rate}%
        - Competency skill gaps: {", ".join(skill_gaps)}
        - Company tenure: {tenure_months} months
        - Leadership rating score (1-10): {leadership_score}
        
        Calculate a final readinessScore based on this guidance:
        - 90-100: Promotion Ready (high performance, high goal completion, high tenure)
        - 75-89: Needs Final Review
        - 50-74: Needs Development
        - 0-49: Not Ready
        
        Output strictly a JSON object with keys 'readinessScore', 'recommendedLevel', 'strengths', 'skillGaps', and 'aiSummary'.
        """
        
        raw_result = await open_router_client.get_completion(system_prompt, user_prompt, response_format_json=True)
        try:
            return json.loads(raw_result)
        except Exception:
            # Fallback parsing in case JSON is wrapped in markdown formatting
            import re
            match = re.search(r"\{.*\}", raw_result, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except Exception:
                    pass
            # Structural fallback
            return {
                "readinessScore": 60,
                "recommendedLevel": "Needs Development",
                "strengths": ["Consistent productivity"],
                "skillGaps": skill_gaps,
                "aiSummary": f"AI Parsing Fallback: Employee readiness requires review. Raw assessment details: {raw_result}"
            }

    async def generate_skill_gap_insights(
        self,
        current_skills: List[Dict[str, Any]],
        desired_skills: List[Dict[str, Any]]
    ) -> str:
        system_prompt = (
            "You are an enterprise technical capability architect. Your task is to evaluate employee skill gap maps "
            "and suggest detailed learning pathways, courses, and project-based experience to close the proficiency gap."
        )
        
        user_prompt = f"""
        Employee current skills levels (1-10): {json.dumps(current_skills)}
        Desired designation required levels (1-10): {json.dumps(desired_skills)}
        
        Provide a concise, project-based training plan to close the highlighted gaps. Detail specific certifications, libraries, or concepts to master.
        """
        
        return await open_router_client.get_completion(system_prompt, user_prompt)

    async def generate_manager_feedback(
        self,
        manager_name: str,
        team_avg_score: float,
        team_strengths: List[str],
        growth_areas: List[str]
    ) -> str:
        system_prompt = (
            "You are a leadership coach for corporate managers. Your task is to write constructive, private "
            "manager feedback notes helping them improve team culture, retention, and performance velocity."
        )
        
        user_prompt = f"""
        Provide leadership feedback for manager: {manager_name}
        
        Manager's team metrics:
        - Team average performance score: {team_avg_score}/100
        - Major team strengths: {", ".join(team_strengths)}
        - Major team growth/weakness areas: {", ".join(growth_areas)}
        
        Provide 2-3 paragraphs of coaching advice to help this manager address their team's bottlenecks, improve communication/technical gaps, and run higher-performing teams.
        """
        
        return await open_router_client.get_completion(system_prompt, user_prompt)

    async def generate_learning_plan(
        self,
        current_skills: List[Dict[str, Any]],
        desired_skills: List[Dict[str, Any]],
        role: str,
        department: str
    ) -> Dict[str, Any]:
        system_prompt = (
            "You are an enterprise technical capability architect. Your task is to evaluate employee skill gap maps "
            "and suggest detailed learning pathways and structured courses. "
            "You must output a JSON object containing: "
            "1. 'courses' (a list of objects, where each object has: 'courseName' (string), 'topics' (list of strings), 'duration' (string))"
        )
        
        user_prompt = f"""
        Employee details:
        - Role: {role}
        - Department: {department}
        - Current skills levels (1-10): {json.dumps(current_skills)}
        - Desired skills levels (1-10): {json.dumps(desired_skills)}
        
        Provide a list of structured courses, the key topics they should cover, and recommended durations to close the highlighted gaps.
        Output strictly a JSON object with a single key 'courses'.
        """
        
        raw_result = await open_router_client.get_completion(system_prompt, user_prompt, response_format_json=True)
        try:
            return json.loads(raw_result)
        except Exception:
            import re
            match = re.search(r"\{.*\}", raw_result, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except Exception:
                    pass
            # Structural fallback
            return {
                "courses": [
                  {
                    "courseName": "General Professional Development & Core Skills Training",
                    "topics": [s.get("skillName", "Core Skill") for s in desired_skills if s.get("skillName")],
                    "duration": "4 weeks"
                  }
                ]
            }

performance_coach_service = PerformanceCoachService()
