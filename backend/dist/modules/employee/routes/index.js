"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employee_routes_1 = __importDefault(require("./employee.routes"));
const department_routes_1 = __importDefault(require("./department.routes"));
const designation_routes_1 = __importDefault(require("./designation.routes"));
const employee_activity_routes_1 = __importDefault(require("./employee-activity.routes"));
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
// Attach permissions middleware
router.use(rbac_middleware_1.attachPermissions);
/**
 * Employee Management Routes
 * Base path: /api/v1
 */
// Employee routes
router.use('/employees', employee_routes_1.default);
// Department routes
router.use('/departments', department_routes_1.default);
// Designation routes
router.use('/designations', designation_routes_1.default);
// Activity/Timeline routes
router.use('/activities', employee_activity_routes_1.default);
exports.default = router;
