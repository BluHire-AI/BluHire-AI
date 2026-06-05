"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analytics_service_1 = __importDefault(require("./analytics.service"));
const common_dto_1 = require("../employee/dtos/common.dto");
class AnalyticsController {
    /**
     * GET /api/v1/analytics/recruitment/overview
     */
    async getRecruitmentOverview(req, res) {
        try {
            const stats = await analytics_service_1.default.getRecruitmentOverview(req.user, req.query);
            res.json((0, common_dto_1.createSuccessResponse)(stats, 'Recruitment overview retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve recruitment overview', undefined, 400));
        }
    }
    /**
     * GET /api/v1/analytics/recruitment/funnel
     */
    async getRecruitmentFunnel(req, res) {
        try {
            const stats = await analytics_service_1.default.getRecruitmentFunnel(req.user, req.query);
            res.json((0, common_dto_1.createSuccessResponse)(stats, 'Recruitment funnel retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve recruitment funnel', undefined, 400));
        }
    }
    /**
     * GET /api/v1/analytics/ai-screening
     */
    async getAIScreeningStats(req, res) {
        try {
            const stats = await analytics_service_1.default.getAIScreeningStats(req.user, req.query);
            res.json((0, common_dto_1.createSuccessResponse)(stats, 'AI Screening stats retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve AI screening statistics', undefined, 400));
        }
    }
    /**
     * GET /api/v1/analytics/interviews
     */
    async getAIInterviewStats(req, res) {
        try {
            const stats = await analytics_service_1.default.getAIInterviewStats(req.user, req.query);
            res.json((0, common_dto_1.createSuccessResponse)(stats, 'AI Interview stats retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve AI interview statistics', undefined, 400));
        }
    }
    /**
     * GET /api/v1/analytics/recruiters
     */
    async getRecruiterPerformance(req, res) {
        try {
            const stats = await analytics_service_1.default.getRecruiterPerformance(req.user, req.query);
            res.json((0, common_dto_1.createSuccessResponse)(stats, 'Recruiter leaderboard retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve recruiter leaderboard', undefined, 400));
        }
    }
    /**
     * GET /api/v1/analytics/departments
     */
    async getDepartmentHiringStats(req, res) {
        try {
            const stats = await analytics_service_1.default.getDepartmentHiringStats(req.user, req.query);
            res.json((0, common_dto_1.createSuccessResponse)(stats, 'Department stats retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve department stats', undefined, 400));
        }
    }
    /**
     * GET /api/v1/analytics/jobs
     */
    async getJobPerformance(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const { data, total } = await analytics_service_1.default.getJobPerformance(req.user, req.query);
            const paginatedResult = (0, common_dto_1.createPaginatedResponse)(data, total, page, limit);
            res.json((0, common_dto_1.createSuccessResponse)(paginatedResult, 'Job performance stats retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve job performance stats', undefined, 400));
        }
    }
    /**
     * GET /api/v1/analytics/skills
     */
    async getSkillsIntelligence(req, res) {
        try {
            const stats = await analytics_service_1.default.getSkillsIntelligence(req.user, req.query);
            res.json((0, common_dto_1.createSuccessResponse)(stats, 'Skills intelligence retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve skills intelligence', undefined, 400));
        }
    }
    /**
     * GET /api/v1/analytics/activity
     */
    async getRecruitmentActivityStats(req, res) {
        try {
            const stats = await analytics_service_1.default.getRecruitmentActivityStats(req.user, req.query);
            res.json((0, common_dto_1.createSuccessResponse)(stats, 'Recruitment activity stats retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve recruitment activity stats', undefined, 400));
        }
    }
    /**
     * GET /api/v1/analytics/export
     */
    async exportReport(req, res) {
        try {
            const exportResult = await analytics_service_1.default.exportReport(req.user, req.query);
            res.setHeader('Content-Type', exportResult.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${exportResult.fileName}"`);
            res.send(exportResult.data);
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to export report', undefined, 400));
        }
    }
}
exports.AnalyticsController = AnalyticsController;
exports.default = new AnalyticsController();
