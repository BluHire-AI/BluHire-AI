import jobRepository, { JobQueryDTO } from '../repositories/job.repository';
import recruitmentActivityRepository from '../repositories/recruitment-activity.repository';
import { IJob, JobStatus } from '../../../models/Job';
import { RecruitmentActivityType } from '../../../models/RecruitmentActivity';
import { PaginationDTO } from '../../employee/dtos/common.dto';
import JobModel from '../../../models/Job';

export class JobsService {
  /**
   * Generate a unique Job Code
   */
  private async generateJobCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await JobModel.countDocuments();
    const nextNumber = (count + 1).toString().padStart(4, '0');
    let jobCode = `JOB-${year}-${nextNumber}`;

    // Verify uniqueness
    let exists = await jobRepository.codeExists(jobCode);
    let retry = 0;
    while (exists && retry < 10) {
      retry++;
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      jobCode = `JOB-${year}-${nextNumber}-${randomSuffix}`;
      exists = await jobRepository.codeExists(jobCode);
    }
    return jobCode;
  }

  /**
   * Create new job
   */
  async createJob(jobData: Partial<IJob>, userId: string): Promise<IJob> {
    const jobCode = await this.generateJobCode();
    const job = await jobRepository.create({
      ...jobData,
      jobCode,
      createdBy: userId,
      status: jobData.status || JobStatus.DRAFT,
      publishedAt: jobData.status === JobStatus.OPEN ? new Date() : undefined,
    });

    // Log Activity
    await recruitmentActivityRepository.create({
      jobId: job._id,
      title: RecruitmentActivityType.JOB_CREATED,
      description: `Job "${job.title}" was created as ${job.status} by recruiter.`,
      createdBy: userId,
    });

    return job;
  }

  /**
   * Update Job Details
   */
  async updateJob(jobId: string, updateData: Partial<IJob>, userId: string): Promise<IJob | null> {
    const oldJob = await jobRepository.findById(jobId);
    if (!oldJob) {
      throw new Error('Job post not found');
    }

    const isPublishing = updateData.status === JobStatus.OPEN && oldJob.status !== JobStatus.OPEN;
    const isClosing = updateData.status === JobStatus.CLOSED && oldJob.status !== JobStatus.CLOSED;

    const dataToUpdate: Partial<IJob> = {
      ...updateData,
      updatedBy: userId,
    };

    if (isPublishing) {
      dataToUpdate.publishedAt = new Date();
    }

    const updatedJob = await jobRepository.update(jobId, dataToUpdate);

    if (updatedJob) {
      // Log status changes
      if (isPublishing) {
        await recruitmentActivityRepository.create({
          jobId: updatedJob._id,
          title: RecruitmentActivityType.JOB_CREATED,
          description: `Job "${updatedJob.title}" has been published and is now open.`,
          createdBy: userId,
        });
      } else if (isClosing) {
        await recruitmentActivityRepository.create({
          jobId: updatedJob._id,
          title: RecruitmentActivityType.JOB_CLOSED,
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
  async deleteJob(jobId: string): Promise<IJob | null> {
    return await jobRepository.softDelete(jobId);
  }

  /**
   * Get job description details
   */
  async getJobDetails(jobId: string): Promise<IJob | null> {
    return await jobRepository.findById(jobId);
  }

  /**
   * List jobs with filters and pagination (Admin/Recruiter)
   */
  async listJobs(query: JobQueryDTO, pagination: PaginationDTO) {
    return await jobRepository.findWithPagination(query, pagination);
  }

  /**
   * List open jobs for external Careers portal
   */
  async listPublicJobs(query: JobQueryDTO, pagination: PaginationDTO) {
    return await jobRepository.getPublicJobs(query, pagination);
  }
}

export default new JobsService();
