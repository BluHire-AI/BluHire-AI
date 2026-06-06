"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = exports.AnalyticsService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const PerformanceReview_1 = require("../../../models/PerformanceReview");
const EmployeeGoal_1 = require("../../../models/EmployeeGoal");
const SkillAssessment_1 = require("../../../models/SkillAssessment");
const PromotionAssessment_1 = require("../../../models/PromotionAssessment");
const Employee_1 = __importDefault(require("../../../models/Employee"));
class AnalyticsService {
    /**
     * Helper to get employee ObjectIds in a specific department
     */
    async getEmployeeIdsInDepartment(departmentId) {
        if (!departmentId)
            return null;
        const ids = await Employee_1.default.find({
            departmentId: departmentId,
            isDeleted: false
        }).distinct('_id');
        return ids.map(id => new mongoose_1.default.Types.ObjectId(id.toString()));
    }
    /**
     * Executive Overview metrics
     */
    async getOverview(departmentId) {
        const employeeIds = await this.getEmployeeIdsInDepartment(departmentId);
        // If a department is specified but has no employees, return empty/zero metrics
        if (departmentId && (!employeeIds || employeeIds.length === 0)) {
            return {
                overallAvgScore: 0,
                promotionReadyCount: 0,
                goalCompletionRate: 0,
                reviewCompletionRate: 0
            };
        }
        // 1. Overall average performance score (submitted reviews)
        const reviewMatch = { status: 'SUBMITTED' };
        if (employeeIds) {
            reviewMatch.employeeId = { $in: employeeIds };
        }
        const reviewStats = await PerformanceReview_1.PerformanceReview.aggregate([
            { $match: reviewMatch },
            { $group: { _id: null, avgScore: { $avg: '$overallScore' } } }
        ]);
        const overallAvgScore = reviewStats.length > 0 ? reviewStats[0].avgScore : 0;
        // 2. Promotion-ready candidate count (readinessScore >= 90)
        const promoMatch = { readinessScore: { $gte: 90 } };
        if (employeeIds) {
            promoMatch.employeeId = { $in: employeeIds };
        }
        const promotionReadyCount = await PromotionAssessment_1.PromotionAssessment.countDocuments(promoMatch);
        // 3. Goal completion rate
        const goalMatch = {};
        if (employeeIds) {
            goalMatch.employeeId = { $in: employeeIds };
        }
        const goalStats = await EmployeeGoal_1.EmployeeGoal.aggregate([
            { $match: goalMatch },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } }
                }
            }
        ]);
        const goalCompletionRate = goalStats.length > 0 && goalStats[0].total > 0
            ? (goalStats[0].completed / goalStats[0].total) * 100
            : 0;
        // 4. Review completion rate (submitted vs total)
        const reviewCompletionMatch = {};
        if (employeeIds) {
            reviewCompletionMatch.employeeId = { $in: employeeIds };
        }
        const reviewCompletionStats = await PerformanceReview_1.PerformanceReview.aggregate([
            { $match: reviewCompletionMatch },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    submitted: { $sum: { $cond: [{ $eq: ['$status', 'SUBMITTED'] }, 1, 0] } }
                }
            }
        ]);
        const reviewCompletionRate = reviewCompletionStats.length > 0 && reviewCompletionStats[0].total > 0
            ? (reviewCompletionStats[0].submitted / reviewCompletionStats[0].total) * 100
            : 0;
        return {
            overallAvgScore: Math.round(overallAvgScore * 10) / 10,
            promotionReadyCount,
            goalCompletionRate: Math.round(goalCompletionRate * 10) / 10,
            reviewCompletionRate: Math.round(reviewCompletionRate * 10) / 10
        };
    }
    /**
     * Top Performers (overallScore >= 90)
     */
    async getTopPerformers(departmentId) {
        const employeeIds = await this.getEmployeeIdsInDepartment(departmentId);
        if (departmentId && (!employeeIds || employeeIds.length === 0)) {
            return [];
        }
        const reviewMatch = { status: 'SUBMITTED', overallScore: { $gte: 90 } };
        if (employeeIds) {
            reviewMatch.employeeId = { $in: employeeIds };
        }
        return await PerformanceReview_1.PerformanceReview.aggregate([
            { $match: reviewMatch },
            { $sort: { overallScore: -1 } },
            { $limit: 100 },
            {
                $lookup: {
                    from: 'employees',
                    localField: 'employeeId',
                    foreignField: '_id',
                    as: 'employee'
                }
            },
            { $unwind: '$employee' },
            {
                $lookup: {
                    from: 'departments',
                    localField: 'employee.departmentId',
                    foreignField: '_id',
                    as: 'department'
                }
            },
            { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'designations',
                    localField: 'employee.designationId',
                    foreignField: '_id',
                    as: 'designation'
                }
            },
            { $unwind: { path: '$designation', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    reviewCode: 1,
                    overallScore: 1,
                    reviewPeriod: 1,
                    employee: {
                        _id: '$employee._id',
                        firstName: '$employee.firstName',
                        lastName: '$employee.lastName',
                        employeeCode: '$employee.employeeCode',
                        email: '$employee.email'
                    },
                    departmentName: '$department.name',
                    designationName: '$designation.name'
                }
            }
        ]);
    }
    /**
     * Promotion Ready assessments (readinessScore >= 75)
     */
    async getPromotionReady(departmentId) {
        const employeeIds = await this.getEmployeeIdsInDepartment(departmentId);
        if (departmentId && (!employeeIds || employeeIds.length === 0)) {
            return [];
        }
        const promoMatch = { readinessScore: { $gte: 75 } };
        if (employeeIds) {
            promoMatch.employeeId = { $in: employeeIds };
        }
        return await PromotionAssessment_1.PromotionAssessment.aggregate([
            { $match: promoMatch },
            { $sort: { readinessScore: -1 } },
            { $limit: 100 },
            {
                $lookup: {
                    from: 'employees',
                    localField: 'employeeId',
                    foreignField: '_id',
                    as: 'employee'
                }
            },
            { $unwind: '$employee' },
            {
                $lookup: {
                    from: 'departments',
                    localField: 'employee.departmentId',
                    foreignField: '_id',
                    as: 'department'
                }
            },
            { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'designations',
                    localField: 'employee.designationId',
                    foreignField: '_id',
                    as: 'designation'
                }
            },
            { $unwind: { path: '$designation', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    readinessScore: 1,
                    recommendedLevel: 1,
                    strengths: 1,
                    skillGaps: 1,
                    aiSummary: 1,
                    generatedAt: 1,
                    employee: {
                        _id: '$employee._id',
                        firstName: '$employee.firstName',
                        lastName: '$employee.lastName',
                        employeeCode: '$employee.employeeCode'
                    },
                    departmentName: '$department.name',
                    designationName: '$designation.name'
                }
            }
        ]);
    }
    /**
     * Skill Gap analysis
     */
    async getSkillGaps(departmentId) {
        const employeeIds = await this.getEmployeeIdsInDepartment(departmentId);
        if (departmentId && (!employeeIds || employeeIds.length === 0)) {
            return [];
        }
        const skillMatch = { gapScore: { $gt: 0 } };
        if (employeeIds) {
            skillMatch.employeeId = { $in: employeeIds };
        }
        return await SkillAssessment_1.SkillAssessment.aggregate([
            { $match: skillMatch },
            {
                $group: {
                    _id: '$skillName',
                    employeeCount: { $sum: 1 },
                    avgGapScore: { $avg: '$gapScore' }
                }
            },
            { $sort: { avgGapScore: -1 } },
            { $limit: 100 },
            {
                $project: {
                    _id: 0,
                    skillName: '$_id',
                    employeeCount: 1,
                    avgGapScore: { $round: ['$avgGapScore', 1] }
                }
            }
        ]);
    }
    /**
     * Goal status breakdowns
     */
    async getGoalCompletion(departmentId) {
        const employeeIds = await this.getEmployeeIdsInDepartment(departmentId);
        if (departmentId && (!employeeIds || employeeIds.length === 0)) {
            return { NOT_STARTED: 0, IN_PROGRESS: 0, COMPLETED: 0, OVERDUE: 0 };
        }
        const goalMatch = {};
        if (employeeIds) {
            goalMatch.employeeId = { $in: employeeIds };
        }
        const goalCompletion = await EmployeeGoal_1.EmployeeGoal.aggregate([
            { $match: goalMatch },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        const result = { NOT_STARTED: 0, IN_PROGRESS: 0, COMPLETED: 0, OVERDUE: 0 };
        goalCompletion.forEach((item) => {
            if (item._id in result) {
                result[item._id] = item.count;
            }
        });
        return result;
    }
    /**
     * Manager effectiveness ranking
     */
    async getManagerEffectiveness(departmentId) {
        const matchQuery = { isDeleted: false, managerId: { $ne: null } };
        if (departmentId) {
            matchQuery.departmentId = new mongoose_1.default.Types.ObjectId(departmentId);
        }
        return await Employee_1.default.aggregate([
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'performancereviews',
                    localField: '_id',
                    foreignField: 'employeeId',
                    as: 'reviews'
                }
            },
            {
                $addFields: {
                    submittedReviews: {
                        $filter: {
                            input: '$reviews',
                            as: 'rev',
                            cond: { $eq: ['$$rev.status', 'SUBMITTED'] }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'employeegoals',
                    localField: '_id',
                    foreignField: 'employeeId',
                    as: 'goals'
                }
            },
            {
                $group: {
                    _id: '$managerId',
                    teamCount: { $sum: 1 },
                    avgPerformanceScore: { $avg: { $avg: '$submittedReviews.overallScore' } },
                    totalGoals: { $sum: { $size: '$goals' } },
                    completedGoals: {
                        $sum: {
                            $size: {
                                $filter: {
                                    input: '$goals',
                                    as: 'goal',
                                    cond: { $eq: ['$$goal.status', 'COMPLETED'] }
                                }
                            }
                        }
                    }
                }
            },
            { $match: { _id: { $ne: null } } },
            {
                $lookup: {
                    from: 'employees',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'manager'
                }
            },
            { $unwind: '$manager' },
            {
                $project: {
                    _id: 1,
                    managerName: { $concat: ['$manager.firstName', ' ', '$manager.lastName'] },
                    teamCount: 1,
                    avgPerformanceScore: { $ifNull: [{ $round: ['$avgPerformanceScore', 1] }, 0] },
                    goalCompletionRate: {
                        $cond: [
                            { $gt: ['$totalGoals', 0] },
                            { $round: [{ $multiply: [{ $divide: ['$completedGoals', '$totalGoals'] }, 100] }, 1] },
                            0
                        ]
                    }
                }
            },
            { $sort: { avgPerformanceScore: -1 } },
            { $limit: 100 }
        ]);
    }
}
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();
