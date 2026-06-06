"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationRepository = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Application_1 = __importStar(require("../../../models/Application"));
class ApplicationRepository {
    /**
     * Create new job application
     */
    async create(applicationData) {
        const application = new Application_1.default(applicationData);
        return await application.save();
    }
    /**
     * Find application by ID
     */
    async findById(applicationId) {
        return await Application_1.default.findOne({ _id: applicationId, isDeleted: false })
            .populate({
            path: 'candidateId',
            match: { isDeleted: false },
        })
            .populate({
            path: 'jobId',
            match: { isDeleted: false },
            populate: [
                { path: 'departmentId', select: 'name' },
                { path: 'designationId', select: 'title' },
            ],
        })
            .populate('employeeId');
    }
    /**
     * Find application by candidate ID and job ID to check duplicate
     */
    async findByCandidateAndJob(candidateId, jobId) {
        return await Application_1.default.findOne({
            candidateId,
            jobId,
            isDeleted: false,
        });
    }
    /**
     * Update application fields
     */
    async update(applicationId, updateData) {
        return await Application_1.default.findOneAndUpdate({ _id: applicationId, isDeleted: false }, { ...updateData, updatedAt: new Date() }, { returnDocument: 'after', runValidators: true })
            .populate('candidateId')
            .populate('jobId');
    }
    /**
     * Update application stage and record in stageHistory
     */
    async updateStage(applicationId, stage, userId, notes) {
        const historyItem = {
            stage,
            changedAt: new Date(),
            changedBy: userId,
            notes,
        };
        const updateFields = {
            currentStage: stage,
            $push: { stageHistory: historyItem },
            updatedAt: new Date(),
        };
        // Set lifecycle date flags
        if (stage === Application_1.ApplicationStage.SCREENING)
            updateFields.screenedAt = new Date();
        else if (stage === Application_1.ApplicationStage.INTERVIEW)
            updateFields.interviewedAt = new Date();
        else if (stage === Application_1.ApplicationStage.OFFER)
            updateFields.offeredAt = new Date();
        else if (stage === Application_1.ApplicationStage.HIRED) {
            updateFields.hiredAt = new Date();
            updateFields.status = 'HIRED';
        }
        else if (stage === Application_1.ApplicationStage.REJECTED) {
            updateFields.status = 'REJECTED';
        }
        return await Application_1.default.findOneAndUpdate({ _id: applicationId, isDeleted: false }, updateFields, { returnDocument: 'after' })
            .populate('candidateId')
            .populate('jobId');
    }
    /**
     * Soft delete application
     */
    async softDelete(applicationId) {
        return await Application_1.default.findByIdAndUpdate(applicationId, { isDeleted: true, updatedAt: new Date() }, { returnDocument: 'after' });
    }
    /**
     * List applications with filtering and search
     */
    async findWithPagination(query, pagination = { page: 1, limit: 10 }) {
        const page = Math.max(1, pagination.page || 1);
        const limit = Math.min(100, pagination.limit || 10);
        const skip = (page - 1) * limit;
        const pipeline = [];
        // 1. Match on application fields (first match stage)
        const matchStage = { isDeleted: false };
        if (query.jobId && query.jobId !== 'ALL' && query.jobId !== '') {
            matchStage.jobId = new mongoose_1.default.Types.ObjectId(query.jobId);
        }
        if (query.currentStage && query.currentStage !== 'ALL' && query.currentStage !== '') {
            matchStage.currentStage = query.currentStage;
        }
        if (query.status && query.status !== 'ALL' && query.status !== '') {
            matchStage.status = query.status;
        }
        if (query.aiScoreMin !== undefined && query.aiScoreMin !== null && query.aiScoreMin !== '') {
            matchStage.aiScore = { ...matchStage.aiScore, $gte: Number(query.aiScoreMin) };
        }
        if (query.aiScoreMax !== undefined && query.aiScoreMax !== null && query.aiScoreMax !== '') {
            matchStage.aiScore = { ...matchStage.aiScore, $lte: Number(query.aiScoreMax) };
        }
        // Date Range Filters
        if (query.startDate || query.endDate) {
            matchStage.appliedAt = {};
            if (query.startDate)
                matchStage.appliedAt.$gte = new Date(query.startDate);
            if (query.endDate)
                matchStage.appliedAt.$lte = new Date(query.endDate);
        }
        pipeline.push({ $match: matchStage });
        // 2. Lookup Candidate
        pipeline.push({
            $lookup: {
                from: 'candidates',
                localField: 'candidateId',
                foreignField: '_id',
                as: 'candidateId',
            },
        });
        pipeline.push({ $unwind: '$candidateId' });
        // Match Candidate fields
        const candidateMatch = { 'candidateId.isDeleted': false };
        if (query.search) {
            const searchRegex = new RegExp(query.search, 'i');
            candidateMatch.$or = [
                { 'candidateId.firstName': searchRegex },
                { 'candidateId.lastName': searchRegex },
                { 'candidateId.email': searchRegex },
                { 'candidateId.phone': searchRegex },
                { 'candidateId.candidateCode': searchRegex },
            ];
        }
        if (query.skill) {
            const skillRegex = new RegExp(query.skill, 'i');
            candidateMatch['candidateId.skills'] = { $in: [skillRegex] };
        }
        if (query.experience && query.experience !== 'ALL') {
            const expRegex = new RegExp(query.experience, 'i');
            candidateMatch['candidateId.experience'] = expRegex;
        }
        pipeline.push({ $match: candidateMatch });
        // 3. Lookup Job
        pipeline.push({
            $lookup: {
                from: 'jobs',
                localField: 'jobId',
                foreignField: '_id',
                as: 'jobId',
            },
        });
        pipeline.push({ $unwind: '$jobId' });
        pipeline.push({ $match: { 'jobId.isDeleted': false } });
        // 4. Lookup Job Department & Designation
        pipeline.push({
            $lookup: {
                from: 'departments',
                localField: 'jobId.departmentId',
                foreignField: '_id',
                as: 'jobId.departmentId',
            },
        });
        pipeline.push({
            $unwind: { path: '$jobId.departmentId', preserveNullAndEmptyArrays: true },
        });
        pipeline.push({
            $lookup: {
                from: 'designations',
                localField: 'jobId.designationId',
                foreignField: '_id',
                as: 'jobId.designationId',
            },
        });
        pipeline.push({
            $unwind: { path: '$jobId.designationId', preserveNullAndEmptyArrays: true },
        });
        // 5. Lookup Employee (preserve null)
        pipeline.push({
            $lookup: {
                from: 'employees',
                localField: 'employeeId',
                foreignField: '_id',
                as: 'employeeId',
            },
        });
        pipeline.push({
            $unwind: { path: '$employeeId', preserveNullAndEmptyArrays: true },
        });
        // 6. Sorting
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
        let sortStage = {};
        if (sortBy === 'candidate') {
            sortStage = { 'candidateId.firstName': sortOrder, 'candidateId.lastName': sortOrder };
        }
        else if (sortBy === 'job') {
            sortStage = { 'jobId.title': sortOrder };
        }
        else if (sortBy === 'experience') {
            sortStage = { 'candidateId.experience': sortOrder };
        }
        else if (sortBy === 'appliedDate') {
            sortStage = { appliedAt: sortOrder };
        }
        else {
            sortStage = { [sortBy]: sortOrder };
        }
        pipeline.push({ $sort: sortStage });
        // 7. Facet for count & skip/limit paginating
        pipeline.push({
            $facet: {
                metadata: [{ $count: 'total' }],
                data: [{ $skip: skip }, { $limit: limit }],
            },
        });
        const results = await Application_1.default.aggregate(pipeline);
        const total = results[0]?.metadata[0]?.total || 0;
        const applications = results[0]?.data || [];
        return { applications, total };
    }
    /**
     * Get application pipeline statistics
     */
    async getPipelineStats() {
        const results = await Application_1.default.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: '$currentStage', count: { $sum: 1 } } },
        ]);
        // Initial structure with 0s
        const stats = {
            [Application_1.ApplicationStage.APPLIED]: 0,
            [Application_1.ApplicationStage.SCREENING]: 0,
            [Application_1.ApplicationStage.SHORTLISTED]: 0,
            [Application_1.ApplicationStage.INTERVIEW]: 0,
            [Application_1.ApplicationStage.OFFER]: 0,
            [Application_1.ApplicationStage.HIRED]: 0,
            [Application_1.ApplicationStage.REJECTED]: 0,
        };
        results.forEach((res) => {
            if (stats[res._id] !== undefined) {
                stats[res._id] = res.count;
            }
        });
        return stats;
    }
    /**
     * Count applications
     */
    async countAll() {
        return await Application_1.default.countDocuments({ isDeleted: false });
    }
    /**
     * Count applications submitted today
     */
    async countNewToday() {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return await Application_1.default.countDocuments({
            createdAt: { $gte: startOfToday },
            isDeleted: false,
        });
    }
}
exports.ApplicationRepository = ApplicationRepository;
exports.default = new ApplicationRepository();
