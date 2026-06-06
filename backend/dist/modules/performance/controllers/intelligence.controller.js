"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.intelligenceController = exports.IntelligenceController = void 0;
const rbac_helper_1 = require("./rbac.helper");
const roles_1 = require("../../../models/roles");
const Employee_1 = __importDefault(require("../../../models/Employee"));
const trend_service_1 = require("../services/trend.service");
const risk_service_1 = require("../services/risk.service");
const learning_service_1 = require("../services/learning.service");
const calibration_service_1 = require("../services/calibration.service");
const succession_service_1 = require("../services/succession.service");
class IntelligenceController {
    async getTrends(req, res) {
        try {
            const employeeId = req.params.employeeId;
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            if (req.user.role === roles_1.SystemRoles.EMPLOYEE) {
                if (employeeId !== scoped.employeeId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: You cannot view trends of other employees' });
                }
            }
            else if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                const emp = await Employee_1.default.findById(employeeId);
                if (!emp || emp.departmentId.toString() !== scoped.departmentId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: Employee is not within your department' });
                }
            }
            const trend = await trend_service_1.performanceTrendService.getEmployeeTrend(employeeId);
            return res.json({ success: true, data: trend });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async getRisk(req, res) {
        try {
            if (req.user.role === roles_1.SystemRoles.EMPLOYEE) {
                return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot access performance risk reports' });
            }
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            const filter = {};
            if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                filter.departmentId = scoped.departmentId;
            }
            else if (req.query.departmentId) {
                filter.departmentId = req.query.departmentId;
            }
            const risks = await risk_service_1.performanceRiskService.getHighRiskEmployees(filter);
            return res.json({ success: true, data: risks });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async getLearningPlan(req, res) {
        try {
            const employeeId = req.params.employeeId;
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            if (req.user.role === roles_1.SystemRoles.EMPLOYEE) {
                if (employeeId !== scoped.employeeId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: You cannot view learning plans of other employees' });
                }
            }
            else if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                const emp = await Employee_1.default.findById(employeeId);
                if (!emp || emp.departmentId.toString() !== scoped.departmentId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: Employee is not within your department' });
                }
            }
            const plan = await learning_service_1.performanceLearningService.getLearningPlan(employeeId);
            return res.json({ success: true, data: plan });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async getCalibration(req, res) {
        try {
            if (req.user.role === roles_1.SystemRoles.EMPLOYEE) {
                return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot view calibration distributions' });
            }
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            const filter = {};
            if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                filter.departmentId = scoped.departmentId;
            }
            else if (req.query.departmentId) {
                filter.departmentId = req.query.departmentId;
            }
            const calibration = await calibration_service_1.performanceCalibrationService.getCalibration(filter);
            return res.json({ success: true, data: calibration });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async getSuccession(req, res) {
        try {
            if (req.user.role === roles_1.SystemRoles.EMPLOYEE) {
                return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot view succession planning maps' });
            }
            const position = req.query.position;
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            if (position) {
                const plan = await succession_service_1.performanceSuccessionService.getSuccessionPlan(position);
                // Senior manager checks if they own the position's department
                if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER && plan && plan.currentEmployee) {
                    const emp = await Employee_1.default.findById(plan.currentEmployee._id);
                    if (!emp || emp.departmentId.toString() !== scoped.departmentId) {
                        return res.status(403).json({ success: false, message: 'Forbidden: Critical position current employee is not in your department' });
                    }
                }
                return res.json({ success: true, data: plan });
            }
            let plans = await succession_service_1.performanceSuccessionService.getAllPlans();
            if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                plans = plans.filter((p) => {
                    if (p.currentEmployee && p.currentEmployee.departmentId) {
                        return p.currentEmployee.departmentId.toString() === scoped.departmentId;
                    }
                    return false;
                });
            }
            return res.json({ success: true, data: plans });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.IntelligenceController = IntelligenceController;
exports.intelligenceController = new IntelligenceController();
