"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsController = exports.AnalyticsController = void 0;
const analytics_service_1 = require("../services/analytics.service");
const rbac_helper_1 = require("./rbac.helper");
const roles_1 = require("../../../models/roles");
class AnalyticsController {
    async getOverview(req, res) {
        try {
            if (req.user.role === roles_1.SystemRoles.EMPLOYEE) {
                return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot view team analytics' });
            }
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            let departmentId = undefined;
            if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                departmentId = scoped.departmentId;
            }
            else if (req.query.departmentId) {
                departmentId = req.query.departmentId;
            }
            const result = await analytics_service_1.analyticsService.getOverview(departmentId);
            return res.json({ success: true, data: result });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async getTopPerformers(req, res) {
        try {
            if (req.user.role === roles_1.SystemRoles.EMPLOYEE) {
                return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot view talent analytics' });
            }
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            let departmentId = undefined;
            if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                departmentId = scoped.departmentId;
            }
            else if (req.query.departmentId) {
                departmentId = req.query.departmentId;
            }
            const result = await analytics_service_1.analyticsService.getTopPerformers(departmentId);
            return res.json({ success: true, data: result });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async getPromotionReady(req, res) {
        try {
            if (req.user.role === roles_1.SystemRoles.EMPLOYEE) {
                return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot view promotion analytics' });
            }
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            let departmentId = undefined;
            if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                departmentId = scoped.departmentId;
            }
            else if (req.query.departmentId) {
                departmentId = req.query.departmentId;
            }
            const result = await analytics_service_1.analyticsService.getPromotionReady(departmentId);
            return res.json({ success: true, data: result });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async getSkillGaps(req, res) {
        try {
            if (req.user.role === roles_1.SystemRoles.EMPLOYEE) {
                return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot view skill competency analytics' });
            }
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            let departmentId = undefined;
            if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                departmentId = scoped.departmentId;
            }
            else if (req.query.departmentId) {
                departmentId = req.query.departmentId;
            }
            const result = await analytics_service_1.analyticsService.getSkillGaps(departmentId);
            return res.json({ success: true, data: result });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async getGoalCompletion(req, res) {
        try {
            if (req.user.role === roles_1.SystemRoles.EMPLOYEE) {
                return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot view goal completion analytics' });
            }
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            let departmentId = undefined;
            if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                departmentId = scoped.departmentId;
            }
            else if (req.query.departmentId) {
                departmentId = req.query.departmentId;
            }
            const result = await analytics_service_1.analyticsService.getGoalCompletion(departmentId);
            return res.json({ success: true, data: result });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async getManagerEffectiveness(req, res) {
        try {
            if (req.user.role === roles_1.SystemRoles.EMPLOYEE) {
                return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot view manager effectiveness analytics' });
            }
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            let departmentId = undefined;
            if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                departmentId = scoped.departmentId;
            }
            else if (req.query.departmentId) {
                departmentId = req.query.departmentId;
            }
            const result = await analytics_service_1.analyticsService.getManagerEffectiveness(departmentId);
            return res.json({ success: true, data: result });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.AnalyticsController = AnalyticsController;
exports.analyticsController = new AnalyticsController();
