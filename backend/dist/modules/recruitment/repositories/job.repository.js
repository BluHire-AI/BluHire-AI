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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobRepository = void 0;
const Job_1 = __importStar(require("../../../models/Job"));
class JobRepository {
    /**
     * Create a new job post
     */
    async create(jobData) {
        const job = new Job_1.default(jobData);
        return await job.save();
    }
    /**
     * Find job by ID
     */
    async findById(jobId) {
        return await Job_1.default.findOne({ _id: jobId, isDeleted: false })
            .populate('departmentId', 'name')
            .populate('designationId', 'title')
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');
    }
    /**
     * Find job by jobCode
     */
    async findByCode(jobCode) {
        return await Job_1.default.findOne({ jobCode: jobCode.toUpperCase(), isDeleted: false })
            .populate('departmentId', 'name')
            .populate('designationId', 'title');
    }
    /**
     * Update job
     */
    async update(jobId, updateData) {
        return await Job_1.default.findOneAndUpdate({ _id: jobId, isDeleted: false }, { ...updateData, updatedAt: new Date() }, { returnDocument: 'after', runValidators: true })
            .populate('departmentId', 'name')
            .populate('designationId', 'title');
    }
    /**
     * Soft delete job
     */
    async softDelete(jobId) {
        return await Job_1.default.findByIdAndUpdate(jobId, { isDeleted: true, updatedAt: new Date() }, { returnDocument: 'after' });
    }
    /**
     * List jobs with pagination and filters
     */
    async findWithPagination(query, pagination = { page: 1, limit: 10 }) {
        const page = Math.max(1, pagination.page || 1);
        const limit = Math.min(100, pagination.limit || 10);
        const skip = (page - 1) * limit;
        const filter = { isDeleted: false };
        // Apply filters
        if (query.departmentId)
            filter.departmentId = query.departmentId;
        if (query.designationId)
            filter.designationId = query.designationId;
        if (query.status)
            filter.status = query.status;
        if (query.employmentType)
            filter.employmentType = query.employmentType;
        if (query.location)
            filter.location = query.location;
        // Apply search search matches title, jobCode
        if (query.search) {
            filter.$or = [
                { jobCode: new RegExp(query.search, 'i') },
                { title: new RegExp(query.search, 'i') },
                { description: new RegExp(query.search, 'i') },
            ];
        }
        // Determine sort
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
        const sort = { [sortBy]: sortOrder };
        const [jobs, total] = await Promise.all([
            Job_1.default.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('departmentId', 'name')
                .populate('designationId', 'title'),
            Job_1.default.countDocuments(filter),
        ]);
        return { jobs, total };
    }
    /**
     * Get active public jobs (OPEN status only)
     */
    async getPublicJobs(query, pagination = { page: 1, limit: 10 }) {
        return await this.findWithPagination({ ...query, status: Job_1.JobStatus.OPEN }, pagination);
    }
    /**
     * Get job count by status
     */
    async countByStatus(status) {
        return await Job_1.default.countDocuments({ status, isDeleted: false });
    }
    /**
     * Check if job code exists
     */
    async codeExists(jobCode) {
        const count = await Job_1.default.countDocuments({
            jobCode: jobCode.toUpperCase(),
            isDeleted: false,
        });
        return count > 0;
    }
    /**
     * Get total open jobs count
     */
    async countOpenJobs() {
        return await Job_1.default.countDocuments({ status: Job_1.JobStatus.OPEN, isDeleted: false });
    }
    /**
     * Get total jobs count (non-deleted)
     */
    async countAll() {
        return await Job_1.default.countDocuments({ isDeleted: false });
    }
}
exports.JobRepository = JobRepository;
exports.default = new JobRepository();
