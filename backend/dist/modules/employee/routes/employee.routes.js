"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employee_controller_1 = __importDefault(require("../controllers/employee.controller"));
const validate_middleware_1 = require("../middlewares/validate.middleware");
const employee_validator_1 = require("../validators/employee.validator");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
/**
 * 1. Specific Static/Query and Search endpoints (MUST be defined before /:id)
 */
// Search employees
router.get('/search/:query', (0, rbac_middleware_1.requirePermission)('read:employee'), employee_controller_1.default.searchEmployees.bind(employee_controller_1.default));
// Get employee directory
router.get('/directory', (0, rbac_middleware_1.requirePermission)('read:directory'), employee_controller_1.default.getDirectory.bind(employee_controller_1.default));
// Get organization hierarchy
router.get('/hierarchy', (0, rbac_middleware_1.requirePermission)('view:hierarchy'), employee_controller_1.default.getHierarchy.bind(employee_controller_1.default));
// Get employee statistics
router.get('/stats/dashboard', (0, rbac_middleware_1.requirePermission)('read:employee'), employee_controller_1.default.getStats.bind(employee_controller_1.default));
// Bulk update employees
router.put('/bulk/update', (0, rbac_middleware_1.requirePermission)('bulk:update'), (0, validate_middleware_1.validateBody)(employee_validator_1.bulkUpdateSchema), employee_controller_1.default.bulkUpdate.bind(employee_controller_1.default));
/**
 * 2. Employee CRUD endpoints
 */
// Create employee
router.post('/', (0, rbac_middleware_1.requirePermission)('create:employee'), (0, validate_middleware_1.validateBody)(employee_validator_1.createEmployeeSchema), employee_controller_1.default.createEmployee.bind(employee_controller_1.default));
// List employees
router.get('/', (0, rbac_middleware_1.requirePermission)('read:employee'), (0, validate_middleware_1.validateQuery)(employee_validator_1.employeeListSchema), employee_controller_1.default.listEmployees.bind(employee_controller_1.default));
/**
 * 3. Parameterized endpoints (/:id must be defined after specific endpoints)
 */
// Get employee by ID
router.get('/:id', (0, rbac_middleware_1.requireEmployeeAccess)(), employee_controller_1.default.getEmployee.bind(employee_controller_1.default));
// Update employee
router.put('/:id', (0, rbac_middleware_1.requireEmployeeAccess)(), (0, validate_middleware_1.validateBody)(employee_validator_1.updateEmployeeSchema), employee_controller_1.default.updateEmployee.bind(employee_controller_1.default));
// Delete employee (soft delete)
router.delete('/:id', (0, rbac_middleware_1.requirePermission)('delete:employee'), employee_controller_1.default.deleteEmployee.bind(employee_controller_1.default));
// Get team members (reports of manager)
router.get('/:id/team', (0, rbac_middleware_1.requirePermission)('read:team'), employee_controller_1.default.getTeamMembers.bind(employee_controller_1.default));
// Promote employee
router.post('/:id/promote', (0, rbac_middleware_1.requirePermission)('update:employee'), (0, validate_middleware_1.validateBody)(employee_validator_1.promoteEmployeeSchema), employee_controller_1.default.promoteEmployee.bind(employee_controller_1.default));
// Transfer employee
router.post('/:id/transfer', (0, rbac_middleware_1.requirePermission)('update:employee'), (0, validate_middleware_1.validateBody)(employee_validator_1.transferEmployeeSchema), employee_controller_1.default.transferEmployee.bind(employee_controller_1.default));
// Change employee status
router.post('/:id/status', (0, rbac_middleware_1.requirePermission)('update:employee'), (0, validate_middleware_1.validateBody)(employee_validator_1.changeStatusSchema), employee_controller_1.default.changeStatus.bind(employee_controller_1.default));
// Add skill
router.post('/:id/skills', (0, rbac_middleware_1.requirePermission)('update:employee'), (0, validate_middleware_1.validateBody)(employee_validator_1.addSkillSchema), employee_controller_1.default.addSkill.bind(employee_controller_1.default));
// Remove skill
router.delete('/:id/skills/:skillName', (0, rbac_middleware_1.requirePermission)('update:employee'), employee_controller_1.default.removeSkill.bind(employee_controller_1.default));
// Add education
router.post('/:id/education', (0, rbac_middleware_1.requirePermission)('update:employee'), (0, validate_middleware_1.validateBody)(employee_validator_1.addEducationSchema), employee_controller_1.default.addEducation.bind(employee_controller_1.default));
// Add certification
router.post('/:id/certifications', (0, rbac_middleware_1.requirePermission)('update:employee'), (0, validate_middleware_1.validateBody)(employee_validator_1.addCertificationSchema), employee_controller_1.default.addCertification.bind(employee_controller_1.default));
// Upload document
router.post('/:id/documents', (0, rbac_middleware_1.requirePermission)('update:employee'), (0, validate_middleware_1.validateBody)(employee_validator_1.uploadDocumentSchema), employee_controller_1.default.uploadDocument.bind(employee_controller_1.default));
exports.default = router;
