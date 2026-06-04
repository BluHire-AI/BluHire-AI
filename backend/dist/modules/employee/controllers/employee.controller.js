"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeController = void 0;
const employee_service_1 = __importDefault(require("../services/employee.service"));
const common_dto_1 = require("../dtos/common.dto");
class EmployeeController {
    /**
     * Create employee
     * POST /api/v1/employees
     */
    async createEmployee(req, res) {
        try {
            const { body, user } = req;
            const employee = await employee_service_1.default.createEmployee(req.body, req.user._id);
            res.status(201).json((0, common_dto_1.createSuccessResponse)(employee, 'Employee created successfully', 201));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to create employee', undefined, 400));
        }
    }
    /**
     * Get employee by ID
     * GET /api/v1/employees/:id
     */
    async getEmployee(req, res) {
        try {
            const { id } = req.params;
            const employee = await employee_service_1.default.getEmployee(id);
            res.json((0, common_dto_1.createSuccessResponse)(employee, 'Employee retrieved successfully'));
        }
        catch (error) {
            res.status(404).json((0, common_dto_1.createErrorResponse)(error.message || 'Employee not found', undefined, 404));
        }
    }
    /**
     * List employees
     * GET /api/v1/employees
     */
    async listEmployees(req, res) {
        try {
            const query = req.query;
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.limit) || 10;
            const result = await employee_service_1.default.listEmployees(query, { page, limit });
            res.json((0, common_dto_1.createSuccessResponse)(result, 'Employees retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to list employees', undefined, 400));
        }
    }
    /**
     * Update employee
     * PUT /api/v1/employees/:id
     */
    async updateEmployee(req, res) {
        try {
            const { id } = req.params;
            const { body, user } = req;
            const employee = await employee_service_1.default.updateEmployee(id, body, user._id);
            res.json((0, common_dto_1.createSuccessResponse)(employee, 'Employee updated successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to update employee', undefined, 400));
        }
    }
    /**
     * Delete employee
     * DELETE /api/v1/employees/:id
     */
    async deleteEmployee(req, res) {
        try {
            const { id } = req.params;
            const { user } = req;
            await employee_service_1.default.deleteEmployee(id, user._id);
            res.json((0, common_dto_1.createSuccessResponse)(null, 'Employee deleted successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to delete employee', undefined, 400));
        }
    }
    /**
     * Search employees
     * GET /api/v1/employees/search/:query
     */
    async searchEmployees(req, res) {
        try {
            const { query } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await employee_service_1.default.searchEmployees(query, { page, limit });
            res.json((0, common_dto_1.createSuccessResponse)(result, 'Search results retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Search failed', undefined, 400));
        }
    }
    /**
     * Get employee directory
     * GET /api/v1/employees/directory
     */
    async getDirectory(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await employee_service_1.default.getEmployeeDirectory({ page, limit });
            res.json((0, common_dto_1.createSuccessResponse)(result, 'Employee directory retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve directory', undefined, 400));
        }
    }
    /**
     * Get organization hierarchy
     * GET /api/v1/employees/hierarchy
     */
    async getHierarchy(req, res) {
        try {
            const hierarchy = await employee_service_1.default.getOrganizationHierarchy();
            res.json((0, common_dto_1.createSuccessResponse)(hierarchy, 'Organization hierarchy retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve hierarchy', undefined, 400));
        }
    }
    /**
     * Get team members
     * GET /api/v1/employees/:id/team
     */
    async getTeamMembers(req, res) {
        try {
            const { id } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await employee_service_1.default.getTeamMembers(id, { page, limit });
            res.json((0, common_dto_1.createSuccessResponse)(result, 'Team members retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve team members', undefined, 400));
        }
    }
    /**
     * Promote employee
     * POST /api/v1/employees/:id/promote
     */
    async promoteEmployee(req, res) {
        try {
            const { id } = req.params;
            const { body, user } = req;
            const employee = await employee_service_1.default.promoteEmployee({ employeeId: id, ...body }, user._id);
            res.json((0, common_dto_1.createSuccessResponse)(employee, 'Employee promoted successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to promote employee', undefined, 400));
        }
    }
    /**
     * Transfer employee
     * POST /api/v1/employees/:id/transfer
     */
    async transferEmployee(req, res) {
        try {
            const { id } = req.params;
            const { body, user } = req;
            const employee = await employee_service_1.default.transferEmployee({ employeeId: id, ...body }, user._id);
            res.json((0, common_dto_1.createSuccessResponse)(employee, 'Employee transferred successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to transfer employee', undefined, 400));
        }
    }
    /**
     * Change employee status
     * POST /api/v1/employees/:id/status
     */
    async changeStatus(req, res) {
        try {
            const { id } = req.params;
            const { body, user } = req;
            const employee = await employee_service_1.default.changeEmployeeStatus({ employeeId: id, ...body }, user._id);
            res.json((0, common_dto_1.createSuccessResponse)(employee, 'Employee status changed successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to change status', undefined, 400));
        }
    }
    /**
     * Add skill
     * POST /api/v1/employees/:id/skills
     */
    async addSkill(req, res) {
        try {
            const { id } = req.params;
            const { skill } = req.body;
            const { user } = req;
            const employee = await employee_service_1.default.addSkill({ employeeId: id, skill }, user._id);
            res.json((0, common_dto_1.createSuccessResponse)(employee, 'Skill added successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to add skill', undefined, 400));
        }
    }
    /**
     * Remove skill
     * DELETE /api/v1/employees/:id/skills/:skillName
     */
    async removeSkill(req, res) {
        try {
            const { id, skillName } = req.params;
            const { user } = req;
            const employee = await employee_service_1.default.removeSkill({ employeeId: id, skill: skillName }, user._id);
            res.json((0, common_dto_1.createSuccessResponse)(employee, 'Skill removed successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to remove skill', undefined, 400));
        }
    }
    /**
     * Add education
     * POST /api/v1/employees/:id/education
     */
    async addEducation(req, res) {
        try {
            const { id } = req.params;
            const { body, user } = req;
            const employee = await employee_service_1.default.addEducation({ employeeId: id, ...body }, user._id);
            res.json((0, common_dto_1.createSuccessResponse)(employee, 'Education added successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to add education', undefined, 400));
        }
    }
    /**
     * Add certification
     * POST /api/v1/employees/:id/certifications
     */
    async addCertification(req, res) {
        try {
            const { id } = req.params;
            const { body, user } = req;
            const employee = await employee_service_1.default.addCertification({ employeeId: id, ...body }, user._id);
            res.json((0, common_dto_1.createSuccessResponse)(employee, 'Certification added successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to add certification', undefined, 400));
        }
    }
    /**
     * Upload document
     * POST /api/v1/employees/:id/documents
     */
    async uploadDocument(req, res) {
        try {
            const { id } = req.params;
            const { body, user } = req;
            const employee = await employee_service_1.default.uploadDocument({ employeeId: id, ...body }, user._id);
            res.json((0, common_dto_1.createSuccessResponse)(employee, 'Document uploaded successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to upload document', undefined, 400));
        }
    }
    /**
     * Get employee statistics
     * GET /api/v1/employees/stats/dashboard
     */
    async getStats(req, res) {
        try {
            const stats = await employee_service_1.default.getEmployeeStats();
            res.json((0, common_dto_1.createSuccessResponse)(stats, 'Employee statistics retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve statistics', undefined, 400));
        }
    }
    /**
     * Bulk update employees
     * PUT /api/v1/employees/bulk/update
     */
    async bulkUpdate(req, res) {
        try {
            const { body, user } = req;
            const result = await employee_service_1.default.bulkUpdateEmployees(body, user._id);
            res.json((0, common_dto_1.createSuccessResponse)(result, 'Bulk update completed'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Bulk update failed', undefined, 400));
        }
    }
}
exports.EmployeeController = EmployeeController;
exports.default = new EmployeeController();
