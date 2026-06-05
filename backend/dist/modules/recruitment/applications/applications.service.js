"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationsService = void 0;
const application_repository_1 = __importDefault(require("../repositories/application.repository"));
const job_repository_1 = __importDefault(require("../repositories/job.repository"));
const candidate_repository_1 = __importDefault(require("../repositories/candidate.repository"));
const recruitment_activity_repository_1 = __importDefault(require("../repositories/recruitment-activity.repository"));
const candidates_service_1 = __importDefault(require("../candidates/candidates.service"));
const Application_1 = require("../../../models/Application");
const RecruitmentActivity_1 = require("../../../models/RecruitmentActivity");
const employee_1 = require("../../employee");
const Employee_1 = __importDefault(require("../../../models/Employee"));
const employee_repository_1 = __importDefault(require("../../employee/repositories/employee.repository"));
const path_1 = __importDefault(require("path"));
class ApplicationsService {
    /**
     * Helper to generate a unique employee code
     */
    async generateEmployeeCode() {
        const year = new Date().getFullYear();
        const count = await Employee_1.default.countDocuments();
        let index = count + 1;
        let empCode = `EMP-${year}-${index.toString().padStart(4, '0')}`;
        // Ensure uniqueness
        while (await employee_repository_1.default.codeExists(empCode)) {
            index++;
            empCode = `EMP-${year}-${index.toString().padStart(4, '0')}`;
        }
        return empCode;
    }
    /**
     * Apply to Job (from careers portal)
     */
    async applyToJob(candidateData, jobId, resumeFile) {
        const job = await job_repository_1.default.findById(jobId);
        if (!job) {
            throw new Error('The requested job position does not exist.');
        }
        // Process Candidate
        let candidate = await candidates_service_1.default.getOrCreateCandidate(candidateData);
        // If resume file is uploaded, update candidate record
        if (resumeFile) {
            const ext = path_1.default.extname(resumeFile.originalname).substring(1);
            const resume = {
                fileName: resumeFile.filename,
                fileType: ext,
                fileUrl: `/api/v1/recruitment/resumes/download/${resumeFile.filename}`,
                uploadedAt: new Date(),
            };
            const updatedCandidate = await candidate_repository_1.default.update(candidate._id, { resume });
            if (updatedCandidate) {
                candidate = updatedCandidate;
            }
        }
        // Check duplicate application (Same candidate email + same job)
        const existingApp = await application_repository_1.default.findByCandidateAndJob(candidate._id, jobId);
        if (existingApp) {
            throw new Error('You have already applied for this job position.');
        }
        // Calculate AI matching details based on candidate skills vs job requiredSkills
        const candSkills = candidate.skills || [];
        const reqSkills = job.requiredSkills || [];
        const matchingSkills = candSkills.filter((s) => reqSkills.some((reqS) => reqS.toLowerCase().trim() === s.toLowerCase().trim()));
        const missingSkills = reqSkills.filter((reqS) => !candSkills.some((s) => s.toLowerCase().trim() === reqS.toLowerCase().trim()));
        const aiScore = reqSkills.length ? Math.round((matchingSkills.length / reqSkills.length) * 100) : 75;
        const aiRecommendation = aiScore >= 75
            ? 'Strongly Recommended'
            : aiScore >= 50
                ? 'Recommended'
                : aiScore >= 30
                    ? 'Requires Screen'
                    : 'Not Recommended';
        // Create Application
        const application = await application_repository_1.default.create({
            candidateId: candidate._id,
            jobId,
            currentStage: Application_1.ApplicationStage.APPLIED,
            status: 'ACTIVE',
            appliedAt: new Date(),
            aiScore,
            aiRecommendation,
            matchingSkills,
            missingSkills,
            screeningSummary: 'System auto-screened based on skills profile.',
            stageHistory: [
                {
                    stage: Application_1.ApplicationStage.APPLIED,
                    changedAt: new Date(),
                    changedBy: candidate._id, // Public application is initiated by candidate
                    notes: 'Application submitted via careers portal.',
                },
            ],
        });
        // Log Activity
        await recruitment_activity_repository_1.default.create({
            applicationId: application._id,
            candidateId: candidate._id,
            jobId,
            title: RecruitmentActivity_1.RecruitmentActivityType.CANDIDATE_APPLIED,
            description: `Candidate ${candidate.firstName} ${candidate.lastName} applied for job "${job.title}".`,
            createdBy: candidate._id,
        });
        return application;
    }
    /**
     * Move Application Stage
     */
    async moveStage(applicationId, stage, userId, notes) {
        const app = await application_repository_1.default.findById(applicationId);
        if (!app) {
            throw new Error('Application record not found');
        }
        if (app.currentStage === stage) {
            return app;
        }
        // Handle Hired Event (Promote Candidate -> Employee)
        let employeeId;
        if (stage === Application_1.ApplicationStage.HIRED && app.currentStage !== Application_1.ApplicationStage.HIRED) {
            const candidate = await candidate_repository_1.default.findById(app.candidateId);
            const job = await job_repository_1.default.findById(app.jobId);
            if (!candidate || !job) {
                throw new Error('Unable to complete hire: candidate or job record is missing.');
            }
            // Generate unique code for new employee
            const empCode = await this.generateEmployeeCode();
            const deptId = job.departmentId && typeof job.departmentId === 'object' && '_id' in job.departmentId
                ? job.departmentId._id.toString()
                : job.departmentId.toString();
            const desigId = job.designationId && typeof job.designationId === 'object' && '_id' in job.designationId
                ? job.designationId._id.toString()
                : job.designationId.toString();
            // Create Employee profile
            const employee = await employee_1.employeeService.createEmployee({
                employeeCode: empCode,
                firstName: candidate.firstName,
                lastName: candidate.lastName,
                email: candidate.email,
                phone: candidate.phone,
                departmentId: deptId,
                designationId: desigId,
                employmentType: job.employmentType,
                joiningDate: new Date(),
                workLocation: job.location || 'Headquarters',
                skills: candidate.skills,
                experience: parseFloat(candidate.experience || '0') || 0,
                notes: `Hired via candidate application ${candidate.candidateCode} for role: ${job.title}.`,
            }, userId);
            employeeId = employee._id.toString();
            // Log Recruitment activity for hire
            await recruitment_activity_repository_1.default.create({
                applicationId: app._id,
                candidateId: candidate._id,
                jobId: job._id,
                title: RecruitmentActivity_1.RecruitmentActivityType.CANDIDATE_HIRED,
                description: `Candidate ${candidate.firstName} ${candidate.lastName} was hired as employee ${empCode}.`,
                createdBy: userId,
            });
        }
        // Update application stage
        const updatedApp = await application_repository_1.default.updateStage(applicationId, stage, userId, notes);
        if (!updatedApp) {
            throw new Error('Failed to update stage history');
        }
        // Set employeeId link if created
        if (employeeId) {
            await application_repository_1.default.update(applicationId, { employeeId });
            updatedApp.employeeId = employeeId;
        }
        // Log Activity log for stage change
        let actType = RecruitmentActivity_1.RecruitmentActivityType.STAGE_CHANGED;
        if (stage === Application_1.ApplicationStage.SHORTLISTED)
            actType = RecruitmentActivity_1.RecruitmentActivityType.CANDIDATE_SHORTLISTED;
        else if (stage === Application_1.ApplicationStage.INTERVIEW)
            actType = RecruitmentActivity_1.RecruitmentActivityType.INTERVIEW_SCHEDULED;
        else if (stage === Application_1.ApplicationStage.OFFER)
            actType = RecruitmentActivity_1.RecruitmentActivityType.OFFER_RELEASED;
        await recruitment_activity_repository_1.default.create({
            applicationId: updatedApp._id,
            candidateId: updatedApp.candidateId,
            jobId: updatedApp.jobId,
            title: actType,
            description: `Application stage changed to ${stage} for ${updatedApp.candidateId?.firstName || 'Candidate'}.`,
            createdBy: userId,
        });
        return updatedApp;
    }
    /**
     * List applications (Admin/Recruiter)
     */
    async listApplications(query, pagination) {
        return await application_repository_1.default.findWithPagination(query, pagination);
    }
    /**
     * Get application pipeline board cards grouped by stage
     */
    async getPipeline(jobId) {
        const { applications } = await application_repository_1.default.findWithPagination({ jobId, limit: 1000 });
        // Group them
        const pipeline = {
            [Application_1.ApplicationStage.APPLIED]: [],
            [Application_1.ApplicationStage.SCREENING]: [],
            [Application_1.ApplicationStage.SHORTLISTED]: [],
            [Application_1.ApplicationStage.INTERVIEW]: [],
            [Application_1.ApplicationStage.OFFER]: [],
            [Application_1.ApplicationStage.HIRED]: [],
            [Application_1.ApplicationStage.REJECTED]: [],
        };
        applications.forEach((app) => {
            if (pipeline[app.currentStage]) {
                pipeline[app.currentStage].push(app);
            }
        });
        return pipeline;
    }
    /**
     * Get dashboard and recruitment analytics stats
     */
    async getAnalytics() {
        const totalJobs = await job_repository_1.default.countOpenJobs();
        const totalCandidates = await candidate_repository_1.default.countAll();
        const totalApplications = await application_repository_1.default.countAll();
        const openJobsCount = await job_repository_1.default.countOpenJobs();
        const newTodayCount = await application_repository_1.default.countNewToday();
        const pipelineStats = await application_repository_1.default.getPipelineStats();
        const recentActivities = await recruitment_activity_repository_1.default.findRecent(10);
        return {
            openJobs: openJobsCount,
            totalJobs: totalJobs || openJobsCount,
            totalCandidates,
            totalApplications,
            newToday: newTodayCount,
            pipelineStats,
            recentActivities,
        };
    }
    /**
     * Get recent activity feed
     */
    async getActivities() {
        return await recruitment_activity_repository_1.default.findRecent(20);
    }
}
exports.ApplicationsService = ApplicationsService;
exports.default = new ApplicationsService();
