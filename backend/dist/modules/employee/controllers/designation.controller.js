"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesignationController = void 0;
const designation_service_1 = __importDefault(require("../services/designation.service"));
const common_dto_1 = require("../dtos/common.dto");
class DesignationController {
    /**
     * Create designation
     * POST /api/v1/designations
     */
    async createDesignation(req, res) {
        try {
            const { body, user } = req;
            const designation = await designation_service_1.default.createDesignation(body, user._id);
            res.status(201).json((0, common_dto_1.createSuccessResponse)(designation, 'Designation created successfully', 201));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to create designation', undefined, 400));
        }
    }
    /**
     * Get designation by ID
     * GET /api/v1/designations/:id
     */
    async getDesignation(req, res) {
        try {
            const { id } = req.params;
            const designation = await designation_service_1.default.getDesignation(id);
            res.json((0, common_dto_1.createSuccessResponse)(designation, 'Designation retrieved successfully'));
        }
        catch (error) {
            res.status(404).json((0, common_dto_1.createErrorResponse)(error.message || 'Designation not found', undefined, 404));
        }
    }
    /**
     * List designations
     * GET /api/v1/designations
     */
    async listDesignations(req, res) {
        try {
            const query = req.query;
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.limit) || 10;
            const result = await designation_service_1.default.listDesignations(query, { page, limit });
            res.json((0, common_dto_1.createSuccessResponse)(result, 'Designations retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to list designations', undefined, 400));
        }
    }
    /**
     * Get all designations
     * GET /api/v1/designations/all
     */
    async getAllDesignations(req, res) {
        try {
            const designations = await designation_service_1.default.getAllDesignations();
            res.json((0, common_dto_1.createSuccessResponse)(designations, 'All designations retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve all designations', undefined, 400));
        }
    }
    /**
     * Get designations by department
     * GET /api/v1/designations/by-department/:departmentId
     */
    async getByDepartment(req, res) {
        try {
            const { departmentId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await designation_service_1.default.getDesignationsByDepartment(departmentId, { page, limit });
            res.json((0, common_dto_1.createSuccessResponse)(result, 'Designations retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve designations', undefined, 400));
        }
    }
    /**
     * Get designations by level
     * GET /api/v1/designations/by-level/:level
     */
    async getByLevel(req, res) {
        try {
            const { level } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await designation_service_1.default.getDesignationsByLevel(parseInt(level), { page, limit });
            res.json((0, common_dto_1.createSuccessResponse)(result, 'Designations retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve designations', undefined, 400));
        }
    }
    /**
     * Get all levels
     * GET /api/v1/designations/levels
     */
    async getLevels(req, res) {
        try {
            const levels = await designation_service_1.default.getAllLevels();
            res.json((0, common_dto_1.createSuccessResponse)(levels, 'Designation levels retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve levels', undefined, 400));
        }
    }
    /**
     * Update designation
     * PUT /api/v1/designations/:id
     */
    async updateDesignation(req, res) {
        try {
            const { id } = req.params;
            const { body, user } = req;
            const designation = await designation_service_1.default.updateDesignation(id, body, user._id);
            res.json((0, common_dto_1.createSuccessResponse)(designation, 'Designation updated successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to update designation', undefined, 400));
        }
    }
    /**
     * Delete designation
     * DELETE /api/v1/designations/:id
     */
    async deleteDesignation(req, res) {
        try {
            const { id } = req.params;
            await designation_service_1.default.deleteDesignation(id);
            res.json((0, common_dto_1.createSuccessResponse)(null, 'Designation deleted successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to delete designation', undefined, 400));
        }
    }
    /**
     * Get designation statistics
     * GET /api/v1/designations/stats/dashboard
     */
    async getStats(req, res) {
        try {
            const stats = await designation_service_1.default.getDesignationStats();
            res.json((0, common_dto_1.createSuccessResponse)(stats, 'Designation statistics retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve statistics', undefined, 400));
        }
    }
    /**
     * Search designations
     * GET /api/v1/designations/search/:query
     */
    async searchDesignations(req, res) {
        try {
            const { query } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await designation_service_1.default.searchDesignations(query, { page, limit });
            res.json((0, common_dto_1.createSuccessResponse)(result, 'Search results retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Search failed', undefined, 400));
        }
    }
    /**
     * Get designations by level range
     * GET /api/v1/designations/range/:minLevel/:maxLevel
     */
    async getByLevelRange(req, res) {
        try {
            const { minLevel, maxLevel } = req.params;
            const designations = await designation_service_1.default.getDesignationsByLevelRange(parseInt(minLevel), parseInt(maxLevel));
            res.json((0, common_dto_1.createSuccessResponse)(designations, 'Designations retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve designations', undefined, 400));
        }
    }
}
exports.DesignationController = DesignationController;
exports.default = new DesignationController();
