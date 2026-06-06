"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewController = exports.ReviewController = void 0;
const performance_service_1 = require("../services/performance.service");
const performance_validator_1 = require("../validators/performance.validator");
const rbac_helper_1 = require("./rbac.helper");
const roles_1 = require("../../../models/roles");
const Employee_1 = __importDefault(require("../../../models/Employee"));
const zod_1 = require("zod");
class ReviewController {
    async create(req, res) {
        try {
            if (!(0, rbac_helper_1.hasWriteAccess)(req.user.role)) {
                return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions to create reviews' });
            }
            const validatedData = performance_validator_1.createReviewSchema.parse(req.body);
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                const targetEmployee = await Employee_1.default.findById(validatedData.employeeId);
                if (!targetEmployee || targetEmployee.departmentId.toString() !== scoped.departmentId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: Employee is not within your department' });
                }
            }
            const review = await performance_service_1.performanceService.createReview(validatedData, req.user._id);
            return res.status(201).json({ success: true, data: review });
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
            if (!(0, rbac_helper_1.hasWriteAccess)(req.user.role)) {
                return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions to update reviews' });
            }
            const validatedData = performance_validator_1.updateReviewSchema.parse(req.body);
            const id = req.params.id;
            const review = await performance_service_1.performanceService.getReviewById(id);
            if (!review) {
                return res.status(404).json({ success: false, message: 'Performance review not found' });
            }
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                const targetEmployee = await Employee_1.default.findById(review.employeeId);
                if (!targetEmployee || targetEmployee.departmentId.toString() !== scoped.departmentId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: Review belongs to an employee outside your department' });
                }
            }
            const updatedReview = await performance_service_1.performanceService.updateReview(id, validatedData);
            return res.json({ success: true, data: updatedReview });
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
                return res.status(403).json({ success: false, message: 'Forbidden: User context is invalid' });
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filter = { ...scoped.filter };
            // Apply query filters if permitted
            if (req.query.employeeId && req.user.role !== roles_1.SystemRoles.EMPLOYEE) {
                filter.employeeId = new mongoose_1.default.Types.ObjectId(req.query.employeeId);
            }
            if (req.query.reviewPeriod) {
                filter.reviewPeriod = req.query.reviewPeriod;
            }
            if (req.query.reviewType) {
                filter.reviewType = req.query.reviewType;
            }
            if (req.query.status) {
                filter.status = req.query.status;
            }
            // If senior manager and specific department filter is requested, filter by manager's department
            if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER && scoped.employeeIds) {
                // Enforce the department employee ID list
                filter.employeeId = { $in: scoped.employeeIds.map(id => new mongoose_1.default.Types.ObjectId(id)) };
            }
            else if (req.query.departmentId && (req.user.role === roles_1.SystemRoles.MANAGEMENT_ADMIN || req.user.role === roles_1.SystemRoles.HR_RECRUITER)) {
                // Find employees of the specified department
                const employeeIds = await Employee_1.default.find({
                    departmentId: req.query.departmentId,
                    isDeleted: false
                }).distinct('_id');
                filter.employeeId = { $in: employeeIds };
            }
            const result = await performance_service_1.performanceService.getReviews(filter, page, limit);
            return res.json({ success: true, ...result });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async getById(req, res) {
        try {
            const id = req.params.id;
            const review = await performance_service_1.performanceService.getReviewById(id);
            if (!review) {
                return res.status(404).json({ success: false, message: 'Performance review not found' });
            }
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            if (!scoped.allowed) {
                return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
            }
            // Validate resource access scope
            if (req.user.role === roles_1.SystemRoles.EMPLOYEE) {
                if (review.employeeId._id.toString() !== scoped.employeeId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: You cannot view reviews of other employees' });
                }
            }
            else if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                const emp = await Employee_1.default.findById(review.employeeId);
                if (!emp || emp.departmentId.toString() !== scoped.departmentId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: Review belongs to another department' });
                }
            }
            return res.json({ success: true, data: review });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async delete(req, res) {
        try {
            if (!(0, rbac_helper_1.hasWriteAccess)(req.user.role)) {
                return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions to delete reviews' });
            }
            const id = req.params.id;
            const review = await performance_service_1.performanceService.getReviewById(id);
            if (!review) {
                return res.status(404).json({ success: false, message: 'Performance review not found' });
            }
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                const targetEmployee = await Employee_1.default.findById(review.employeeId);
                if (!targetEmployee || targetEmployee.departmentId.toString() !== scoped.departmentId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: Review belongs to an employee outside your department' });
                }
            }
            await performance_service_1.performanceService.deleteReview(id);
            return res.json({ success: true, message: 'Performance review deleted successfully' });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async getComparison(req, res) {
        try {
            const employeeId = req.params.employeeId;
            const scoped = await (0, rbac_helper_1.getScopedAccess)(req.user);
            if (req.user.role === roles_1.SystemRoles.EMPLOYEE) {
                if (employeeId !== scoped.employeeId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: You cannot view comparison data of other employees' });
                }
            }
            else if (req.user.role === roles_1.SystemRoles.SENIOR_MANAGER) {
                const emp = await Employee_1.default.findById(employeeId);
                if (!emp || emp.departmentId.toString() !== scoped.departmentId) {
                    return res.status(403).json({ success: false, message: 'Forbidden: Employee belongs to another department' });
                }
            }
            const reviews = await PerformanceReview_1.PerformanceReview.find({
                employeeId: new mongoose_1.default.Types.ObjectId(employeeId),
                status: PerformanceReview_1.ReviewStatus.SUBMITTED
            }).sort({ createdAt: 1 });
            const periodMap = new Map();
            for (const r of reviews) {
                const period = r.reviewPeriod;
                if (!periodMap.has(period)) {
                    periodMap.set(period, {});
                }
                const entry = periodMap.get(period);
                if (r.reviewSource === 'SELF') {
                    entry.self = r;
                }
                else if (r.reviewSource === 'MANAGER') {
                    entry.manager = r;
                }
            }
            const comparisons = [];
            for (const [period, data] of periodMap.entries()) {
                comparisons.push({
                    reviewPeriod: period,
                    self: data.self ? {
                        overallScore: data.self.overallScore,
                        communicationScore: data.self.communicationScore,
                        technicalScore: data.self.technicalScore,
                        leadershipScore: data.self.leadershipScore,
                        productivityScore: data.self.productivityScore,
                        teamworkScore: data.self.teamworkScore,
                        comments: data.self.comments
                    } : null,
                    manager: data.manager ? {
                        overallScore: data.manager.overallScore,
                        communicationScore: data.manager.communicationScore,
                        technicalScore: data.manager.technicalScore,
                        leadershipScore: data.manager.leadershipScore,
                        productivityScore: data.manager.productivityScore,
                        teamworkScore: data.manager.teamworkScore,
                        comments: data.manager.comments
                    } : null,
                    gap: (data.manager && data.self) ? (data.manager.overallScore - data.self.overallScore) : 0
                });
            }
            return res.json({ success: true, data: comparisons });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.ReviewController = ReviewController;
const mongoose_1 = __importDefault(require("mongoose"));
const PerformanceReview_1 = require("../../../models/PerformanceReview");
exports.reviewController = new ReviewController();
