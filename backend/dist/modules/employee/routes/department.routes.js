"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const department_controller_1 = __importDefault(require("../controllers/department.controller"));
const validate_middleware_1 = require("../middlewares/validate.middleware");
const department_validator_1 = require("../validators/department.validator");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
/**
 * Department query endpoints
 */
// Get all active departments
router.get('/active', (0, rbac_middleware_1.requirePermission)('read:department'), department_controller_1.default.getActiveDepartments.bind(department_controller_1.default));
// Get department statistics
router.get('/stats/dashboard', (0, rbac_middleware_1.requirePermission)('read:department'), department_controller_1.default.getStats.bind(department_controller_1.default));
/**
 * Department CRUD endpoints
 */
// Create department
router.post('/', (0, rbac_middleware_1.requirePermission)('manage:department'), (0, validate_middleware_1.validateBody)(department_validator_1.createDepartmentSchema), department_controller_1.default.createDepartment.bind(department_controller_1.default));
// List departments
router.get('/', (0, rbac_middleware_1.requirePermission)('read:department'), (0, validate_middleware_1.validateQuery)(department_validator_1.departmentListSchema), department_controller_1.default.listDepartments.bind(department_controller_1.default));
// Get department by ID
router.get('/:id', (0, rbac_middleware_1.requirePermission)('read:department'), department_controller_1.default.getDepartment.bind(department_controller_1.default));
// Update department
router.put('/:id', (0, rbac_middleware_1.requirePermission)('manage:department'), (0, validate_middleware_1.validateBody)(department_validator_1.updateDepartmentSchema), department_controller_1.default.updateDepartment.bind(department_controller_1.default));
// Delete department
router.delete('/:id', (0, rbac_middleware_1.requirePermission)('manage:department'), department_controller_1.default.deleteDepartment.bind(department_controller_1.default));
// Get department with details
router.get('/:id/details', (0, rbac_middleware_1.requirePermission)('read:department'), department_controller_1.default.getDepartmentDetails.bind(department_controller_1.default));
/**
 * Department management endpoints
 */
// Assign department head
router.post('/:id/head', (0, rbac_middleware_1.requirePermission)('manage:department'), (0, validate_middleware_1.validateBody)(department_validator_1.assignDepartmentHeadSchema), department_controller_1.default.assignHead.bind(department_controller_1.default));
// Remove department head
router.delete('/:id/head', (0, rbac_middleware_1.requirePermission)('manage:department'), department_controller_1.default.removeHead.bind(department_controller_1.default));
// Toggle department status
router.patch('/:id/toggle-status', (0, rbac_middleware_1.requirePermission)('manage:department'), department_controller_1.default.toggleStatus.bind(department_controller_1.default));
/**
 * Department analytics endpoints
 */
// Get department statistics
router.get('/stats/dashboard', (0, rbac_middleware_1.requirePermission)('read:department'), department_controller_1.default.getStats.bind(department_controller_1.default));
/**
 * Search endpoints
 */
// Search departments
router.get('/search/:query', (0, rbac_middleware_1.requirePermission)('read:department'), department_controller_1.default.searchDepartments.bind(department_controller_1.default));
exports.default = router;
