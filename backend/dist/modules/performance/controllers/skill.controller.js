"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.skillController = exports.SkillController = void 0;
const performance_service_1 = require("../services/performance.service");
const performance_validator_1 = require("../validators/performance.validator");
const rbac_helper_1 = require("./rbac.helper");
const roles_1 = require("../../../models/roles");
const Employee_1 = __importDefault(require("../../../models/Employee"));
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
class SkillController {
    async assess(req, res) {
        try {
            if (!(0, rbac_helper_1.hasWriteAccess)(req.user.role)) {
                return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions to assess skills' });
            }
            const validatedData = performance_validator_1.assessSkillSchema.parse(req.body);
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                const targetEmployee = await Employee_1.default.findById(validatedData.employeeId);
                if (!targetEmployee || targetEmployee.departmentId.toString() !== scoped.departmentId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: Employee is not within your department' });
                }
            }
            const assessment = await performance_service_1.performanceService.assessSkill(validatedData, req.user._id);
            return res.status(201).json({ success: true, data: assessment });
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(400).json({ success: false, errors: error.errors || error.issues });
            }
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async getList(req, res) {
        try {
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            if (!scoped.allowed) {
                return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
            }
            const filter = { ...scoped.filter };
            if (req.query.employeeId && req.user.role !== roles_1.SystemRoles.EMPLOYEE) {
                filter.employeeId = new mongoose_1.default.Types.ObjectId(req.query.employeeId);
            }
            if (req.query.skillName) {
                filter.skillName = new RegExp(req.query.skillName, 'i');
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
            const assessments = await performance_service_1.performanceService.getSkills(filter);
            return res.json({ success: true, data: assessments });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async getInsights(req, res) {
        try {
            const employeeId = req.params.employeeId;
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            if (!scoped.allowed) {
                return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
            }
            // Check access permission on target employee
            if (req.user.role === roles_1.SystemRoles.EMPLOYEE) {
                if (employeeId !== scoped.employeeId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: You cannot view skill insights of other employees' });
                }
            }
            else if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                const targetEmployee = await Employee_1.default.findById(employeeId);
                if (!targetEmployee || targetEmployee.departmentId.toString() !== scoped.departmentId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: Employee is not within your department' });
                }
            }
            const insights = await performance_service_1.performanceService.getSkillInsights(employeeId);
            return res.json({ success: true, data: insights });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.SkillController = SkillController;
exports.skillController = new SkillController();
