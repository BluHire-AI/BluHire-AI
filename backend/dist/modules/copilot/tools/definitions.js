"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Job_1 = __importStar(require("../../../models/Job"));
const Candidate_1 = __importDefault(require("../../../models/Candidate"));
const Application_1 = __importDefault(require("../../../models/Application"));
const Department_1 = __importDefault(require("../../../models/Department"));
const Designation_1 = __importDefault(require("../../../models/Designation"));
const Employee_1 = __importDefault(require("../../../models/Employee"));
const CopilotReport_1 = require("../../../models/CopilotReport");
const roles_1 = require("../../../models/roles");
const analytics_repository_1 = __importDefault(require("../../analytics/analytics.repository"));
const registry_1 = __importDefault(require("./registry"));
const MongoDBQueryProvider_1 = __importDefault(require("../providers/MongoDBQueryProvider"));
const VectorSearchProvider_1 = __importDefault(require("../providers/VectorSearchProvider"));
const KnowledgeDocument_1 = __importDefault(require("../../../models/KnowledgeDocument"));
const InterviewAssignment_1 = __importDefault(require("../../../models/InterviewAssignment"));
const InterviewReport_1 = __importDefault(require("../../../models/InterviewReport"));
const PerformanceReview_1 = require("../../../models/PerformanceReview");
const EmployeeGoal_1 = require("../../../models/EmployeeGoal");
const SkillAssessment_1 = require("../../../models/SkillAssessment");
const PromotionAssessment_1 = require("../../../models/PromotionAssessment");
const trend_service_1 = require("../../performance/services/trend.service");
const risk_service_1 = require("../../performance/services/risk.service");
const learning_service_1 = require("../../performance/services/learning.service");
const calibration_service_1 = require("../../performance/services/calibration.service");
const succession_service_1 = require("../../performance/services/succession.service");
// Helper to resolve manager's department
async function getManagerDepartmentId(userId) {
    const emp = await Employee_1.default.findOne({ userId, isDeleted: false });
    return emp ? emp.departmentId.toString() : null;
}
// Helpers for role restrictions
const ADMIN_ROLES = [roles_1.SystemRoles.MANAGEMENT_ADMIN, roles_1.SystemRoles.SENIOR_MANAGER];
const RECRUITER_ROLES = [roles_1.SystemRoles.MANAGEMENT_ADMIN, roles_1.SystemRoles.SENIOR_MANAGER, roles_1.SystemRoles.HR_RECRUITER];
// ==========================================
// EMPLOYEE TOOLS
// ==========================================
// 1. getEmployeeCount
registry_1.default.register({
    name: 'getEmployeeCount',
    description: 'Get the total count of active or non-deleted employees.',
    parameters: {
        type: 'object',
        properties: {}
    },
    roles: ADMIN_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const filter = { isDeleted: false };
        if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (!deptId)
                return { count: 0, notes: 'No department linked to manager profile' };
            filter.departmentId = deptId;
        }
        const count = await Employee_1.default.countDocuments(filter);
        return { count };
    }
});
// 2. getEmployeesByStatus
registry_1.default.register({
    name: 'getEmployeesByStatus',
    description: 'Get a list of employees matching a specific status (e.g. ACTIVE, PROBATION, TERMINATED).',
    parameters: {
        type: 'object',
        properties: {
            status: { type: 'string', description: 'Employment status (ACTIVE, PROBATION, TERMINATED, etc.)' }
        },
        required: ['status']
    },
    roles: ADMIN_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const statusVal = args.status.toUpperCase();
        const filter = { isDeleted: false, employmentStatus: statusVal };
        if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (!deptId)
                return [];
            filter.departmentId = deptId;
        }
        return await MongoDBQueryProvider_1.default.query(Employee_1.default, filter, 100);
    }
});
// 3. getEmployeeById
registry_1.default.register({
    name: 'getEmployeeById',
    description: 'Get full detail profile of a single employee by employee ID or employee code.',
    parameters: {
        type: 'object',
        properties: {
            id: { type: 'string', description: 'Mongoose ObjectId or Employee Code (e.g. EMP-REC-0001)' }
        },
        required: ['id']
    },
    roles: ADMIN_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const isObjectId = mongoose_1.default.Types.ObjectId.isValid(args.id);
        const query = isObjectId ? { _id: args.id } : { employeeCode: args.id.toUpperCase() };
        const filter = { ...query, isDeleted: false };
        if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (!deptId)
                return { error: 'Unauthorized: No manager department found' };
            filter.departmentId = deptId;
        }
        const emp = await Employee_1.default.findOne(filter)
            .populate('userId', 'firstName lastName email role')
            .populate('departmentId', 'name')
            .populate('designationId', 'title level')
            .populate('managerId', 'firstName lastName email employeeCode');
        return emp || { error: 'Employee not found' };
    }
});
// 4. getEmployeesByDepartment
registry_1.default.register({
    name: 'getEmployeesByDepartment',
    description: 'Get list of employees matching a specific department name.',
    parameters: {
        type: 'object',
        properties: {
            departmentName: { type: 'string', description: 'Name of department (e.g. Engineering)' }
        },
        required: ['departmentName']
    },
    roles: ADMIN_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const dept = await Department_1.default.findOne({ name: { $regex: new RegExp(args.departmentName, 'i') } });
        if (!dept)
            return { error: 'Department not found' };
        if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (!deptId || deptId !== dept._id.toString()) {
                return { error: 'Unauthorized: Can only access your own department data' };
            }
        }
        return await MongoDBQueryProvider_1.default.query(Employee_1.default, { departmentId: dept._id, isDeleted: false }, 100);
    }
});
// 5. getRecentJoinees
registry_1.default.register({
    name: 'getRecentJoinees',
    description: 'Get list of employees who joined in the last N days.',
    parameters: {
        type: 'object',
        properties: {
            days: { type: 'number', description: 'Cutoff days ago. Default: 30' }
        }
    },
    roles: ADMIN_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const daysVal = args.days || 30;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysVal);
        const filter = { isDeleted: false, joiningDate: { $gte: cutoff } };
        if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (!deptId)
                return [];
            filter.departmentId = deptId;
        }
        const employees = await Employee_1.default.find(filter)
            .populate('departmentId', 'name')
            .populate('designationId', 'title')
            .sort({ joiningDate: -1 })
            .limit(100)
            .lean();
        return employees;
    }
});
// 6. getOrganizationHierarchy
registry_1.default.register({
    name: 'getOrganizationHierarchy',
    description: 'Get org chart reporting structure mapping employee names, titles, and managers.',
    parameters: {
        type: 'object',
        properties: {}
    },
    roles: ADMIN_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const filter = { isDeleted: false };
        if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (!deptId)
                return [];
            filter.departmentId = deptId;
        }
        const employees = await Employee_1.default.find(filter)
            .select('_id employeeCode firstName lastName email managerId designationId')
            .populate('designationId', 'title')
            .populate('managerId', 'firstName lastName employeeCode')
            .lean();
        return employees;
    }
});
// ==========================================
// RECRUITMENT TOOLS
// ==========================================
// 7. getOpenJobs
registry_1.default.register({
    name: 'getOpenJobs',
    description: 'Get a list of open job openings.',
    parameters: {
        type: 'object',
        properties: {}
    },
    roles: RECRUITER_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const filter = { isDeleted: false, status: Job_1.JobStatus.OPEN };
        if (user.role === roles_1.SystemRoles.HR_RECRUITER) {
            filter.createdBy = user._id;
        }
        else if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (!deptId)
                return [];
            filter.departmentId = deptId;
        }
        const jobs = await Job_1.default.find(filter)
            .populate('departmentId', 'name')
            .populate('designationId', 'title')
            .lean();
        return jobs;
    }
});
// 8. getJobStatistics
registry_1.default.register({
    name: 'getJobStatistics',
    description: 'Get status breakdown count of all job posts (Open, Draft, Closed).',
    parameters: {
        type: 'object',
        properties: {}
    },
    roles: RECRUITER_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const filter = { isDeleted: false };
        if (user.role === roles_1.SystemRoles.HR_RECRUITER) {
            filter.createdBy = user._id;
        }
        else if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (!deptId)
                return { total: 0, open: 0, closed: 0, draft: 0 };
            filter.departmentId = deptId;
        }
        const [total, open, closed, draft] = await Promise.all([
            Job_1.default.countDocuments(filter),
            Job_1.default.countDocuments({ ...filter, status: Job_1.JobStatus.OPEN }),
            Job_1.default.countDocuments({ ...filter, status: Job_1.JobStatus.CLOSED }),
            Job_1.default.countDocuments({ ...filter, status: Job_1.JobStatus.DRAFT })
        ]);
        return { total, open, closed, draft };
    }
});
// 9. getCandidatesByStage
registry_1.default.register({
    name: 'getCandidatesByStage',
    description: 'Get candidates whose application is currently at a specific stage (APPLIED, SCREENING, SHORTLISTED, INTERVIEW, OFFER, HIRED, REJECTED).',
    parameters: {
        type: 'object',
        properties: {
            stage: { type: 'string', description: 'Stage name' }
        },
        required: ['stage']
    },
    roles: RECRUITER_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const stageVal = args.stage.toUpperCase();
        const filter = { isDeleted: false, currentStage: stageVal };
        if (user.role === roles_1.SystemRoles.HR_RECRUITER) {
            const recJobs = await Job_1.default.find({ createdBy: user._id, isDeleted: false }, '_id');
            filter.jobId = { $in: recJobs.map((j) => j._id.toString()) };
        }
        else if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (!deptId)
                return [];
            const deptJobs = await Job_1.default.find({ departmentId: deptId, isDeleted: false }, '_id');
            filter.jobId = { $in: deptJobs.map((j) => j._id.toString()) };
        }
        const apps = await Application_1.default.find(filter)
            .populate('candidateId')
            .populate('jobId', 'title jobCode')
            .limit(50)
            .lean();
        return apps;
    }
});
// 10. getCandidatesByScore
registry_1.default.register({
    name: 'getCandidatesByScore',
    description: 'Get candidates with AI match scores above or equal to a minimum threshold.',
    parameters: {
        type: 'object',
        properties: {
            minScore: { type: 'number', description: 'Min AI screening score threshold' }
        },
        required: ['minScore']
    },
    roles: RECRUITER_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const filter = { isDeleted: false, aiScore: { $gte: args.minScore } };
        if (user.role === roles_1.SystemRoles.HR_RECRUITER) {
            const recJobs = await Job_1.default.find({ createdBy: user._id, isDeleted: false }, '_id');
            filter.jobId = { $in: recJobs.map((j) => j._id.toString()) };
        }
        else if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (!deptId)
                return [];
            const deptJobs = await Job_1.default.find({ departmentId: deptId, isDeleted: false }, '_id');
            filter.jobId = { $in: deptJobs.map((j) => j._id.toString()) };
        }
        const apps = await Application_1.default.find(filter)
            .populate('candidateId')
            .populate('jobId', 'title jobCode')
            .sort({ aiScore: -1 })
            .limit(50)
            .lean();
        return apps;
    }
});
// 11. getApplicationsForJob
registry_1.default.register({
    name: 'getApplicationsForJob',
    description: 'Get applications submitted for a specific job code or ID.',
    parameters: {
        type: 'object',
        properties: {
            jobId: { type: 'string', description: 'Job Code (e.g. JOB-2026-0001) or ObjectId' }
        },
        required: ['jobId']
    },
    roles: RECRUITER_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        let targetJobId = args.jobId;
        const isObjectId = mongoose_1.default.Types.ObjectId.isValid(args.jobId);
        if (!isObjectId) {
            const job = await Job_1.default.findOne({ jobCode: args.jobId.toUpperCase(), isDeleted: false });
            if (!job)
                return { error: 'Job not found' };
            targetJobId = job._id;
        }
        if (user.role === roles_1.SystemRoles.HR_RECRUITER) {
            const job = await Job_1.default.findOne({ _id: targetJobId, createdBy: user._id, isDeleted: false });
            if (!job)
                return { error: 'Unauthorized: Recruitment scope restriction' };
        }
        else if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            const job = await Job_1.default.findOne({ _id: targetJobId, departmentId: deptId, isDeleted: false });
            if (!job)
                return { error: 'Unauthorized: Department scope restriction' };
        }
        const apps = await Application_1.default.find({ jobId: targetJobId, isDeleted: false })
            .populate('candidateId')
            .populate('jobId', 'title jobCode')
            .sort({ appliedAt: -1 })
            .limit(100)
            .lean();
        return apps;
    }
});
// 12. getTopCandidates
registry_1.default.register({
    name: 'getTopCandidates',
    description: 'Get top 5 candidate matches for a job ordered by interview and AI match scores.',
    parameters: {
        type: 'object',
        properties: {
            jobId: { type: 'string', description: 'Job Code or ObjectId' }
        },
        required: ['jobId']
    },
    roles: RECRUITER_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        let targetJobId = args.jobId;
        const isObjectId = mongoose_1.default.Types.ObjectId.isValid(args.jobId);
        if (!isObjectId) {
            const job = await Job_1.default.findOne({ jobCode: args.jobId.toUpperCase(), isDeleted: false });
            if (!job)
                return { error: 'Job not found' };
            targetJobId = job._id;
        }
        if (user.role === roles_1.SystemRoles.HR_RECRUITER) {
            const job = await Job_1.default.findOne({ _id: targetJobId, createdBy: user._id, isDeleted: false });
            if (!job)
                return { error: 'Unauthorized' };
        }
        else if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            const job = await Job_1.default.findOne({ _id: targetJobId, departmentId: deptId, isDeleted: false });
            if (!job)
                return { error: 'Unauthorized' };
        }
        const topCandidates = await Application_1.default.find({
            jobId: targetJobId,
            isDeleted: false,
            $or: [{ interviewScore: { $ne: null } }, { aiScore: { $ne: null } }]
        })
            .sort({ interviewScore: -1, aiScore: -1 })
            .limit(5)
            .populate('candidateId', 'firstName lastName email candidateCode')
            .populate('jobId', 'title jobCode')
            .lean();
        return topCandidates;
    }
});
// 13. getRecruitmentSummary
registry_1.default.register({
    name: 'getRecruitmentSummary',
    description: 'Get recruitment overview summary of hires, rejections, applications, conversion rate, and open jobs.',
    parameters: {
        type: 'object',
        properties: {}
    },
    roles: RECRUITER_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const appFilter = { isDeleted: false };
        const jobFilter = { isDeleted: false };
        const candidateFilter = { isDeleted: false };
        if (user.role === roles_1.SystemRoles.HR_RECRUITER) {
            const recJobs = await Job_1.default.find({ createdBy: user._id, isDeleted: false }, '_id');
            const jobIds = recJobs.map((j) => j._id.toString());
            appFilter.jobId = { $in: jobIds };
            jobFilter.createdBy = user._id;
        }
        else if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (deptId) {
                const deptJobs = await Job_1.default.find({ departmentId: deptId, isDeleted: false }, '_id');
                const jobIds = deptJobs.map((j) => j._id.toString());
                appFilter.jobId = { $in: jobIds };
                jobFilter.departmentId = deptId;
            }
        }
        return await analytics_repository_1.default.getRecruitmentOverview(appFilter, jobFilter, candidateFilter);
    }
});
// ==========================================
// AI SCREENING TOOLS
// ==========================================
// 14. getAIScreeningResults
registry_1.default.register({
    name: 'getAIScreeningResults',
    description: 'Get AI resume screening recommendations stats and score interval distribution.',
    parameters: {
        type: 'object',
        properties: {}
    },
    roles: RECRUITER_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const appFilter = { isDeleted: false };
        if (user.role === roles_1.SystemRoles.HR_RECRUITER) {
            const recJobs = await Job_1.default.find({ createdBy: user._id, isDeleted: false }, '_id');
            appFilter.jobId = { $in: recJobs.map((j) => j._id.toString()) };
        }
        else if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (deptId) {
                const deptJobs = await Job_1.default.find({ departmentId: deptId, isDeleted: false }, '_id');
                appFilter.jobId = { $in: deptJobs.map((j) => j._id.toString()) };
            }
        }
        return await analytics_repository_1.default.getAIScreeningStats(appFilter);
    }
});
// 15. getCandidateAIScore
registry_1.default.register({
    name: 'getCandidateAIScore',
    description: 'Get specific candidate AI match score, matching skills, missing skills, and recommendations summary.',
    parameters: {
        type: 'object',
        properties: {
            candidateId: { type: 'string', description: 'Candidate Code or ObjectId' }
        },
        required: ['candidateId']
    },
    roles: RECRUITER_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        let targetCandId = args.candidateId;
        const isObjectId = mongoose_1.default.Types.ObjectId.isValid(args.candidateId);
        if (!isObjectId) {
            const cand = await Candidate_1.default.findOne({ candidateCode: args.candidateId.toUpperCase(), isDeleted: false });
            if (!cand)
                return { error: 'Candidate not found' };
            targetCandId = cand._id;
        }
        const filter = { candidateId: targetCandId, isDeleted: false };
        if (user.role === roles_1.SystemRoles.HR_RECRUITER) {
            const recJobs = await Job_1.default.find({ createdBy: user._id, isDeleted: false }, '_id');
            filter.jobId = { $in: recJobs.map((j) => j._id.toString()) };
        }
        else if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            const deptJobs = await Job_1.default.find({ departmentId: deptId, isDeleted: false }, '_id');
            filter.jobId = { $in: deptJobs.map((j) => j._id.toString()) };
        }
        const app = await Application_1.default.findOne(filter)
            .populate('candidateId')
            .populate('jobId', 'title jobCode')
            .lean();
        return app || { error: 'No application screening records found for candidate' };
    }
});
// 16. getSkillGapAnalysis
registry_1.default.register({
    name: 'getSkillGapAnalysis',
    description: 'Get global skill gaps analysis comparing job required skills vs candidate available skills.',
    parameters: {
        type: 'object',
        properties: {}
    },
    roles: RECRUITER_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const jobFilter = { isDeleted: false };
        const candFilter = { isDeleted: false };
        if (user.role === roles_1.SystemRoles.HR_RECRUITER) {
            jobFilter.createdBy = user._id;
        }
        else if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (deptId)
                jobFilter.departmentId = deptId;
        }
        return await analytics_repository_1.default.getSkillsIntelligence(jobFilter, candFilter);
    }
});
// 17. getRecommendedCandidates
registry_1.default.register({
    name: 'getRecommendedCandidates',
    description: 'Get candidates highly recommended by AI (score >= 80 or strongly recommended).',
    parameters: {
        type: 'object',
        properties: {}
    },
    roles: RECRUITER_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const filter = {
            isDeleted: false,
            screeningStatus: 'COMPLETED',
            aiRecommendation: { $in: ['Strongly Recommended', 'Recommended'] }
        };
        if (user.role === roles_1.SystemRoles.HR_RECRUITER) {
            const recJobs = await Job_1.default.find({ createdBy: user._id, isDeleted: false }, '_id');
            filter.jobId = { $in: recJobs.map((j) => j._id.toString()) };
        }
        else if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (deptId) {
                const deptJobs = await Job_1.default.find({ departmentId: deptId, isDeleted: false }, '_id');
                filter.jobId = { $in: deptJobs.map((j) => j._id.toString()) };
            }
        }
        const apps = await Application_1.default.find(filter)
            .populate('candidateId')
            .populate('jobId', 'title jobCode')
            .sort({ aiScore: -1 })
            .limit(30)
            .lean();
        return apps;
    }
});
// ==========================================
// INTERVIEW TOOLS
// ==========================================
// 18. getInterviewResults
registry_1.default.register({
    name: 'getInterviewResults',
    description: 'Get evaluations and feedback details of completed technical interviews.',
    parameters: {
        type: 'object',
        properties: {}
    },
    roles: RECRUITER_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const filter = {
            isDeleted: false,
            interviewStatus: 'COMPLETED',
            interviewScore: { $ne: null }
        };
        if (user.role === roles_1.SystemRoles.HR_RECRUITER) {
            const recJobs = await Job_1.default.find({ createdBy: user._id, isDeleted: false }, '_id');
            filter.jobId = { $in: recJobs.map((j) => j._id.toString()) };
        }
        else if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (deptId) {
                const deptJobs = await Job_1.default.find({ departmentId: deptId, isDeleted: false }, '_id');
                filter.jobId = { $in: deptJobs.map((j) => j._id.toString()) };
            }
        }
        const apps = await Application_1.default.find(filter)
            .populate('candidateId')
            .populate('jobId', 'title jobCode')
            .sort({ interviewCompletedAt: -1 })
            .limit(50)
            .lean();
        return apps;
    }
});
// 19. getInterviewStatistics
registry_1.default.register({
    name: 'getInterviewStatistics',
    description: 'Get interview KPIs: completed vs scheduled count, pass rates, fail rates, and completion rate.',
    parameters: {
        type: 'object',
        properties: {}
    },
    roles: RECRUITER_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const appFilter = { isDeleted: false };
        if (user.role === roles_1.SystemRoles.HR_RECRUITER) {
            const recJobs = await Job_1.default.find({ createdBy: user._id, isDeleted: false }, '_id');
            appFilter.jobId = { $in: recJobs.map((j) => j._id.toString()) };
        }
        else if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (deptId) {
                const deptJobs = await Job_1.default.find({ departmentId: deptId, isDeleted: false }, '_id');
                appFilter.jobId = { $in: deptJobs.map((j) => j._id.toString()) };
            }
        }
        return await analytics_repository_1.default.getAIInterviewStats(appFilter);
    }
});
// 20. getCandidateInterviewFeedback
registry_1.default.register({
    name: 'getCandidateInterviewFeedback',
    description: 'Get interview feedback notes, score, and completion time for a candidate.',
    parameters: {
        type: 'object',
        properties: {
            candidateId: { type: 'string', description: 'Candidate Code or ObjectId' }
        },
        required: ['candidateId']
    },
    roles: RECRUITER_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        let targetCandId = args.candidateId;
        const isObjectId = mongoose_1.default.Types.ObjectId.isValid(args.candidateId);
        if (!isObjectId) {
            const cand = await Candidate_1.default.findOne({ candidateCode: args.candidateId.toUpperCase(), isDeleted: false });
            if (!cand)
                return { error: 'Candidate not found' };
            targetCandId = cand._id;
        }
        const filter = { candidateId: targetCandId, isDeleted: false };
        if (user.role === roles_1.SystemRoles.HR_RECRUITER) {
            const recJobs = await Job_1.default.find({ createdBy: user._id, isDeleted: false }, '_id');
            filter.jobId = { $in: recJobs.map((j) => j._id.toString()) };
        }
        else if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            const deptJobs = await Job_1.default.find({ departmentId: deptId, isDeleted: false }, '_id');
            filter.jobId = { $in: deptJobs.map((j) => j._id.toString()) };
        }
        const app = await Application_1.default.findOne(filter)
            .populate('candidateId')
            .populate('jobId', 'title jobCode')
            .lean();
        if (!app)
            return { error: 'Candidate application not found' };
        return {
            candidateName: app.candidateId ? `${app.candidateId.firstName} ${app.candidateId.lastName}` : 'N/A',
            interviewStatus: app.interviewStatus,
            interviewScore: app.interviewScore,
            interviewFeedback: app.interviewFeedback,
            interviewCompletedAt: app.interviewCompletedAt
        };
    }
});
// ==========================================
// ANALYTICS & EXECUTIVE TOOLS
// ==========================================
// 21. getRecruitmentAnalytics
registry_1.default.register({
    name: 'getRecruitmentAnalytics',
    description: 'Get recruitment overview, hires count, conversion rates, and average hiring duration.',
    parameters: {
        type: 'object',
        properties: {}
    },
    roles: RECRUITER_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const appFilter = { isDeleted: false };
        const jobFilter = { isDeleted: false };
        const candidateFilter = { isDeleted: false };
        if (user.role === roles_1.SystemRoles.HR_RECRUITER) {
            const recJobs = await Job_1.default.find({ createdBy: user._id, isDeleted: false }, '_id');
            const jobIds = recJobs.map((j) => j._id.toString());
            appFilter.jobId = { $in: jobIds };
            jobFilter.createdBy = user._id;
        }
        else if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (deptId) {
                const deptJobs = await Job_1.default.find({ departmentId: deptId, isDeleted: false }, '_id');
                const jobIds = deptJobs.map((j) => j._id.toString());
                appFilter.jobId = { $in: jobIds };
                jobFilter.departmentId = deptId;
            }
        }
        return await analytics_repository_1.default.getRecruitmentOverview(appFilter, jobFilter, candidateFilter);
    }
});
// 22. getHiringMetrics
registry_1.default.register({
    name: 'getHiringMetrics',
    description: 'Get recruitment funnel ratios, dropoff counts, and activity trends.',
    parameters: {
        type: 'object',
        properties: {}
    },
    roles: RECRUITER_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const appFilter = { isDeleted: false };
        if (user.role === roles_1.SystemRoles.HR_RECRUITER) {
            const recJobs = await Job_1.default.find({ createdBy: user._id, isDeleted: false }, '_id');
            appFilter.jobId = { $in: recJobs.map((j) => j._id.toString()) };
        }
        else if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (deptId) {
                const deptJobs = await Job_1.default.find({ departmentId: deptId, isDeleted: false }, '_id');
                appFilter.jobId = { $in: deptJobs.map((j) => j._id.toString()) };
            }
        }
        const funnel = await analytics_repository_1.default.getRecruitmentFunnel(appFilter);
        const activity = await analytics_repository_1.default.getRecruitmentActivityStats(appFilter);
        return { funnel, activity };
    }
});
// 23. getDepartmentMetrics
registry_1.default.register({
    name: 'getDepartmentMetrics',
    description: 'Get department hiring rates, open job counts, hires, and average time to hire rankings.',
    parameters: {
        type: 'object',
        properties: {}
    },
    roles: ADMIN_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const appFilter = { isDeleted: false };
        if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (deptId) {
                const deptJobs = await Job_1.default.find({ departmentId: deptId, isDeleted: false }, '_id');
                appFilter.jobId = { $in: deptJobs.map((j) => j._id.toString()) };
            }
        }
        return await analytics_repository_1.default.getDepartmentHiringStats(appFilter);
    }
});
// 24. getRecruiterLeaderboard
registry_1.default.register({
    name: 'getRecruiterLeaderboard',
    description: 'Get recruiters processed counts, hires, and conversions leaderboard rankings.',
    parameters: {
        type: 'object',
        properties: {}
    },
    roles: ADMIN_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const appFilter = { isDeleted: false };
        if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (deptId) {
                const deptJobs = await Job_1.default.find({ departmentId: deptId, isDeleted: false }, '_id');
                appFilter.jobId = { $in: deptJobs.map((j) => j._id.toString()) };
            }
        }
        return await analytics_repository_1.default.getRecruiterPerformance(appFilter);
    }
});
// ==========================================
// ACTION & WRITE TOOLS
// ==========================================
// 25. createJob (Action write-tool)
registry_1.default.register({
    name: 'createJob',
    description: 'ACTION: Create a new job requisition post. REQUIRED PARAMETERS: title, departmentName, experienceRequired, openings.',
    parameters: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Job Title (e.g. Senior QA Engineer)' },
            departmentName: { type: 'string', description: 'Department Name (e.g. Engineering)' },
            openings: { type: 'number', description: 'Number of open slots. Default: 1' },
            experienceRequired: { type: 'string', description: 'Experience years required (e.g., 3 years)' },
            location: { type: 'string', description: 'Job Location (e.g., Remote). Default: Remote' },
            salaryMin: { type: 'number', description: 'Minimum annual salary' },
            salaryMax: { type: 'number', description: 'Maximum annual salary' }
        },
        required: ['title', 'departmentName', 'experienceRequired']
    },
    roles: RECRUITER_ROLES,
    isWrite: true,
    handler: async (args, user) => {
        const dept = await Department_1.default.findOne({ name: { $regex: new RegExp(args.departmentName, 'i') } });
        if (!dept)
            return { error: `Department '${args.departmentName}' not found. Valid departments: Engineering, Human Resources, Product Management, Sales & Marketing, Operations.` };
        // If manager, they can only create jobs in their own department
        if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (!deptId || deptId !== dept._id.toString()) {
                return { error: 'Unauthorized: Managers can only post jobs for their own department.' };
            }
        }
        // Find any designation matching title, or create a mock/standard one
        let desig = await Designation_1.default.findOne({ title: { $regex: new RegExp(args.title, 'i') }, departmentId: dept._id });
        if (!desig) {
            desig = await Designation_1.default.create({
                title: args.title,
                description: `Automatically created Copilot designation for ${args.title}`,
                departmentId: dept._id,
                level: 3
            });
        }
        // Generate unique job code
        const count = await Job_1.default.countDocuments();
        const jobCode = `JOB-2026-${(count + 1).toString().padStart(4, '0')}`;
        const newJob = await Job_1.default.create({
            jobCode,
            title: args.title,
            departmentId: dept._id.toString(),
            designationId: desig._id.toString(),
            description: `Copilot created Job Requisition: We are hiring a ${args.title}.`,
            responsibilities: `Maintain core infrastructure, build features, collaborate with design teams.`,
            requiredSkills: ['JavaScript', 'System Design'],
            experienceRequired: args.experienceRequired,
            educationRequired: "Bachelor's Degree",
            employmentType: 'FULL_TIME',
            location: args.location || 'Remote',
            salaryMin: args.salaryMin || 70000,
            salaryMax: args.salaryMax || 110000,
            openings: args.openings || 1,
            status: Job_1.JobStatus.OPEN,
            publishedAt: new Date(),
            createdBy: user._id.toString()
        });
        return {
            success: true,
            jobId: newJob._id,
            jobCode: newJob.jobCode,
            title: newJob.title,
            department: args.departmentName,
            location: newJob.location,
            openings: newJob.openings,
            status: newJob.status
        };
    }
});
// 26. generateWeeklyRecruitmentReport (Action write-tool)
registry_1.default.register({
    name: 'generateWeeklyRecruitmentReport',
    description: 'ACTION: Generates and persists a weekly recruitment performance report containing open jobs, applications, and funnel metrics.',
    parameters: {
        type: 'object',
        properties: {
            reportName: { type: 'string', description: 'Custom report name (e.g. Q2 Software Eng Recruitment Report)' }
        }
    },
    roles: RECRUITER_ROLES,
    isWrite: true,
    handler: async (args, user) => {
        const appFilter = { isDeleted: false };
        const jobFilter = { isDeleted: false };
        const candidateFilter = { isDeleted: false };
        if (user.role === roles_1.SystemRoles.HR_RECRUITER) {
            const recJobs = await Job_1.default.find({ createdBy: user._id, isDeleted: false }, '_id');
            const jobIds = recJobs.map((j) => j._id.toString());
            appFilter.jobId = { $in: jobIds };
            jobFilter.createdBy = user._id.toString();
        }
        else if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (deptId) {
                const deptJobs = await Job_1.default.find({ departmentId: deptId, isDeleted: false }, '_id');
                const jobIds = deptJobs.map((j) => j._id.toString());
                appFilter.jobId = { $in: jobIds };
                jobFilter.departmentId = deptId;
            }
        }
        const [overview, funnel, screening, interview] = await Promise.all([
            analytics_repository_1.default.getRecruitmentOverview(appFilter, jobFilter, candidateFilter),
            analytics_repository_1.default.getRecruitmentFunnel(appFilter),
            analytics_repository_1.default.getAIScreeningStats(appFilter),
            analytics_repository_1.default.getAIInterviewStats(appFilter)
        ]);
        const reportContent = {
            overview,
            funnel,
            screening,
            interview,
            timestamp: new Date().toISOString()
        };
        const dateStr = new Date().toISOString().slice(0, 10);
        const finalReportName = args.reportName || `Weekly Recruitment Report - ${dateStr}`;
        const savedReport = await CopilotReport_1.CopilotReport.create({
            reportName: finalReportName,
            generatedBy: new mongoose_1.default.Types.ObjectId(user._id),
            content: reportContent,
            reportType: 'weekly-recruitment'
        });
        return {
            success: true,
            reportId: savedReport._id,
            reportName: savedReport.reportName,
            reportType: savedReport.reportType,
            createdAt: savedReport.createdAt,
            summary: {
                totalJobs: overview.totalJobs,
                totalApplications: overview.totalApplications,
                hires: overview.totalHires,
                conversionRate: `${overview.conversionRate}%`,
                interviewPassRate: `${interview.passRate}%`
            }
        };
    }
});
// ==========================================
// PERFORMANCE COACH & GROWTH INTELLIGENCE TOOLS
// ==========================================
// 27. getTopPerformers
registry_1.default.register({
    name: 'getTopPerformers',
    description: 'Get list of top performing employees with overall review score >= 90.',
    parameters: {
        type: 'object',
        properties: {}
    },
    roles: ADMIN_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const filter = { status: 'SUBMITTED', overallScore: { $gte: 90 } };
        if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (!deptId)
                return [];
            const employeeIds = await Employee_1.default.find({ departmentId: deptId, isDeleted: false }).distinct('_id');
            filter.employeeId = { $in: employeeIds };
        }
        const topReviews = await PerformanceReview_1.PerformanceReview.find(filter)
            .populate('employeeId', 'firstName lastName employeeCode')
            .sort({ overallScore: -1 })
            .limit(100)
            .lean();
        return topReviews;
    }
});
// 28. getPromotionCandidates
registry_1.default.register({
    name: 'getPromotionCandidates',
    description: 'Get promotion readiness assessments of employees with readinessScore >= 75.',
    parameters: {
        type: 'object',
        properties: {}
    },
    roles: ADMIN_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const filter = { readinessScore: { $gte: 75 } };
        if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (!deptId)
                return [];
            const employeeIds = await Employee_1.default.find({ departmentId: deptId, isDeleted: false }).distinct('_id');
            filter.employeeId = { $in: employeeIds };
        }
        const assessments = await PromotionAssessment_1.PromotionAssessment.find(filter)
            .populate('employeeId', 'firstName lastName employeeCode')
            .sort({ readinessScore: -1 })
            .limit(100)
            .lean();
        return assessments;
    }
});
// 29. getSkillGapAnalysis
registry_1.default.register({
    name: 'getSkillGapAnalysis',
    description: 'Get skills competency average gaps showing employee counts and avg gaps.',
    parameters: {
        type: 'object',
        properties: {}
    },
    roles: RECRUITER_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const filter = { gapScore: { $gt: 0 } };
        if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (!deptId)
                return [];
            const employeeIds = await Employee_1.default.find({ departmentId: deptId, isDeleted: false }).distinct('_id');
            filter.employeeId = { $in: employeeIds };
        }
        const skillGaps = await SkillAssessment_1.SkillAssessment.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$skillName',
                    employeeCount: { $sum: 1 },
                    avgGapScore: { $avg: '$gapScore' }
                }
            },
            { $sort: { avgGapScore: -1 } },
            { $limit: 100 },
            {
                $project: {
                    _id: 0,
                    skillName: '$_id',
                    employeeCount: 1,
                    avgGapScore: { $round: ['$avgGapScore', 1] }
                }
            }
        ]);
        return skillGaps;
    }
});
// 30. getGoalCompletionRates
registry_1.default.register({
    name: 'getGoalCompletionRates',
    description: 'Get summary statistics of employee goal completion statuses (Not Started, In Progress, Completed, Overdue).',
    parameters: {
        type: 'object',
        properties: {}
    },
    roles: ADMIN_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const filter = {};
        if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (!deptId)
                return { NOT_STARTED: 0, IN_PROGRESS: 0, COMPLETED: 0, OVERDUE: 0 };
            const employeeIds = await Employee_1.default.find({ departmentId: deptId, isDeleted: false }).distinct('_id');
            filter.employeeId = { $in: employeeIds };
        }
        const goalStats = await EmployeeGoal_1.EmployeeGoal.aggregate([
            { $match: filter },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const result = { NOT_STARTED: 0, IN_PROGRESS: 0, COMPLETED: 0, OVERDUE: 0 };
        goalStats.forEach(item => {
            if (item._id in result)
                result[item._id] = item.count;
        });
        return result;
    }
});
// 31. getEmployeePerformance
registry_1.default.register({
    name: 'getEmployeePerformance',
    description: 'Get detailed performance reviews, goals, and skill levels for a specific employee code or ID.',
    parameters: {
        type: 'object',
        properties: {
            employeeId: { type: 'string', description: 'Employee code (e.g. EMP-2026-0001) or ObjectId' }
        },
        required: ['employeeId']
    },
    roles: ADMIN_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const isObjectId = mongoose_1.default.Types.ObjectId.isValid(args.employeeId);
        const query = isObjectId ? { _id: args.employeeId } : { employeeCode: args.employeeId.toUpperCase() };
        const emp = await Employee_1.default.findOne({ ...query, isDeleted: false });
        if (!emp)
            return { error: 'Employee not found' };
        if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (!deptId || deptId !== emp.departmentId.toString()) {
                return { error: 'Unauthorized: Employee is outside your department scope' };
            }
        }
        const [reviews, goals, skills] = await Promise.all([
            PerformanceReview_1.PerformanceReview.find({ employeeId: emp._id, status: 'SUBMITTED' }).sort({ createdAt: -1 }).limit(10).lean(),
            EmployeeGoal_1.EmployeeGoal.find({ employeeId: emp._id }).sort({ targetDate: 1 }).limit(20).lean(),
            SkillAssessment_1.SkillAssessment.find({ employeeId: emp._id }).sort({ currentLevel: -1 }).lean()
        ]);
        return {
            employee: {
                firstName: emp.firstName,
                lastName: emp.lastName,
                employeeCode: emp.employeeCode,
                departmentId: emp.departmentId,
                designationId: emp.designationId
            },
            reviews: reviews.map(r => ({
                reviewPeriod: r.reviewPeriod,
                reviewType: r.reviewType,
                overallScore: r.overallScore,
                comments: r.comments
            })),
            goals: goals.map(g => ({
                title: g.title,
                status: g.status,
                progressPercentage: g.progressPercentage,
                targetDate: g.targetDate
            })),
            skills: skills.map(s => ({
                skillName: s.skillName,
                currentLevel: s.currentLevel,
                desiredLevel: s.desiredLevel,
                gapScore: s.gapScore
            }))
        };
    }
});
// 32. generatePerformanceReport (Action write-tool)
registry_1.default.register({
    name: 'generatePerformanceReport',
    description: 'ACTION: Generates and saves a detailed AI growth and performance report for a specific employee code or ID.',
    parameters: {
        type: 'object',
        properties: {
            employeeId: { type: 'string', description: 'Employee code or ObjectId' },
            reportName: { type: 'string', description: 'Custom report name (optional)' }
        },
        required: ['employeeId']
    },
    roles: ADMIN_ROLES,
    isWrite: true,
    handler: async (args, user) => {
        const isObjectId = mongoose_1.default.Types.ObjectId.isValid(args.employeeId);
        const query = isObjectId ? { _id: args.employeeId } : { employeeCode: args.employeeId.toUpperCase() };
        const emp = await Employee_1.default.findOne({ ...query, isDeleted: false });
        if (!emp)
            return { error: 'Employee not found' };
        if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (!deptId || deptId !== emp.departmentId.toString()) {
                return { error: 'Unauthorized: Employee is outside your department scope' };
            }
        }
        const [reviews, goals, skills] = await Promise.all([
            PerformanceReview_1.PerformanceReview.find({ employeeId: emp._id, status: 'SUBMITTED' }).sort({ createdAt: -1 }).lean(),
            EmployeeGoal_1.EmployeeGoal.find({ employeeId: emp._id }).lean(),
            SkillAssessment_1.SkillAssessment.find({ employeeId: emp._id }).lean()
        ]);
        const overallScoreAvg = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.overallScore, 0) / reviews.length
            : 70;
        const completedGoals = goals.filter(g => g.status === 'COMPLETED').length;
        const totalGoals = goals.length;
        const goalCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
        const skillGaps = skills.filter(s => s.gapScore > 0).map(s => s.skillName);
        // Call the AI Performance Coach to generate a growth plan
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1/ai';
        let aiInsights = 'No review comments available for AI evaluation.';
        if (reviews.length > 0) {
            try {
                const response = await fetch(`${aiServiceUrl}/performance/summary`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        scores: {
                            communication: reviews[0].communicationScore,
                            technical: reviews[0].technicalScore,
                            leadership: reviews[0].leadershipScore,
                            productivity: reviews[0].productivityScore,
                            teamwork: reviews[0].teamworkScore
                        },
                        comments: reviews[0].comments || 'Steady performer.',
                        strengths: reviews[0].strengths || [],
                        weaknesses: reviews[0].weaknesses || []
                    })
                });
                if (response.ok) {
                    const resJson = await response.json();
                    aiInsights = resJson.summary || aiInsights;
                }
            }
            catch (err) {
                console.error('Failed to call AI performance summaries in Copilot tool:', err);
            }
        }
        const reportContent = {
            employeeCode: emp.employeeCode,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            metrics: {
                reviewsEvaluated: reviews.length,
                averageOverallScore: Math.round(overallScoreAvg * 10) / 10,
                goalCompletionRate: Math.round(goalCompletionRate * 10) / 10,
                skillGapsCount: skillGaps.length
            },
            skillsList: skills.map(s => ({ skill: s.skillName, current: s.currentLevel, desired: s.desiredLevel, gap: s.gapScore })),
            aiInsights,
            timestamp: new Date().toISOString()
        };
        const finalReportName = args.reportName || `AI Growth Plan - ${emp.firstName} ${emp.lastName} (${emp.employeeCode})`;
        const savedReport = await CopilotReport_1.CopilotReport.create({
            reportName: finalReportName,
            generatedBy: new mongoose_1.default.Types.ObjectId(user._id),
            content: reportContent,
            reportType: 'employee-growth-plan'
        });
        return {
            success: true,
            reportId: savedReport._id,
            reportName: savedReport.reportName,
            reportType: savedReport.reportType,
            createdAt: savedReport.createdAt,
            employeeCode: emp.employeeCode,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            averageOverallScore: reportContent.metrics.averageOverallScore,
            aiInsights: reportContent.aiInsights
        };
    }
});
// 33. getPerformanceTrend
registry_1.default.register({
    name: 'getPerformanceTrend',
    description: 'Get rolling averages and trend direction for a specific employee code or ID.',
    parameters: {
        type: 'object',
        properties: {
            employeeId: { type: 'string', description: 'Employee code (e.g. EMP-2026-0001) or ObjectId' }
        },
        required: ['employeeId']
    },
    roles: ADMIN_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const isObjectId = mongoose_1.default.Types.ObjectId.isValid(args.employeeId);
        const query = isObjectId ? { _id: args.employeeId } : { employeeCode: args.employeeId.toUpperCase() };
        const emp = await Employee_1.default.findOne({ ...query, isDeleted: false });
        if (!emp)
            return { error: 'Employee not found' };
        if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (!deptId || deptId !== emp.departmentId.toString()) {
                return { error: 'Unauthorized: Employee is outside your department scope' };
            }
        }
        return await trend_service_1.performanceTrendService.getEmployeeTrend(emp._id.toString());
    }
});
// 34. getHighRiskEmployees
registry_1.default.register({
    name: 'getHighRiskEmployees',
    description: 'Get list of high performance risk employees.',
    parameters: {
        type: 'object',
        properties: {}
    },
    roles: ADMIN_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const filter = {};
        if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (!deptId)
                return [];
            filter.departmentId = deptId;
        }
        return await risk_service_1.performanceRiskService.getHighRiskEmployees(filter);
    }
});
// 35. getLearningPlan
registry_1.default.register({
    name: 'getLearningPlan',
    description: 'Get recommended learning path courses to close skill gaps for a specific employee code or ID.',
    parameters: {
        type: 'object',
        properties: {
            employeeId: { type: 'string', description: 'Employee code or ObjectId' }
        },
        required: ['employeeId']
    },
    roles: ADMIN_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const isObjectId = mongoose_1.default.Types.ObjectId.isValid(args.employeeId);
        const query = isObjectId ? { _id: args.employeeId } : { employeeCode: args.employeeId.toUpperCase() };
        const emp = await Employee_1.default.findOne({ ...query, isDeleted: false });
        if (!emp)
            return { error: 'Employee not found' };
        if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (!deptId || deptId !== emp.departmentId.toString()) {
                return { error: 'Unauthorized: Employee is outside your department scope' };
            }
        }
        return await learning_service_1.performanceLearningService.getLearningPlan(emp._id.toString());
    }
});
// 36. getCalibrationDistribution
registry_1.default.register({
    name: 'getCalibrationDistribution',
    description: 'Get talent performance calibration maps (Top, Strong, Average, Needs Improvement) by department.',
    parameters: {
        type: 'object',
        properties: {
            departmentName: { type: 'string', description: 'Name of department (optional)' }
        }
    },
    roles: ADMIN_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const filter = {};
        if (args.departmentName) {
            const dept = await Department_1.default.findOne({ name: { $regex: new RegExp(args.departmentName, 'i') } });
            if (!dept)
                return { error: `Department '${args.departmentName}' not found` };
            filter.departmentId = dept._id.toString();
        }
        if (user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
            const deptId = await getManagerDepartmentId(user._id);
            if (!deptId || (args.departmentName && deptId !== filter.departmentId)) {
                return { error: 'Unauthorized: Can only view calibration maps for your department' };
            }
            filter.departmentId = deptId;
        }
        return await calibration_service_1.performanceCalibrationService.getCalibration(filter);
    }
});
// 37. getSuccessionCandidates
registry_1.default.register({
    name: 'getSuccessionCandidates',
    description: 'Get candidate succession pipeline matches for a critical job position.',
    parameters: {
        type: 'object',
        properties: {
            position: { type: 'string', description: 'Position title (e.g. Chief Technology Officer)' }
        },
        required: ['position']
    },
    roles: ADMIN_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const plan = await succession_service_1.performanceSuccessionService.getSuccessionPlan(args.position);
        if (user.role === roles_1.SystemRoles.SENIOR_MANAGER && plan && plan.currentEmployee) {
            const emp = await Employee_1.default.findById(plan.currentEmployee._id);
            const deptId = await getManagerDepartmentId(user._id);
            if (!emp || emp.departmentId.toString() !== deptId) {
                return { error: 'Unauthorized: Succession plan is for a position outside your department' };
            }
        }
        return plan;
    }
});
// 38. generateSuccessionReport
registry_1.default.register({
    name: 'generateSuccessionReport',
    description: 'ACTION: Generates and saves a detailed role succession report in CopilotReport.',
    parameters: {
        type: 'object',
        properties: {
            position: { type: 'string', description: 'Position title' },
            reportName: { type: 'string', description: 'Custom report name (optional)' }
        },
        required: ['position']
    },
    roles: ADMIN_ROLES,
    isWrite: true,
    handler: async (args, user) => {
        const plan = await succession_service_1.performanceSuccessionService.getSuccessionPlan(args.position);
        if (user.role === roles_1.SystemRoles.SENIOR_MANAGER && plan && plan.currentEmployee) {
            const emp = await Employee_1.default.findById(plan.currentEmployee._id);
            const deptId = await getManagerDepartmentId(user._id);
            if (!emp || emp.departmentId.toString() !== deptId) {
                return { error: 'Unauthorized: Succession plan is for a position outside your department' };
            }
        }
        const finalReportName = args.reportName || `Succession Plan Report - ${args.position} (${new Date().toISOString().slice(0, 10)})`;
        const savedReport = await CopilotReport_1.CopilotReport.create({
            reportName: finalReportName,
            generatedBy: new mongoose_1.default.Types.ObjectId(user._id),
            content: plan,
            reportType: 'succession-plan'
        });
        return {
            success: true,
            reportId: savedReport._id,
            reportName: savedReport.reportName,
            createdAt: savedReport.createdAt,
            position: args.position
        };
    }
});
// ==========================================
// KNOWLEDGE BASE & RAG TOOLS
// ==========================================
const KNOWLEDGE_ROLES = [
    roles_1.SystemRoles.MANAGEMENT_ADMIN,
    roles_1.SystemRoles.SENIOR_MANAGER,
    roles_1.SystemRoles.HR_RECRUITER,
    roles_1.SystemRoles.EMPLOYEE
];
// 25. searchKnowledgeBase
registry_1.default.register({
    name: 'searchKnowledgeBase',
    description: 'Search the company knowledge base (employee handbooks, leave policies, SOPs, benefits, compliance, etc.) for answers.',
    parameters: {
        type: 'object',
        properties: {
            query: { type: 'string', description: 'The semantic question or topic to search for (e.g., probation policy, parental leave length)' }
        },
        required: ['query']
    },
    roles: KNOWLEDGE_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const results = await VectorSearchProvider_1.default.retrieveChunks(args.query, user.role, 5);
        return results.map(r => ({
            title: r.document?.title || 'Policy Document',
            fileName: r.document?.fileName || 'document.pdf',
            documentType: r.document?.documentType || 'OTHER',
            pageNumber: r.pageNumber,
            sectionTitle: r.sectionTitle,
            content: r.content,
            score: r.score
        }));
    }
});
// 26. summarizePolicy
registry_1.default.register({
    name: 'summarizePolicy',
    description: 'Get a concise summary of a policy topic (e.g., maternity leave structure) from the knowledge base.',
    parameters: {
        type: 'object',
        properties: {
            topic: { type: 'string', description: 'The specific policy topic/theme to summarize' }
        },
        required: ['topic']
    },
    roles: KNOWLEDGE_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const chunks = await VectorSearchProvider_1.default.retrieveChunks(args.topic, user.role, 6);
        if (!chunks || chunks.length === 0) {
            return { message: `No policies or guidelines found in database matching topic: "${args.topic}"` };
        }
        const context = chunks.map(c => c.content).join('\n\n');
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1/ai';
        try {
            const res = await fetch(`${aiServiceUrl}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an HR Specialist. Summarize the following context details clearly in bullet points. Highlight crucial timelines or figures.'
                        },
                        {
                            role: 'user',
                            content: `Context:\n${context}\n\nTask: Summarize the policy regarding "${args.topic}".`
                        }
                    ]
                })
            });
            if (!res.ok) {
                throw new Error(`AI service returned status ${res.status}`);
            }
            const data = await res.json();
            const summary = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || 'No summary generated.';
            return {
                topic: args.topic,
                summary,
                sources: Array.from(new Set(chunks.map(c => `${c.document?.fileName || 'document.pdf'} (Page ${c.pageNumber || 1})`)))
            };
        }
        catch (err) {
            return {
                error: `Could not summarize policy details automatically: ${err.message}`,
                sources: Array.from(new Set(chunks.map(c => c.document?.fileName || 'document.pdf')))
            };
        }
    }
});
// 27. getDocumentSummary
registry_1.default.register({
    name: 'getDocumentSummary',
    description: 'Retrieve metadata and basic information for a specific uploaded document by title.',
    parameters: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Title or filename of the document' }
        },
        required: ['title']
    },
    roles: KNOWLEDGE_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const filter = {
            title: { $regex: new RegExp(args.title, 'i') }
        };
        if (user.role === roles_1.SystemRoles.EMPLOYEE) {
            filter.isApprovedForEmployees = true;
        }
        const docs = await KnowledgeDocument_1.default.find(filter)
            .populate('uploadedBy', 'firstName lastName')
            .lean();
        if (!docs.length)
            return { error: 'Document not found or access restricted' };
        return docs.map((doc) => ({
            id: doc._id,
            title: doc.title,
            fileName: doc.fileName,
            documentType: doc.documentType,
            uploadedBy: doc.uploadedBy ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}` : 'System',
            chunkCount: doc.chunkCount,
            status: doc.status,
            isApprovedForEmployees: doc.isApprovedForEmployees,
            createdAt: doc.createdAt
        }));
    }
});
// 28. findPolicyReferences
registry_1.default.register({
    name: 'findPolicyReferences',
    description: 'Find direct matches and document citations referring to a keyword.',
    parameters: {
        type: 'object',
        properties: {
            keyword: { type: 'string', description: 'Keyword to lookup (e.g. payout, probation)' }
        },
        required: ['keyword']
    },
    roles: KNOWLEDGE_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const chunks = await VectorSearchProvider_1.default.retrieveChunks(args.keyword, user.role, 8);
        return chunks.map(c => ({
            document: c.document?.title || 'Policy',
            fileName: c.document?.fileName || 'document.pdf',
            pageNumber: c.pageNumber,
            sectionTitle: c.sectionTitle,
            snippet: c.content.length > 250 ? c.content.substring(0, 250) + '...' : c.content,
            score: c.score
        }));
    }
});
// 29. listKnowledgeDocuments
registry_1.default.register({
    name: 'listKnowledgeDocuments',
    description: 'List all indexed documents available in the knowledge base.',
    parameters: {
        type: 'object',
        properties: {}
    },
    roles: KNOWLEDGE_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const filter = {};
        if (user.role === roles_1.SystemRoles.EMPLOYEE) {
            filter.isApprovedForEmployees = true;
        }
        const docs = await KnowledgeDocument_1.default.find(filter)
            .select('title fileName documentType status chunkCount isApprovedForEmployees')
            .lean();
        return docs;
    }
});
// 30. compareCandidates
registry_1.default.register({
    name: 'compareCandidates',
    description: 'Compare interview performance, final scores, resume scores, ranking positions, strengths, and weaknesses for two or more candidates.',
    parameters: {
        type: 'object',
        properties: {
            candidateIdentifiers: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of candidate names or candidate codes to compare (e.g. ["John Doe", "CAND-0012"])'
            }
        },
        required: ['candidateIdentifiers']
    },
    roles: RECRUITER_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        const results = [];
        for (const ident of args.candidateIdentifiers) {
            let candQuery = {};
            const isObjectId = mongoose_1.default.Types.ObjectId.isValid(ident);
            if (isObjectId) {
                candQuery = { _id: ident };
            }
            else if (ident.toUpperCase().startsWith('CAND-')) {
                candQuery = { candidateCode: ident.toUpperCase() };
            }
            else {
                const parts = ident.trim().split(/\s+/);
                if (parts.length > 1) {
                    candQuery = {
                        firstName: { $regex: new RegExp(parts[0], 'i') },
                        lastName: { $regex: new RegExp(parts[1], 'i') }
                    };
                }
                else {
                    candQuery = {
                        $or: [
                            { firstName: { $regex: new RegExp(ident, 'i') } },
                            { lastName: { $regex: new RegExp(ident, 'i') } }
                        ]
                    };
                }
            }
            candQuery.isDeleted = false;
            const candidate = await Candidate_1.default.findOne(candQuery);
            if (!candidate) {
                results.push({ identifier: ident, error: 'Candidate record not found' });
                continue;
            }
            const assignment = await InterviewAssignment_1.default.findOne({ candidateId: candidate._id })
                .populate('interviewTemplateId', 'name jobRole')
                .populate('jobId', 'title jobCode')
                .lean();
            if (!assignment) {
                results.push({
                    candidateName: `${candidate.firstName} ${candidate.lastName}`,
                    candidateCode: candidate.candidateCode,
                    status: 'Not Shortlisted',
                    error: 'No interview assignment found for this candidate'
                });
                continue;
            }
            // Fetch report if completed
            let report = null;
            if (assignment.status === 'Completed' || assignment.status === 'Reviewed') {
                report = await InterviewReport_1.default.findOne({ candidateId: candidate._id }).lean();
            }
            results.push({
                candidateName: `${candidate.firstName} ${candidate.lastName}`,
                candidateCode: candidate.candidateCode,
                jobTitle: assignment.jobId?.title || 'N/A',
                jobCode: assignment.jobId?.jobCode || 'N/A',
                assignmentStatus: assignment.status,
                resumeScore: assignment.resumeScore || 0,
                interviewScore: assignment.interviewScore || null,
                finalScore: assignment.finalCandidateScore || null,
                rankingPosition: assignment.rankingPosition || null,
                strengths: report?.strengths || [],
                weaknesses: report?.weaknesses || [],
                hiringRecommendation: report?.hiringRecommendation || 'N/A',
                recommendationReasoning: report?.recommendationReasoning || '',
                transcriptSummary: report?.transcriptSummary || ''
            });
        }
        return results;
    }
});
// 31. getJobCandidatesLeaderboard
registry_1.default.register({
    name: 'getJobCandidatesLeaderboard',
    description: 'Get a list of all candidates for a job ranked by their final candidate score, showing final scores, resume scores, interview scores, and ranking positions.',
    parameters: {
        type: 'object',
        properties: {
            jobIdentifier: { type: 'string', description: 'Job Code (e.g. JOB-2026-0001) or Job ObjectId' }
        },
        required: ['jobIdentifier']
    },
    roles: RECRUITER_ROLES,
    isWrite: false,
    handler: async (args, user) => {
        let targetJobId = args.jobIdentifier;
        const isObjectId = mongoose_1.default.Types.ObjectId.isValid(args.jobIdentifier);
        if (!isObjectId) {
            const job = await Job_1.default.findOne({ jobCode: args.jobIdentifier.toUpperCase(), isDeleted: false });
            if (!job)
                return { error: 'Job not found' };
            targetJobId = job._id;
        }
        const assignments = await InterviewAssignment_1.default.find({
            jobId: targetJobId,
            status: { $in: ['Completed', 'Reviewed'] },
            finalCandidateScore: { $ne: null }
        })
            .sort({ finalCandidateScore: -1 })
            .populate('candidateId', 'firstName lastName candidateCode email')
            .populate('jobId', 'title jobCode')
            .lean();
        return assignments.map((a) => ({
            rankingPosition: a.rankingPosition,
            candidateName: a.candidateId ? `${a.candidateId.firstName} ${a.candidateId.lastName}` : 'N/A',
            candidateCode: a.candidateId?.candidateCode || 'N/A',
            email: a.candidateId?.email || 'N/A',
            jobTitle: a.jobId?.title || 'N/A',
            jobCode: a.jobId?.jobCode || 'N/A',
            resumeScore: a.resumeScore || 0,
            interviewScore: a.interviewScore || 0,
            finalCandidateScore: a.finalCandidateScore || 0,
            rankingReasoning: a.rankingReasoning
        }));
    }
});
