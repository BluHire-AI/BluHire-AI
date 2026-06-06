import mongoose from 'mongoose';
import { SkillAssessment } from '../../../models/SkillAssessment';
import Employee from '../../../models/Employee';
import Department from '../../../models/Department';
import Designation from '../../../models/Designation';

export class PerformanceLearningService {
  private aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1/ai';

  async getLearningPlan(employeeId: string) {
    const employee = await Employee.findById(employeeId);
    if (!employee || employee.isDeleted) {
      throw new Error('Employee not found');
    }

    const dept = await Department.findById(employee.departmentId);
    const desig = await Designation.findById(employee.designationId);

    const assessments = await SkillAssessment.find({ employeeId: new mongoose.Types.ObjectId(employeeId) });

    const currentSkills = assessments.map(a => ({
      skillName: a.skillName,
      currentLevel: a.currentLevel
    }));

    const desiredSkills = assessments.map(a => ({
      skillName: a.skillName,
      desiredLevel: a.desiredLevel
    }));

    const roleName = desig ? desig.title : 'Software Developer';
    const deptName = dept ? dept.name : 'Engineering';

    try {
      const response = await fetch(`${this.aiServiceUrl}/performance/learning-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSkills,
          desiredSkills,
          role: roleName,
          department: deptName
        })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('[PerformanceLearningService] Failed to fetch learning plan:', error);
    }

    // Fallback if AI service fails or is offline
    return {
      courses: [
        {
          courseName: 'Custom Development Plan for ' + roleName,
          topics: assessments.map(a => a.skillName),
          duration: '6 weeks'
        }
      ]
    };
  }
}

export const performanceLearningService = new PerformanceLearningService();
