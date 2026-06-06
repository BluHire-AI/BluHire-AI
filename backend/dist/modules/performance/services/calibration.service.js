"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceCalibrationService = exports.PerformanceCalibrationService = void 0;
const PerformanceReview_1 = require("../../../models/PerformanceReview");
const Employee_1 = __importDefault(require("../../../models/Employee"));
class PerformanceCalibrationService {
    async getCalibration(filter = {}) {
        // Exclude soft-deleted employees
        const employees = await Employee_1.default.find({ ...filter, isDeleted: false }).limit(100);
        const employeeIds = employees.map(e => e._id);
        // Fetch the latest submitted review for each employee
        const reviews = await PerformanceReview_1.PerformanceReview.find({
            employeeId: { $in: employeeIds },
            status: PerformanceReview_1.ReviewStatus.SUBMITTED
        }).populate('employeeId', 'firstName lastName employeeCode departmentId designationId')
            .sort({ createdAt: -1 });
        // Use a Map to only keep the latest review per employee
        const latestReviewsMap = new Map();
        for (const review of reviews) {
            const empIdStr = review.employeeId._id.toString();
            if (!latestReviewsMap.has(empIdStr)) {
                latestReviewsMap.set(empIdStr, review);
            }
        }
        const latestReviews = Array.from(latestReviewsMap.values());
        const top = [];
        const strong = [];
        const average = [];
        const needsImprovement = [];
        for (const r of latestReviews) {
            const score = r.overallScore;
            if (score >= 90) {
                top.push(r);
            }
            else if (score >= 75) {
                strong.push(r);
            }
            else if (score >= 50) {
                average.push(r);
            }
            else {
                needsImprovement.push(r);
            }
        }
        const total = latestReviews.length;
        const distribution = {
            top: { count: top.length, percentage: total > 0 ? Math.round((top.length / total) * 100) : 0 },
            strong: { count: strong.length, percentage: total > 0 ? Math.round((strong.length / total) * 100) : 0 },
            average: { count: average.length, percentage: total > 0 ? Math.round((average.length / total) * 100) : 0 },
            needsImprovement: { count: needsImprovement.length, percentage: total > 0 ? Math.round((needsImprovement.length / total) * 100) : 0 }
        };
        return {
            distribution,
            categories: {
                top,
                strong,
                average,
                needsImprovement
            }
        };
    }
}
exports.PerformanceCalibrationService = PerformanceCalibrationService;
exports.performanceCalibrationService = new PerformanceCalibrationService();
