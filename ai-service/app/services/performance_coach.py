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
        leadership_score: float,
        attendance_rate: float = 95.0,
        tenure_score: float = 100.0,
        skill_score: float = 85.0,
        avg_performance: float = 75.0,
        readiness_score: int = None
    ) -> Dict[str, Any]:
        if readiness_score is None:
            readiness_score = int(round(
                (avg_performance * 0.35) +
                (goal_completion_rate * 0.25) +
                (skill_score * 0.20) +
                (attendance_rate * 0.10) +
                (tenure_score * 0.10)
            ))

        def get_fallback_result(score: int) -> Dict[str, Any]:
            if score >= 90:
                rec_level = "Senior Specialist"
                strengths = ["Technical Architecture", "Leadership & Mentoring", "High Velocity Delivery"]
                summary = (
                    f"Candidate has demonstrated exceptional performance with a promotion readiness score of {score}%. "
                    f"They have achieved high goal completion ({goal_completion_rate:.0f}%) and strong peer review ratings. "
                    f"Immediate promotion is highly recommended."
                )
            elif score >= 75:
                rec_level = "Needs Final Review"
                strengths = ["Collaborative Problem Solving", "Quality Execution"]
                summary = (
                    f"Candidate shows strong readiness ({score}%) but requires final supervisor sign-off. "
                    f"Recommend monitoring next milestone achievements and mentoring through remaining skill gaps: {', '.join(skill_gaps) if skill_gaps else 'None'}."
                )
            elif score >= 50:
                rec_level = "Remain Current Level"
                strengths = ["Consistent Delivery", "Task Ownership"]
                summary = (
                    f"Candidate is currently meeting expectations in their role (Score: {score}%). "
                    f"To qualify for promotion, they should focus on resolving skill gaps ({', '.join(skill_gaps) if skill_gaps else 'None'}) "
                    f"and increasing goal completion rate (currently {goal_completion_rate:.0f}%)."
                )
            else:
                rec_level = "Remain Current Level"
                strengths = ["Basic Execution"]
                summary = (
                    f"Candidate requires significant performance coaching and support (Score: {score}%). "
                    f"Immediate focus should be on goal alignment and technical upskilling."
                )
            return {
                "readinessScore": score,
                "recommendedLevel": rec_level,
                "strengths": strengths,
                "skillGaps": skill_gaps,
                "aiSummary": summary
            }

        system_prompt = (
            "You are an executive talent assessment algorithm. Your job is to output promotion readiness evaluations. "
            "You must output strictly a JSON object containing: "
            f"1. 'readinessScore' (must be exactly the pre-calculated score provided: {readiness_score})\n"
            "2. 'recommendedLevel' (string matching timeline/tier eligibility)\n"
            "3. 'strengths' (list of strings reflecting their actual strengths)\n"
            "4. 'skillGaps' (list of strings matching their current skill gaps)\n"
            "5. 'aiSummary' (Markdown formatted timeline analysis and concrete roadmap recommendations)\n"
        )
        
        user_prompt = f"""
        Evaluate promotion readiness based on these inputs:
        
        - Pre-calculated Readiness Score: {readiness_score}%
        - Core performance scores: {json.dumps(scores)}
        - Goal completion rate: {goal_completion_rate}%
        - Competency skill gaps: {", ".join(skill_gaps)}
        - Company tenure: {tenure_months} months
        - Leadership rating score (1-10): {leadership_score}
        - Attendance rate: {attendance_rate}%
        
        Calculate a final readinessScore matching the pre-calculated score {readiness_score}%.
        Output strictly a JSON object with keys 'readinessScore', 'recommendedLevel', 'strengths', 'skillGaps', and 'aiSummary'.
        """
        
        try:
            raw_result = await open_router_client.get_completion(system_prompt, user_prompt, response_format_json=True)
            try:
                result = json.loads(raw_result)
                if "readinessScore" in result:
                    result["readinessScore"] = int(result["readinessScore"])
                else:
                    result["readinessScore"] = readiness_score
                return result
            except Exception:
                import re
                match = re.search(r"\{.*\}", raw_result, re.DOTALL)
                if match:
                    try:
                        result = json.loads(match.group(0))
                        if "readinessScore" in result:
                            result["readinessScore"] = int(result["readinessScore"])
                        else:
                            result["readinessScore"] = readiness_score
                        return result
                    except Exception:
                        pass
                raise Exception("JSON parsing failed")
        except Exception as err:
            print(f"[PerformanceCoachService] OpenRouter failed, using fallback: {err}")
            return get_fallback_result(readiness_score)

    async def generate_skill_gap_insights(
        self,
        current_skills: List[Dict[str, Any]],
        desired_skills: List[Dict[str, Any]],
        role: str = "Staff",
        department: str = "Engineering"
    ) -> Dict[str, Any]:
        # Determine average current level, desired level, gap score
        gaps = []
        tot_current = 0.0
        tot_desired = 0.0
        tot_gap = 0.0
        count = len(current_skills)
        for i in range(count):
            c_skill = current_skills[i]
            d_skill = desired_skills[i] if i < len(desired_skills) else {}
            c_name = c_skill.get("name") or c_skill.get("skillName") or "Core Skill"
            c_lvl = float(c_skill.get("level") or c_skill.get("currentLevel") or 5.0)
            d_lvl = float(d_skill.get("level") or d_skill.get("desiredLevel") or 8.0)
            gap = max(0.0, d_lvl - c_lvl)
            if gap > 0:
                gaps.append((c_name, gap))
            tot_current += c_lvl
            tot_desired += d_lvl
            tot_gap += gap
        
        avg_current = (tot_current / count) if count > 0 else 5.0
        avg_desired = (tot_desired / count) if count > 0 else 8.0
        avg_gap = (tot_gap / count) if count > 0 else 3.0
        priority = "HIGH" if avg_gap >= 2.0 else "MEDIUM" if avg_gap > 0 else "LOW"

        def get_fallback_insights() -> Dict[str, Any]:
            roadmap = [
                {
                    "duration": "Week 1-2",
                    "milestone": f"Core Foundations in {', '.join([g[0] for g in gaps[:2]]) if gaps else 'Core Skills'}",
                    "activities": [
                        f"Complete fundamental training docs for {gaps[0][0] if gaps else 'core competencies'}.",
                        "Set up local development environments and run baseline tests."
                    ]
                },
                {
                    "duration": "Week 3-4",
                    "milestone": f"Intermediate Application & Practice of {gaps[0][0] if gaps else 'Development Frameworks'}",
                    "activities": [
                        f"Build a miniature feature integration utilizing {gaps[0][0] if gaps else 'core components'}.",
                        "Initiate code discussions with senior peers for initial alignment."
                    ]
                },
                {
                    "duration": "Week 5-6",
                    "milestone": f"Mentored Deliverables & Gap Closures on {', '.join([g[0] for g in gaps[1:3]]) if len(gaps) > 1 else 'Advanced Patterns'}",
                    "activities": [
                        f"Refactor production components to address key gaps in {gaps[1][0] if len(gaps) > 1 else 'advanced patterns'}.",
                        "Participate in full code reviews and review security profiles."
                    ]
                },
                {
                    "duration": "Week 7-8",
                    "milestone": "Capstone Project & Production Verification",
                    "activities": [
                        "Deploy complete project to staging environment.",
                        "Document integration workflow and complete performance check-off."
                    ]
                }
            ]

            resources = [
                {
                    "name": f"Advanced Masterclass: {gaps[0][0] if gaps else 'Software Architecture'}",
                    "hours": 12,
                    "difficulty": "Intermediate"
                }
            ]
            if len(gaps) > 1:
                resources.append({
                    "name": f"Deep Dive: {gaps[1][0]}",
                    "hours": 18,
                    "difficulty": "Advanced"
                })
            else:
                resources.append({
                    "name": f"Enterprise Scaling Practices & Toolkits",
                    "hours": 15,
                    "difficulty": "Advanced"
                })

            return {
                "employeeSummary": {
                    "currentLevel": round(avg_current, 1),
                    "targetLevel": round(avg_desired, 1),
                    "gapScore": round(avg_gap, 1),
                    "priority": priority
                },
                "learningRoadmap": roadmap,
                "recommendedResources": resources,
                "progressTracker": {
                    "currentProgress": 25
                }
            }

        system_prompt = (
            "You are an enterprise technical capability architect. Your task is to evaluate employee skill gap maps "
            "and suggest detailed learning pathways, courses, and project-based experience to close the proficiency gap.\n"
            "You must output strictly a JSON object containing:\n"
            "1. 'employeeSummary': An object with fields: 'currentLevel' (float), 'targetLevel' (float), 'gapScore' (float), 'priority' (string, e.g. 'HIGH', 'MEDIUM', 'LOW')\n"
            "2. 'learningRoadmap': A list of objects representing a weeks-based timeline (e.g. Week 1-2, Week 3-4, Week 5-6, Week 7-8). Each object has fields: 'duration' (string), 'milestone' (string), 'activities' (list of strings)\n"
            "3. 'recommendedResources': A list of objects, each with: 'name' (string), 'hours' (int), 'difficulty' (string matching 'Beginner', 'Intermediate', or 'Advanced')\n"
            "4. 'progressTracker': An object with: 'currentProgress' (int, e.g. 0, 25, 50, 75, 100)\n"
        )
        
        user_prompt = f"""
        Employee details:
        - Current Role: {role}
        - Department: {department}
        
        Employee current skills levels (1-10): {json.dumps(current_skills)}
        Desired designation required levels (1-10): {json.dumps(desired_skills)}
        
        Provide a customized, project-based training plan to close the highlighted gaps. Detail specific certifications, libraries, or concepts to master.
        Output strictly a JSON object matching the requested schema.
        """
        
        try:
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
                raise Exception("JSON parsing failed")
        except Exception as err:
            print(f"[PerformanceCoachService] OpenRouter failed, using fallback: {err}")
            return get_fallback_insights()

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
