"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = __importDefault(require("./ai.controller"));
const rbac_middleware_1 = require("../../employee/middlewares/rbac.middleware");
const aiRouter = (0, express_1.Router)();
// RBAC middleware with logging
aiRouter.use((req, res, next) => {
    const userRole = req.user?.role;
    const allowedRoles = [rbac_middleware_1.EmployeeModuleRoles.MANAGEMENT_ADMIN, rbac_middleware_1.EmployeeModuleRoles.HR_RECRUITER];
    const isAllowed = allowedRoles.includes(userRole);
    console.log(`[RBAC] Role validation. User role: "${userRole}", Allowed roles: [${allowedRoles.join(', ')}], Result: ${isAllowed ? 'SUCCESS' : 'FAILED'}`);
    if (!isAllowed) {
        console.log(`[RBAC] Failure: User role "${userRole}" lacks permission to access AI screening routes.`);
        res.status(403).json({
            success: false,
            message: 'Forbidden: Insufficient permissions',
            statusCode: 403
        });
        return;
    }
    next();
});
aiRouter.post('/screen', ai_controller_1.default.screen.bind(ai_controller_1.default));
aiRouter.post('/screen/bulk', ai_controller_1.default.screenBulk.bind(ai_controller_1.default));
aiRouter.get('/screen/:applicationId', ai_controller_1.default.getScreenResult.bind(ai_controller_1.default));
aiRouter.get('/analytics', ai_controller_1.default.getAnalytics.bind(ai_controller_1.default));
aiRouter.get('/health', ai_controller_1.default.healthCheck.bind(ai_controller_1.default));
exports.default = aiRouter;
