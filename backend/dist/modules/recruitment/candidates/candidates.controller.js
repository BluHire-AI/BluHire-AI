"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidatesController = void 0;
const candidates_service_1 = __importDefault(require("./candidates.service"));
const common_dto_1 = require("../../employee/dtos/common.dto");
class CandidatesController {
    /**
     * Create Candidate
     * POST /api/v1/recruitment/candidates
     */
    async createCandidate(req, res) {
        try {
            const { body, user } = req;
            const candidate = await candidates_service_1.default.createCandidate(body, user._id);
            res.status(201).json((0, common_dto_1.createSuccessResponse)(candidate, 'Candidate created successfully', 201));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to create candidate', undefined, 400));
        }
    }
    /**
     * Get Candidate Details
     * GET /api/v1/recruitment/candidates/:id
     */
    async getCandidate(req, res) {
        try {
            const { id } = req.params;
            const candidate = await candidates_service_1.default.getCandidateDetails(id);
            if (!candidate) {
                res.status(404).json((0, common_dto_1.createErrorResponse)('Candidate not found', undefined, 404));
                return;
            }
            res.json((0, common_dto_1.createSuccessResponse)(candidate, 'Candidate retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve candidate', undefined, 400));
        }
    }
    /**
     * Update Candidate Details
     * PATCH /api/v1/recruitment/candidates/:id
     */
    async updateCandidate(req, res) {
        try {
            const { id } = req.params;
            const { body, user } = req;
            const candidate = await candidates_service_1.default.updateCandidate(id, body, user._id);
            if (!candidate) {
                res.status(404).json((0, common_dto_1.createErrorResponse)('Candidate not found', undefined, 404));
                return;
            }
            res.json((0, common_dto_1.createSuccessResponse)(candidate, 'Candidate updated successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to update candidate details', undefined, 400));
        }
    }
    /**
     * Delete Candidate (Soft Delete)
     * DELETE /api/v1/recruitment/candidates/:id
     */
    async deleteCandidate(req, res) {
        try {
            const { id } = req.params;
            const candidate = await candidates_service_1.default.deleteCandidate(id);
            if (!candidate) {
                res.status(404).json((0, common_dto_1.createErrorResponse)('Candidate not found', undefined, 404));
                return;
            }
            res.json((0, common_dto_1.createSuccessResponse)(null, 'Candidate deleted successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to delete candidate', undefined, 400));
        }
    }
    /**
     * List Candidates
     * GET /api/v1/recruitment/candidates
     */
    async listCandidates(req, res) {
        try {
            const query = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await candidates_service_1.default.listCandidates(query, { page, limit });
            const paginatedResult = (0, common_dto_1.createPaginatedResponse)(result.candidates, result.total, page, limit);
            res.json((0, common_dto_1.createSuccessResponse)(paginatedResult, 'Candidates retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to list candidates', undefined, 400));
        }
    }
}
exports.CandidatesController = CandidatesController;
exports.default = new CandidatesController();
