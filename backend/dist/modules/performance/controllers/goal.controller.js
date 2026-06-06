"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.goalController = exports.GoalController = void 0;
const performance_service_1 = require("../services/performance.service");
const performance_validator_1 = require("../validators/performance.validator");
const rbac_helper_1 = require("./rbac.helper");
const roles_1 = require("../../../models/roles");
const Employee_1 = __importDefault(require("../../../models/Employee"));
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
class GoalController {
    async create(req, res) {
        try {
            if (!(0, rbac_helper_1.hasWriteAccess)(req.user.role)) {
                return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions to create goals' });
            }
            const validatedData = performance_validator_1.createGoalSchema.parse(req.body);
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                const targetEmployee = await Employee_1.default.findById(validatedData.employeeId);
                if (!targetEmployee || targetEmployee.departmentId.toString() !== scoped.departmentId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: Employee is not within your department' });
                }
            }
            const goal = await performance_service_1.performanceService.createGoal(validatedData, req.user._id);
            return res.status(201).json({ success: true, data: goal });
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(400).json({ success: false, errors: error.errors || error.issues });
            }
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async update(req, res) {
        try {
            if (req.user.role === roles_1.SystemRoles.HR_RECRUITER) {
                return res.status(403).json({ success: false, message: 'Forbidden: Recruiter role is read-only' });
            }
            const validatedData = performance_validator_1.updateGoalSchema.parse(req.body);
            const id = req.params.id;
            const goal = await performance_service_1.performanceService.getGoalById(id);
            if (!goal) {
                return res.status(404).json({ success: false, message: 'Employee goal not found' });
            }
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            if (req.user.role === roles_1.SystemRoles.EMPLOYEE) {
                if (goal.employeeId._id.toString() !== scoped.employeeId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: You cannot update goals of other employees' });
                }
                // Employees can only update progressPercentage and status
                const allowedUpdates = {
                    progressPercentage: validatedData.progressPercentage,
                    status: validatedData.status
                };
                const updatedGoal = await performance_service_1.performanceService.updateGoal(id, allowedUpdates);
                return res.json({ success: true, data: updatedGoal });
            }
            if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                const targetEmployee = await Employee_1.default.findById(goal.employeeId);
                if (!targetEmployee || targetEmployee.departmentId.toString() !== scoped.departmentId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: Goal belongs to an employee outside your department' });
                }
            }
            const updatedGoal = await performance_service_1.performanceService.updateGoal(id, validatedData);
            return res.json({ success: true, data: updatedGoal });
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
            // Filter by status, priority, or employee if permitted
            if (req.query.employeeId && req.user.role !== roles_1.SystemRoles.EMPLOYEE) {
                filter.employeeId = new mongoose_1.default.Types.ObjectId(req.query.employeeId);
            }
            if (req.query.status) {
                filter.status = req.query.status;
            }
            if (req.query.priority) {
                filter.priority = req.query.priority;
            }
            // If senior manager and specific department filter is requested, filter by manager's department
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
            const goals = await performance_service_1.performanceService.getGoals(filter);
            return res.json({ success: true, data: goals });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async getById(req, res) {
        try {
            const id = req.params.id;
            const goal = await performance_service_1.performanceService.getGoalById(id);
            if (!goal) {
                return res.status(404).json({ success: false, message: 'Employee goal not found' });
            }
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            if (!scoped.allowed) {
                return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
            }
            if (req.user.role === roles_1.SystemRoles.EMPLOYEE) {
                if (goal.employeeId._id.toString() !== scoped.employeeId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: You cannot view goals of other employees' });
                }
            }
            else if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                const emp = await Employee_1.default.findById(goal.employeeId);
                if (!emp || emp.departmentId.toString() !== scoped.departmentId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: Goal belongs to another department' });
                }
            }
            return res.json({ success: true, data: goal });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async delete(req, res) {
        try {
            if (!(0, rbac_helper_1.hasWriteAccess)(req.user.role)) {
                return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions to delete goals' });
            }
            const id = req.params.id;
            const goal = await performance_service_1.performanceService.getGoalById(id);
            if (!goal) {
                return res.status(404).json({ success: false, message: 'Employee goal not found' });
            }
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                const targetEmployee = await Employee_1.default.findById(goal.employeeId);
                if (!targetEmployee || targetEmployee.departmentId.toString() !== scoped.departmentId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: Goal belongs to an employee outside your department' });
                }
            }
            await performance_service_1.performanceService.deleteGoal(id);
            return res.json({ success: true, message: 'Employee goal deleted successfully' });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.GoalController = GoalController;
exports.goalController = new GoalController();
