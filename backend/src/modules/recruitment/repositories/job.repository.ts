import JobModel, { IJob, JobStatus } from '../../../models/Job';
import { PaginationDTO } from '../../employee/dtos/common.dto';

export interface JobQueryDTO {
  search?: string;
  departmentId?: string;
  designationId?: string;
  status?: JobStatus;
  employmentType?: string;
  location?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class JobRepository {
  /**
   * Create a new job post
   */
  async create(jobData: Partial<IJob>): Promise<IJob> {
    const job = new JobModel(jobData);
    return await job.save();
  }

  /**
   * Find job by ID
   */
  async findById(jobId: string): Promise<IJob | null> {
    return await JobModel.findOne({ _id: jobId, isDeleted: false })
      .populate('departmentId', 'name')
      .populate('designationId', 'title')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');
  }

  /**
   * Find job by jobCode
   */
  async findByCode(jobCode: string): Promise<IJob | null> {
    return await JobModel.findOne({ jobCode: jobCode.toUpperCase(), isDeleted: false })
      .populate('departmentId', 'name')
      .populate('designationId', 'title');
  }

  /**
   * Update job
   */
  async update(jobId: string, updateData: Partial<IJob>): Promise<IJob | null> {
    return await JobModel.findOneAndUpdate(
      { _id: jobId, isDeleted: false },
      { ...updateData, updatedAt: new Date() },
      { returnDocument: 'after', runValidators: true }
    )
      .populate('departmentId', 'name')
      .populate('designationId', 'title');
  }

  /**
   * Soft delete job
   */
  async softDelete(jobId: string): Promise<IJob | null> {
    return await JobModel.findByIdAndUpdate(
      jobId,
      { isDeleted: true, updatedAt: new Date() },
      { returnDocument: 'after' }
    );
  }

  /**
   * List jobs with pagination and filters
   */
  async findWithPagination(
    query: JobQueryDTO,
    pagination: PaginationDTO = { page: 1, limit: 10 }
  ): Promise<{ jobs: IJob[]; total: number }> {
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(100, pagination.limit || 10);
    const skip = (page - 1) * limit;

    const filter: any = { isDeleted: false };

    // Apply filters
    if (query.departmentId) filter.departmentId = query.departmentId;
    if (query.designationId) filter.designationId = query.designationId;
    if (query.status) filter.status = query.status;
    if (query.employmentType) filter.employmentType = query.employmentType;
    if (query.location) filter.location = query.location;

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
    const sort: any = { [sortBy]: sortOrder };

    const [jobs, total] = await Promise.all([
      JobModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('departmentId', 'name')
        .populate('designationId', 'title'),
      JobModel.countDocuments(filter),
    ]);

    return { jobs, total };
  }

  /**
   * Get active public jobs (OPEN status only)
   */
  async getPublicJobs(
    query: JobQueryDTO,
    pagination: PaginationDTO = { page: 1, limit: 10 }
  ): Promise<{ jobs: IJob[]; total: number }> {
    return await this.findWithPagination(
      { ...query, status: JobStatus.OPEN },
      pagination
    );
  }

  /**
   * Get job count by status
   */
  async countByStatus(status: JobStatus): Promise<number> {
    return await JobModel.countDocuments({ status, isDeleted: false });
  }

  /**
   * Check if job code exists
   */
  async codeExists(jobCode: string): Promise<boolean> {
    const count = await JobModel.countDocuments({
      jobCode: jobCode.toUpperCase(),
      isDeleted: false,
    });
    return count > 0;
  }

  /**
   * Get total open jobs count
   */
  async countOpenJobs(): Promise<number> {
    return await JobModel.countDocuments({ status: JobStatus.OPEN, isDeleted: false });
  }

  /**
   * Get total jobs count (non-deleted)
   */
  async countAll(): Promise<number> {
    return await JobModel.countDocuments({ isDeleted: false });
  }
}

export default new JobRepository();
