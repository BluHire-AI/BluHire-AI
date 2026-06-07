"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewRepository = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const InterviewTemplate_1 = __importDefault(require("../../../models/InterviewTemplate"));
const InterviewAssignment_1 = __importDefault(require("../../../models/InterviewAssignment"));
const InterviewSession_1 = __importDefault(require("../../../models/InterviewSession"));
const InterviewReport_1 = __importDefault(require("../../../models/InterviewReport"));
class InterviewRepository {
    // --- TEMPLATES ---
    async createTemplate(data) {
        return await new InterviewTemplate_1.default(data).save();
    }
    async findTemplateById(id) {
        return await InterviewTemplate_1.default.findOne({ _id: id, isArchived: false });
    }
    async findTemplates(filter = {}) {
        return await InterviewTemplate_1.default.find({ ...filter, isArchived: false }).sort({ createdAt: -1 });
    }
    async updateTemplate(id, data) {
        return await InterviewTemplate_1.default.findOneAndUpdate({ _id: id, isArchived: false }, { ...data, updatedAt: new Date() }, { returnDocument: 'after', runValidators: true });
    }
    async deleteTemplate(id) {
        return await InterviewTemplate_1.default.findByIdAndUpdate(id, { isArchived: true, updatedAt: new Date() }, { returnDocument: 'after' });
    }
    // --- ASSIGNMENTS ---
    async createAssignment(data) {
        return await new InterviewAssignment_1.default(data).save();
    }
    async findAssignmentById(id) {
        return await InterviewAssignment_1.default.findById(id)
            .populate({ path: 'candidateId', match: { isDeleted: false } })
            .populate({ path: 'jobId', match: { isDeleted: false } })
            .populate('interviewTemplateId');
    }
    async findAssignments(filter = {}) {
        return await InterviewAssignment_1.default.find(filter)
            .populate({ path: 'candidateId', match: { isDeleted: false } })
            .populate({ path: 'jobId', match: { isDeleted: false } })
            .populate('interviewTemplateId')
            .sort({ createdAt: -1 });
    }
    // --- SESSIONS ---
    async createSession(data) {
        return await new InterviewSession_1.default(data).save();
    }
    async findSessionById(id) {
        return await InterviewSession_1.default.findById(id)
            .populate('candidateId')
            .populate('jobId')
            .populate({
            path: 'assignmentId',
            populate: { path: 'interviewTemplateId' }
        });
    }
    async findSessionByAssignmentId(assignmentId) {
        return await InterviewSession_1.default.findOne({ assignmentId }).sort({ createdAt: -1 });
    }
    // --- DYNAMIC ANALYTICS ENGINE ---
    async getAggregatedAnalytics(filter = {}) {
        // Aggregates statistics dynamically across InterviewSession and InterviewReport collections
        const totalAssignments = await InterviewAssignment_1.default.countDocuments(filter);
        const completedAssignments = await InterviewAssignment_1.default.countDocuments({ ...filter, status: 'Completed' });
        const pendingAssignments = await InterviewAssignment_1.default.countDocuments({ ...filter, status: { $in: ['Pending', 'Started', 'In Progress'] } });
        // Average score aggregation
        const scoreAgg = await InterviewAssignment_1.default.aggregate([
            { $match: { ...filter, status: 'Completed', interviewScore: { $ne: null } } },
            { $group: { _id: null, avgScore: { $avg: '$interviewScore' } } }
        ]);
        const averageScore = scoreAgg.length > 0 ? Math.round(scoreAgg[0].avgScore) : 0;
        // Top performers (rank top 5 candidates)
        const topPerformers = await InterviewAssignment_1.default.find({ ...filter, status: 'Completed' })
            .populate('candidateId', 'firstName lastName candidateCode email')
            .populate('jobId', 'title jobCode')
            .sort({ finalCandidateScore: -1 })
            .limit(5)
            .lean();
        // Recommendation Distribution
        const recAgg = await InterviewReport_1.default.aggregate([
            {
                $match: filter.jobId
                    ? { jobId: new mongoose_1.default.Types.ObjectId(filter.jobId) }
                    : {}
            },
            { $group: { _id: '$hiringRecommendation', count: { $sum: 1 } } }
        ]);
        const recommendationDistribution = {
            'Strong Hire': 0,
            'Hire': 0,
            'Consider': 0,
            'Weak Consider': 0,
            'Reject': 0
        };
        recAgg.forEach((item) => {
            if (item._id && recommendationDistribution[item._id] !== undefined) {
                recommendationDistribution[item._id] = item.count;
            }
        });
        // Interview success rate (completed vs total)
        const successRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;
        return {
            totalAssignments,
            completedAssignments,
            pendingAssignments,
            averageScore,
            successRate,
            topPerformers: topPerformers.map(p => ({
                candidateName: p.candidateId ? `${p.candidateId.firstName} ${p.candidateId.lastName}` : 'N/A',
                candidateCode: p.candidateId?.candidateCode || 'N/A',
                jobTitle: p.jobId?.title || 'N/A',
                interviewScore: p.interviewScore,
                finalScore: p.finalCandidateScore
            })),
            recommendationDistribution
        };
    }
}
exports.InterviewRepository = InterviewRepository;
exports.default = new InterviewRepository();
