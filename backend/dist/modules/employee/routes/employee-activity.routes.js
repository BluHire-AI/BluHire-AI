"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employee_activity_controller_1 = __importDefault(require("../controllers/employee-activity.controller"));
const validate_middleware_1 = require("../middlewares/validate.middleware");
const employee_activity_validator_1 = require("../validators/employee-activity.validator");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
/**
 * Activity query endpoints
 */
// Get activity by ID
router.get('/:id', (0, rbac_middleware_1.requirePermission)('read:employee'), employee_activity_controller_1.default.getActivity.bind(employee_activity_controller_1.default));
// List activities
router.get('/', (0, rbac_middleware_1.requirePermission)('read:employee'), (0, validate_middleware_1.validateQuery)(employee_activity_validator_1.activityListSchema), employee_activity_controller_1.default.listActivities.bind(employee_activity_controller_1.default));
// Get employee timeline
router.get('/employee/:employeeId/timeline', (0, rbac_middleware_1.requireEmployeeAccess)(), employee_activity_controller_1.default.getEmployeeTimeline.bind(employee_activity_controller_1.default));
// Get activities by employee
router.get('/employee/:employeeId', (0, rbac_middleware_1.requireEmployeeAccess)(), employee_activity_controller_1.default.getByEmployee.bind(employee_activity_controller_1.default));
// Get activities by type
router.get('/type/:activityType', (0, rbac_middleware_1.requirePermission)('read:employee'), employee_activity_controller_1.default.getByType.bind(employee_activity_controller_1.default));
// Get recent activities
router.get('/recent', (0, rbac_middleware_1.requirePermission)('read:employee'), employee_activity_controller_1.default.getRecent.bind(employee_activity_controller_1.default));
// Get activities by date range
router.get('/date-range', (0, rbac_middleware_1.requirePermission)('read:employee'), employee_activity_controller_1.default.getByDateRange.bind(employee_activity_controller_1.default));
/**
 * Activity analytics endpoints
 */
// Get activity statistics
router.get('/stats/dashboard', (0, rbac_middleware_1.requirePermission)('read:employee'), employee_activity_controller_1.default.getStats.bind(employee_activity_controller_1.default));
// Get activity summary
router.get('/summary/dashboard', (0, rbac_middleware_1.requirePermission)('read:employee'), employee_activity_controller_1.default.getSummary.bind(employee_activity_controller_1.default));
// Get activity distribution
router.get('/distribution', (0, rbac_middleware_1.requirePermission)('read:employee'), employee_activity_controller_1.default.getDistribution.bind(employee_activity_controller_1.default));
// Get employee activity count
router.get('/employee/:employeeId/count', (0, rbac_middleware_1.requireEmployeeAccess)(), employee_activity_controller_1.default.getEmployeeActivityCount.bind(employee_activity_controller_1.default));
/**
 * Search endpoints
 */
// Search activities
router.get('/search/:query', (0, rbac_middleware_1.requirePermission)('read:employee'), employee_activity_controller_1.default.searchActivities.bind(employee_activity_controller_1.default));
exports.default = router;
