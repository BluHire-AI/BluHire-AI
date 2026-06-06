"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceTrendService = exports.PerformanceTrendService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const PerformanceReview_1 = require("../../../models/PerformanceReview");
class PerformanceTrendService {
    async getEmployeeTrend(employeeId) {
        const reviews = await PerformanceReview_1.PerformanceReview.find({
            employeeId: new mongoose_1.default.Types.ObjectId(employeeId),
            status: PerformanceReview_1.ReviewStatus.SUBMITTED
        }).sort({ createdAt: 1 }).limit(100);
        if (reviews.length === 0) {
            return {
                employeeId,
                scores: [],
                periods: [],
                rollingAverage: 0,
                trendDirection: 'STABLE',
                scoreChange: 0
            };
        }
        const scores = reviews.map(r => r.overallScore);
        const periods = reviews.map(r => r.reviewPeriod);
        const sum = scores.reduce((a, b) => a + b, 0);
        const rollingAverage = Math.round((sum / scores.length) * 10) / 10;
        let trendDirection = 'STABLE';
        let scoreChange = 0;
        if (scores.length >= 2) {
            const latest = scores[scores.length - 1];
            const previous = scores[scores.length - 2];
            scoreChange = latest - previous;
            if (scoreChange > 2) {
                trendDirection = 'UPWARD';
            }
            else if (scoreChange < -2) {
                trendDirection = 'DOWNWARD';
            }
            else {
                trendDirection = 'STABLE';
            }
        }
        return {
            employeeId,
            scores,
            periods,
            rollingAverage,
            trendDirection,
            scoreChange
        };
    }
}
exports.PerformanceTrendService = PerformanceTrendService;
exports.performanceTrendService = new PerformanceTrendService();
