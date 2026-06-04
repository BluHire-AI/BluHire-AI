"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentController = void 0;
const department_service_1 = __importDefault(require("../services/department.service"));
const common_dto_1 = require("../dtos/common.dto");
class DepartmentController {
    /**
     * Create department
     * POST /api/v1/departments
     */
    async createDepartment(req, res) {
        try {
            const { body, user } = req;
            const department = await department_service_1.default.createDepartment(body, user._id);
            res.status(201).json((0, common_dto_1.createSuccessResponse)(department, 'Department created successfully', 201));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to create department', undefined, 400));
        }
    }
    /**
     * Get department by ID
     * GET /api/v1/departments/:id
     */
    async getDepartment(req, res) {
        try {
            const { id } = req.params;
            const department = await department_service_1.default.getDepartment(id);
            res.json((0, common_dto_1.createSuccessResponse)(department, 'Department retrieved successfully'));
        }
        catch (error) {
            res.status(404).json((0, common_dto_1.createErrorResponse)(error.message || 'Department not found', undefined, 404));
        }
    }
    /**
     * List departments
     * GET /api/v1/departments
     */
    async listDepartments(req, res) {
        try {
            const query = req.query;
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.limit) || 10;
            const result = await department_service_1.default.listDepartments(query, { page, limit });
            res.json((0, common_dto_1.createSuccessResponse)(result, 'Departments retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to list departments', undefined, 400));
        }
    }
    /**
     * Get all active departments
     * GET /api/v1/departments/active
     */
    async getActiveDepartments(req, res) {
        try {
            const departments = await department_service_1.default.getAllActiveDepartments();
            res.json((0, common_dto_1.createSuccessResponse)(departments, 'Active departments retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve active departments', undefined, 400));
        }
    }
    /**
     * Update department
     * PUT /api/v1/departments/:id
     */
    async updateDepartment(req, res) {
        try {
            const { id } = req.params;
            const { body, user } = req;
            const department = await department_service_1.default.updateDepartment(id, body, user._id);
            res.json((0, common_dto_1.createSuccessResponse)(department, 'Department updated successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to update department', undefined, 400));
        }
    }
    /**
     * Delete department
     * DELETE /api/v1/departments/:id
     */
    async deleteDepartment(req, res) {
        try {
            const { id } = req.params;
            await department_service_1.default.deleteDepartment(id);
            res.json((0, common_dto_1.createSuccessResponse)(null, 'Department deleted successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to delete department', undefined, 400));
        }
    }
    /**
     * Assign department head
     * POST /api/v1/departments/:id/head
     */
    async assignHead(req, res) {
        try {
            const { id } = req.params;
            const { employeeId } = req.body;
            const { user } = req;
            const department = await department_service_1.default.assignDepartmentHead({ departmentId: id, employeeId }, user._id);
            res.json((0, common_dto_1.createSuccessResponse)(department, 'Department head assigned successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to assign head', undefined, 400));
        }
    }
    /**
     * Remove department head
     * DELETE /api/v1/departments/:id/head
     */
    async removeHead(req, res) {
        try {
            const { id } = req.params;
            const department = await department_service_1.default.removeDepartmentHead(id);
            res.json((0, common_dto_1.createSuccessResponse)(department, 'Department head removed successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to remove head', undefined, 400));
        }
    }
    /**
     * Toggle department status
     * PATCH /api/v1/departments/:id/toggle-status
     */
    async toggleStatus(req, res) {
        try {
            const { id } = req.params;
            const department = await department_service_1.default.toggleDepartmentStatus(id);
            res.json((0, common_dto_1.createSuccessResponse)(department, 'Department status toggled successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to toggle status', undefined, 400));
        }
    }
    /**
     * Get department with details
     * GET /api/v1/departments/:id/details
     */
    async getDepartmentDetails(req, res) {
        try {
            const { id } = req.params;
            const details = await department_service_1.default.getDepartmentWithDetails(id);
            res.json((0, common_dto_1.createSuccessResponse)(details, 'Department details retrieved successfully'));
        }
        catch (error) {
            res.status(404).json((0, common_dto_1.createErrorResponse)(error.message || 'Department not found', undefined, 404));
        }
    }
    /**
     * Get department statistics
     * GET /api/v1/departments/stats/dashboard
     */
    async getStats(req, res) {
        try {
            const stats = await department_service_1.default.getDepartmentStats();
            res.json((0, common_dto_1.createSuccessResponse)(stats, 'Department statistics retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve statistics', undefined, 400));
        }
    }
    /**
     * Search departments
     * GET /api/v1/departments/search/:query
     */
    async searchDepartments(req, res) {
        try {
            const { query } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await department_service_1.default.searchDepartments(query, { page, limit });
            res.json((0, common_dto_1.createSuccessResponse)(result, 'Search results retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Search failed', undefined, 400));
        }
    }
}
exports.DepartmentController = DepartmentController;
exports.default = new DepartmentController();
