"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIController = void 0;
const Application_1 = __importDefault(require("../../../models/Application"));
const common_dto_1 = require("../../employee/dtos/common.dto");
const mongoose_1 = __importDefault(require("mongoose"));
class AIController {
    /**
     * Queue single application screening
     * POST /api/v1/ai/screen
     */
    async screen(req, res) {
        try {
            const { applicationId } = req.body;
            if (!applicationId) {
                res.status(400).json((0, common_dto_1.createErrorResponse)('applicationId is required'));
                return;
            }
            const app = await Application_1.default.findOneAndUpdate({ _id: applicationId, isDeleted: false }, { screeningStatus: 'PENDING', updatedAt: new Date() }, { returnDocument: 'after' });
            if (!app) {
                res.status(404).json((0, common_dto_1.createErrorResponse)('Application record not found'));
                return;
            }
            res.json((0, common_dto_1.createSuccessResponse)(null, 'Application successfully queued for AI screening.'));
        }
        catch (error) {
            res.status(500).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to queue screening'));
        }
    }
    /**
     * Queue bulk application screening
     * POST /api/v1/ai/screen/bulk
     */
    async screenBulk(req, res) {
        try {
            const { applicationIds, jobId } = req.body;
            let filter = { isDeleted: false };
            if (applicationIds && Array.isArray(applicationIds)) {
                filter._id = { $in: applicationIds.map(id => new mongoose_1.default.Types.ObjectId(id)) };
            }
            else if (jobId) {
                filter.jobId = new mongoose_1.default.Types.ObjectId(jobId);
            }
            else {
                res.status(400).json((0, common_dto_1.createErrorResponse)('Either applicationIds or jobId must be provided'));
                return;
            }
            const result = await Application_1.default.updateMany(filter, { $set: { screeningStatus: 'PENDING', updatedAt: new Date() } });
            res.json((0, common_dto_1.createSuccessResponse)({ modifiedCount: result.modifiedCount }, `Queued ${result.modifiedCount} applications for AI screening.`));
        }
        catch (error) {
            res.status(500).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to queue bulk screening'));
        }
    }
    /**
     * Get screening results for an application
     * GET /api/v1/ai/screen/:applicationId
     */
    async getScreenResult(req, res) {
        try {
            const { applicationId } = req.params;
            const app = await Application_1.default.findOne({ _id: applicationId, isDeleted: false })
                .populate('candidateId')
                .populate('jobId');
            if (!app) {
                res.status(404).json((0, common_dto_1.createErrorResponse)('Application record not found'));
                return;
            }
            res.json((0, common_dto_1.createSuccessResponse)({
                applicationId: app._id,
                screeningStatus: app.screeningStatus,
                aiScore: app.aiScore,
                aiRecommendation: app.aiRecommendation,
                matchingSkills: app.matchingSkills,
                missingSkills: app.missingSkills,
                screeningSummary: app.screeningSummary,
                notes: app.notes
            }));
        }
        catch (error) {
            res.status(500).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve screening details'));
        }
    }
    /**
     * Get AI recruitment analytics
     * GET /api/v1/ai/analytics
     */
    async getAnalytics(req, res) {
        try {
            // 1. Calculate Average AI Score
            const avgResult = await Application_1.default.aggregate([
                { $match: { isDeleted: false, screeningStatus: 'COMPLETED', aiScore: { $ne: null } } },
                { $group: { _id: null, avgScore: { $avg: '$aiScore' } } }
            ]);
            const averageAiScore = avgResult.length > 0 ? Math.round(avgResult[0].avgScore) : 0;
            // 2. Count recommendations
            const recResult = await Application_1.default.aggregate([
                { $match: { isDeleted: false, screeningStatus: 'COMPLETED' } },
                { $group: { _id: '$aiRecommendation', count: { $sum: 1 } } }
            ]);
            const counts = {
                'Strong Hire': 0,
                'Hire': 0,
                'Needs Review': 0,
                'Reject': 0
            };
            recResult.forEach(item => {
                if (item._id && counts[item._id] !== undefined) {
                    counts[item._id] = item.count;
                }
            });
            // 3. Top matching and missing skills
            const matchingSkillsResult = await Application_1.default.aggregate([
                { $match: { isDeleted: false, screeningStatus: 'COMPLETED' } },
                { $unwind: '$matchingSkills' },
                { $group: { _id: '$matchingSkills', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]);
            const missingSkillsResult = await Application_1.default.aggregate([
                { $match: { isDeleted: false, screeningStatus: 'COMPLETED' } },
                { $unwind: '$missingSkills' },
                { $group: { _id: '$missingSkills', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]);
            res.json((0, common_dto_1.createSuccessResponse)({
                averageAiScore,
                strongHireCount: counts['Strong Hire'],
                hireCount: counts['Hire'],
                needsReviewCount: counts['Needs Review'],
                rejectCount: counts['Reject'],
                topMatchingSkills: matchingSkillsResult.map(s => ({ skill: s._id, count: s.count })),
                topMissingSkills: missingSkillsResult.map(s => ({ skill: s._id, count: s.count }))
            }));
        }
        catch (error) {
            res.status(500).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve AI analytics'));
        }
    }
    /**
     * Health check for AI service
     * GET /api/v1/ai/health
     */
    async healthCheck(req, res) {
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1/ai';
        try {
            const response = await fetch(`${aiServiceUrl}/health`);
            if (!response.ok) {
                throw new Error(`AI Service returned status ${response.status}`);
            }
            const data = await response.json();
            res.json(data);
        }
        catch (error) {
            res.status(200).json({
                status: "unhealthy",
                openRouter: false,
                model: "Unknown",
                error: error.message || "AI Service Offline"
            });
        }
    }
}
exports.AIController = AIController;
exports.default = new AIController();
