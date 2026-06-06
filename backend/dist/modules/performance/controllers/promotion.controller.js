"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotionController = exports.PromotionController = void 0;
const performance_service_1 = require("../services/performance.service");
const rbac_helper_1 = require("./rbac.helper");
const roles_1 = require("../../../models/roles");
const Employee_1 = __importDefault(require("../../../models/Employee"));
const mongoose_1 = __importDefault(require("mongoose"));
class PromotionController {
    async evaluate(req, res) {
        try {
            const employeeId = req.params.employeeId;
            if (req.user.role === roles_1.SystemRoles.EMPLOYEE || req.user.role === roles_1.SystemRoles.HR_RECRUITER) {
                return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions to evaluate promotion readiness' });
            }
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                const targetEmployee = await Employee_1.default.findById(employeeId);
                if (!targetEmployee || targetEmployee.departmentId.toString() !== scoped.departmentId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: Employee is not within your department' });
                }
            }
            const assessment = await performance_service_1.performanceService.evaluatePromotion(employeeId);
            return res.json({ success: true, data: assessment });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async getList(req, res) {
        try {
            if (req.user.role === roles_1.SystemRoles.EMPLOYEE) {
                return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot view promotion assessment lists' });
            }
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            const filter = { ...scoped.filter };
            if (req.query.employeeId) {
                filter.employeeId = new mongoose_1.default.Types.ObjectId(req.query.employeeId);
            }
            // Senior manager scoping filter
            if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER && scoped.employeeIds) {
                filter.employeeId = { $in: scoped.employeeIds.map(id => new mongoose_1.default.Types.ObjectId(id)) };
            }
            else if (req.query.departmentId && (req.user.role === roles_1.SystemRoles.MANAGEMENT_ADMIN || req.user.role === roles_1.SystemRoles.HR_RECRUITER)) {
                const employeeIds = await Employee_1.default.find({
                    departmentId: req.query.departmentId,
                    isDeleted: false
                }).distinct('_id');
                filter.employeeId = { $in: employeeIds };
            }
            const assessments = await performance_service_1.performanceService.getPromotionAssessments(filter);
            return res.json({ success: true, data: assessments });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async getByEmployeeId(req, res) {
        try {
            const employeeId = req.params.employeeId;
            if (req.user.role === roles_1.SystemRoles.EMPLOYEE) {
                return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot view promotion assessment reports' });
            }
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                const targetEmployee = await Employee_1.default.findById(employeeId);
                if (!targetEmployee || targetEmployee.departmentId.toString() !== scoped.departmentId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: Employee is not within your department' });
                }
            }
            const assessment = await performance_service_1.performanceService.getPromotionAssessmentByEmployee(employeeId);
            if (!assessment) {
                return res.status(404).json({ success: false, message: 'No promotion assessment found for this employee' });
            }
            return res.json({ success: true, data: assessment });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.PromotionController = PromotionController;
exports.promotionController = new PromotionController();
