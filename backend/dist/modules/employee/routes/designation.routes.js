"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const designation_controller_1 = __importDefault(require("../controllers/designation.controller"));
const validate_middleware_1 = require("../middlewares/validate.middleware");
const designation_validator_1 = require("../validators/designation.validator");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
// 1. Create designation
router.post('/', (0, rbac_middleware_1.requirePermission)('manage:designation'), (0, validate_middleware_1.validateBody)(designation_validator_1.createDesignationSchema), designation_controller_1.default.createDesignation.bind(designation_controller_1.default));
// 2. List designations
router.get('/', (0, rbac_middleware_1.requirePermission)('read:designation'), (0, validate_middleware_1.validateQuery)(designation_validator_1.designationListSchema), designation_controller_1.default.listDesignations.bind(designation_controller_1.default));
// 3. Static / Query endpoints (MUST be defined before /:id)
router.get('/all', (0, rbac_middleware_1.requirePermission)('read:designation'), designation_controller_1.default.getAllDesignations.bind(designation_controller_1.default));
router.get('/by-department/:departmentId', (0, rbac_middleware_1.requirePermission)('read:designation'), designation_controller_1.default.getByDepartment.bind(designation_controller_1.default));
router.get('/by-level/:level', (0, rbac_middleware_1.requirePermission)('read:designation'), designation_controller_1.default.getByLevel.bind(designation_controller_1.default));
router.get('/range/:minLevel/:maxLevel', (0, rbac_middleware_1.requirePermission)('read:designation'), designation_controller_1.default.getByLevelRange.bind(designation_controller_1.default));
router.get('/levels', (0, rbac_middleware_1.requirePermission)('read:designation'), designation_controller_1.default.getLevels.bind(designation_controller_1.default));
router.get('/stats/dashboard', (0, rbac_middleware_1.requirePermission)('read:designation'), designation_controller_1.default.getStats.bind(designation_controller_1.default));
router.get('/search/:query', (0, rbac_middleware_1.requirePermission)('read:designation'), designation_controller_1.default.searchDesignations.bind(designation_controller_1.default));
// 4. Parameterized endpoints
router.get('/:id', (0, rbac_middleware_1.requirePermission)('read:designation'), designation_controller_1.default.getDesignation.bind(designation_controller_1.default));
router.put('/:id', (0, rbac_middleware_1.requirePermission)('manage:designation'), (0, validate_middleware_1.validateBody)(designation_validator_1.updateDesignationSchema), designation_controller_1.default.updateDesignation.bind(designation_controller_1.default));
router.delete('/:id', (0, rbac_middleware_1.requirePermission)('manage:designation'), designation_controller_1.default.deleteDesignation.bind(designation_controller_1.default));
exports.default = router;
