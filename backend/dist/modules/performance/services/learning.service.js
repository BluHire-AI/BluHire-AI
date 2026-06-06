"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceLearningService = exports.PerformanceLearningService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const SkillAssessment_1 = require("../../../models/SkillAssessment");
const Employee_1 = __importDefault(require("../../../models/Employee"));
const Department_1 = __importDefault(require("../../../models/Department"));
const Designation_1 = __importDefault(require("../../../models/Designation"));
class PerformanceLearningService {
    aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1/ai';
    async getLearningPlan(employeeId) {
        const employee = await Employee_1.default.findById(employeeId);
        if (!employee || employee.isDeleted) {
            throw new Error('Employee not found');
        }
        const dept = await Department_1.default.findById(employee.departmentId);
        const desig = await Designation_1.default.findById(employee.designationId);
        const assessments = await SkillAssessment_1.SkillAssessment.find({ employeeId: new mongoose_1.default.Types.ObjectId(employeeId) });
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
        }
        catch (error) {
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
exports.PerformanceLearningService = PerformanceLearningService;
exports.performanceLearningService = new PerformanceLearningService();
