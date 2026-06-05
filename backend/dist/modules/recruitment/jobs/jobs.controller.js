"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsController = void 0;
const jobs_service_1 = __importDefault(require("./jobs.service"));
const common_dto_1 = require("../../employee/dtos/common.dto");
class JobsController {
    /**
     * Create Job Post
     * POST /api/v1/recruitment/jobs
     */
    async createJob(req, res) {
        try {
            const { body, user } = req;
            const job = await jobs_service_1.default.createJob(body, user._id);
            res.status(201).json((0, common_dto_1.createSuccessResponse)(job, 'Job created successfully', 201));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to create job post', undefined, 400));
        }
    }
    /**
     * Get Job Details
     * GET /api/v1/recruitment/jobs/:id
     */
    async getJob(req, res) {
        try {
            const { id } = req.params;
            const job = await jobs_service_1.default.getJobDetails(id);
            if (!job) {
                res.status(404).json((0, common_dto_1.createErrorResponse)('Job post not found', undefined, 404));
                return;
            }
            res.json((0, common_dto_1.createSuccessResponse)(job, 'Job retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve job details', undefined, 400));
        }
    }
    /**
     * Update Job Details
     * PATCH /api/v1/recruitment/jobs/:id
     */
    async updateJob(req, res) {
        try {
            const { id } = req.params;
            const { body, user } = req;
            const job = await jobs_service_1.default.updateJob(id, body, user._id);
            if (!job) {
                res.status(404).json((0, common_dto_1.createErrorResponse)('Job post not found', undefined, 404));
                return;
            }
            res.json((0, common_dto_1.createSuccessResponse)(job, 'Job updated successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to update job details', undefined, 400));
        }
    }
    /**
     * Delete Job Post (Soft Delete)
     * DELETE /api/v1/recruitment/jobs/:id
     */
    async deleteJob(req, res) {
        try {
            const { id } = req.params;
            const job = await jobs_service_1.default.deleteJob(id);
            if (!job) {
                res.status(404).json((0, common_dto_1.createErrorResponse)('Job post not found', undefined, 404));
                return;
            }
            res.json((0, common_dto_1.createSuccessResponse)(null, 'Job deleted successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to delete job post', undefined, 400));
        }
    }
    /**
     * List Jobs with filtering and pagination (Recruiters)
     * GET /api/v1/recruitment/jobs
     */
    async listJobs(req, res) {
        try {
            const query = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await jobs_service_1.default.listJobs(query, { page, limit });
            const paginatedResult = (0, common_dto_1.createPaginatedResponse)(result.jobs, result.total, page, limit);
            res.json((0, common_dto_1.createSuccessResponse)(paginatedResult, 'Jobs retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to list jobs', undefined, 400));
        }
    }
    /**
     * List Public Jobs (Careers Portal)
     * GET /api/v1/public/recruitment/jobs
     */
    async listPublicJobs(req, res) {
        try {
            const query = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await jobs_service_1.default.listPublicJobs(query, { page, limit });
            const paginatedResult = (0, common_dto_1.createPaginatedResponse)(result.jobs, result.total, page, limit);
            res.json((0, common_dto_1.createSuccessResponse)(paginatedResult, 'Careers jobs retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve career jobs', undefined, 400));
        }
    }
}
exports.JobsController = JobsController;
exports.default = new JobsController();
