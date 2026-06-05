"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsService = void 0;
const job_repository_1 = __importDefault(require("../repositories/job.repository"));
const recruitment_activity_repository_1 = __importDefault(require("../repositories/recruitment-activity.repository"));
const Job_1 = require("../../../models/Job");
const RecruitmentActivity_1 = require("../../../models/RecruitmentActivity");
const Job_2 = __importDefault(require("../../../models/Job"));
class JobsService {
    /**
     * Generate a unique Job Code
     */
    async generateJobCode() {
        const year = new Date().getFullYear();
        const count = await Job_2.default.countDocuments();
        const nextNumber = (count + 1).toString().padStart(4, '0');
        let jobCode = `JOB-${year}-${nextNumber}`;
        // Verify uniqueness
        let exists = await job_repository_1.default.codeExists(jobCode);
        let retry = 0;
        while (exists && retry < 10) {
            retry++;
            const randomSuffix = Math.floor(100 + Math.random() * 900);
            jobCode = `JOB-${year}-${nextNumber}-${randomSuffix}`;
            exists = await job_repository_1.default.codeExists(jobCode);
        }
        return jobCode;
    }
    /**
     * Create new job
     */
    async createJob(jobData, userId) {
        const jobCode = await this.generateJobCode();
        const job = await job_repository_1.default.create({
            ...jobData,
            jobCode,
            createdBy: userId,
            status: jobData.status || Job_1.JobStatus.DRAFT,
            publishedAt: jobData.status === Job_1.JobStatus.OPEN ? new Date() : undefined,
        });
        // Log Activity
        await recruitment_activity_repository_1.default.create({
            jobId: job._id,
            title: RecruitmentActivity_1.RecruitmentActivityType.JOB_CREATED,
            description: `Job "${job.title}" was created as ${job.status} by recruiter.`,
            createdBy: userId,
        });
        return job;
    }
    /**
     * Update Job Details
     */
    async updateJob(jobId, updateData, userId) {
        const oldJob = await job_repository_1.default.findById(jobId);
        if (!oldJob) {
            throw new Error('Job post not found');
        }
        const isPublishing = updateData.status === Job_1.JobStatus.OPEN && oldJob.status !== Job_1.JobStatus.OPEN;
        const isClosing = updateData.status === Job_1.JobStatus.CLOSED && oldJob.status !== Job_1.JobStatus.CLOSED;
        const dataToUpdate = {
            ...updateData,
            updatedBy: userId,
        };
        if (isPublishing) {
            dataToUpdate.publishedAt = new Date();
        }
        const updatedJob = await job_repository_1.default.update(jobId, dataToUpdate);
        if (updatedJob) {
            // Log status changes
            if (isPublishing) {
                await recruitment_activity_repository_1.default.create({
                    jobId: updatedJob._id,
                    title: RecruitmentActivity_1.RecruitmentActivityType.JOB_CREATED,
                    description: `Job "${updatedJob.title}" has been published and is now open.`,
                    createdBy: userId,
                });
            }
            else if (isClosing) {
                await recruitment_activity_repository_1.default.create({
                    jobId: updatedJob._id,
                    title: RecruitmentActivity_1.RecruitmentActivityType.JOB_CLOSED,
                    description: `Job "${updatedJob.title}" has been closed.`,
                    createdBy: userId,
                });
            }
        }
        return updatedJob;
    }
    /**
     * Delete job post (soft delete)
     */
    async deleteJob(jobId) {
        return await job_repository_1.default.softDelete(jobId);
    }
    /**
     * Get job description details
     */
    async getJobDetails(jobId) {
        return await job_repository_1.default.findById(jobId);
    }
    /**
     * List jobs with filters and pagination (Admin/Recruiter)
     */
    async listJobs(query, pagination) {
        return await job_repository_1.default.findWithPagination(query, pagination);
    }
    /**
     * List open jobs for external Careers portal
     */
    async listPublicJobs(query, pagination) {
        return await job_repository_1.default.getPublicJobs(query, pagination);
    }
}
exports.JobsService = JobsService;
exports.default = new JobsService();
