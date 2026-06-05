"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationsController = void 0;
const applications_service_1 = __importDefault(require("./applications.service"));
const common_dto_1 = require("../../employee/dtos/common.dto");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class ApplicationsController {
    /**
     * Apply to Job Post (Public Career Portal)
     * POST /api/v1/public/recruitment/apply
     */
    async applyToJob(req, res) {
        try {
            const { jobId, email, firstName, lastName, phone, skills, currentCompany, currentDesignation, expectedSalary, noticePeriod, experience, education, linkedinUrl, portfolioUrl } = req.body;
            const file = req.file;
            // Parse skills if string array passed as JSON string
            let parsedSkills = skills;
            if (typeof skills === 'string') {
                try {
                    parsedSkills = JSON.parse(skills);
                }
                catch {
                    parsedSkills = skills.split(',').map((s) => s.trim());
                }
            }
            const candidateData = {
                firstName,
                lastName,
                email,
                phone,
                skills: parsedSkills || [],
                currentCompany,
                currentDesignation,
                expectedSalary: parseFloat(expectedSalary) || undefined,
                noticePeriod,
                experience,
                education,
                linkedinUrl,
                portfolioUrl,
            };
            const application = await applications_service_1.default.applyToJob(candidateData, jobId, file);
            res.status(201).json((0, common_dto_1.createSuccessResponse)(application, 'Application submitted successfully', 201));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to submit application', undefined, 400));
        }
    }
    /**
     * Move Application Stage (Recruiter Board)
     * PATCH /api/v1/recruitment/applications/:id/stage
     */
    async moveStage(req, res) {
        try {
            const { id } = req.params;
            const { stage, notes } = req.body;
            const { user } = req;
            const application = await applications_service_1.default.moveStage(id, stage, user._id, notes);
            res.json((0, common_dto_1.createSuccessResponse)(application, 'Application stage updated successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to transition application stage', undefined, 400));
        }
    }
    /**
     * List Applications
     * GET /api/v1/recruitment/applications
     */
    async listApplications(req, res) {
        try {
            const query = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await applications_service_1.default.listApplications(query, { page, limit });
            const paginatedResult = (0, common_dto_1.createPaginatedResponse)(result.applications, result.total, page, limit);
            res.json((0, common_dto_1.createSuccessResponse)(paginatedResult, 'Applications retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to list applications', undefined, 400));
        }
    }
    /**
     * Get Pipeline Kanban Data
     * GET /api/v1/recruitment/pipeline
     */
    async getPipeline(req, res) {
        try {
            const { jobId } = req.query;
            const pipeline = await applications_service_1.default.getPipeline(jobId);
            res.json((0, common_dto_1.createSuccessResponse)(pipeline, 'Pipeline board details retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve pipeline board', undefined, 400));
        }
    }
    /**
     * Get Recruitment Dashboard Analytics
     * GET /api/v1/recruitment/analytics
     */
    async getAnalytics(req, res) {
        try {
            const stats = await applications_service_1.default.getAnalytics();
            res.json((0, common_dto_1.createSuccessResponse)(stats, 'Recruitment analytics retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve recruitment statistics', undefined, 400));
        }
    }
    /**
     * Get Recruitment Activity Feed
     * GET /api/v1/recruitment/activities
     */
    async getActivities(req, res) {
        try {
            const feed = await applications_service_1.default.getActivities();
            res.json((0, common_dto_1.createSuccessResponse)(feed, 'Recruitment activities retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve activities feed', undefined, 400));
        }
    }
    /**
     * Secure Resume File Streaming Download
     * GET /api/v1/recruitment/resumes/download/:filename
     */
    async downloadResume(req, res) {
        try {
            const { filename } = req.params;
            const filePath = path_1.default.join(process.cwd(), 'uploads', 'resumes', filename);
            if (!fs_1.default.existsSync(filePath)) {
                res.status(404).json((0, common_dto_1.createErrorResponse)('Resume file not found', undefined, 404));
                return;
            }
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'application/octet-stream');
            const fileStream = fs_1.default.createReadStream(filePath);
            fileStream.pipe(res);
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to stream resume file download', undefined, 400));
        }
    }
}
exports.ApplicationsController = ApplicationsController;
exports.default = new ApplicationsController();
