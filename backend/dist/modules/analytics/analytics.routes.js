"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = __importDefault(require("./analytics.controller"));
const rbac_middleware_1 = require("../employee/middlewares/rbac.middleware");
const validate_middleware_1 = require("../employee/middlewares/validate.middleware");
const analytics_validator_1 = require("./analytics.validator");
const router = (0, express_1.Router)();
// Enforce role-based access control (RBAC) at the routing level
router.use((0, rbac_middleware_1.requireRole)(rbac_middleware_1.EmployeeModuleRoles.MANAGEMENT_ADMIN, rbac_middleware_1.EmployeeModuleRoles.SENIOR_MANAGER, rbac_middleware_1.EmployeeModuleRoles.HR_RECRUITER));
router.get('/recruitment/overview', (0, validate_middleware_1.validateQuery)(analytics_validator_1.analyticsQuerySchema), analytics_controller_1.default.getRecruitmentOverview.bind(analytics_controller_1.default));
router.get('/recruitment/funnel', (0, validate_middleware_1.validateQuery)(analytics_validator_1.analyticsQuerySchema), analytics_controller_1.default.getRecruitmentFunnel.bind(analytics_controller_1.default));
router.get('/ai-screening', (0, validate_middleware_1.validateQuery)(analytics_validator_1.analyticsQuerySchema), analytics_controller_1.default.getAIScreeningStats.bind(analytics_controller_1.default));
router.get('/interviews', (0, validate_middleware_1.validateQuery)(analytics_validator_1.analyticsQuerySchema), analytics_controller_1.default.getAIInterviewStats.bind(analytics_controller_1.default));
router.get('/recruiters', (0, validate_middleware_1.validateQuery)(analytics_validator_1.analyticsQuerySchema), analytics_controller_1.default.getRecruiterPerformance.bind(analytics_controller_1.default));
router.get('/departments', (0, validate_middleware_1.validateQuery)(analytics_validator_1.analyticsQuerySchema), analytics_controller_1.default.getDepartmentHiringStats.bind(analytics_controller_1.default));
router.get('/jobs', (0, validate_middleware_1.validateQuery)(analytics_validator_1.analyticsPaginationSchema), analytics_controller_1.default.getJobPerformance.bind(analytics_controller_1.default));
router.get('/skills', (0, validate_middleware_1.validateQuery)(analytics_validator_1.analyticsQuerySchema), analytics_controller_1.default.getSkillsIntelligence.bind(analytics_controller_1.default));
router.get('/activity', (0, validate_middleware_1.validateQuery)(analytics_validator_1.analyticsQuerySchema), analytics_controller_1.default.getRecruitmentActivityStats.bind(analytics_controller_1.default));
router.get('/export', (0, validate_middleware_1.validateQuery)(analytics_validator_1.exportQuerySchema), analytics_controller_1.default.exportReport.bind(analytics_controller_1.default));
exports.default = router;
