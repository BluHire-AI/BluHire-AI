"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecruitmentActivityRepository = void 0;
const RecruitmentActivity_1 = __importDefault(require("../../../models/RecruitmentActivity"));
class RecruitmentActivityRepository {
    /**
     * Log a recruitment activity
     */
    async create(activityData) {
        const activity = new RecruitmentActivity_1.default(activityData);
        return await activity.save();
    }
    /**
     * Get recent activity feed
     */
    async findRecent(limit = 20) {
        return await RecruitmentActivity_1.default.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('candidateId', 'firstName lastName email candidateCode')
            .populate('jobId', 'title jobCode')
            .populate('applicationId', 'currentStage')
            .populate('createdBy', 'firstName lastName email');
    }
}
exports.RecruitmentActivityRepository = RecruitmentActivityRepository;
exports.default = new RecruitmentActivityRepository();
