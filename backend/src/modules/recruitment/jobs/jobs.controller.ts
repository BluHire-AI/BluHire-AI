import { Response } from 'express';
import jobsService from './jobs.service';
import { createSuccessResponse, createErrorResponse, createPaginatedResponse } from '../../employee/dtos/common.dto';
import { JobQueryDTO } from '../repositories/job.repository';

export class JobsController {
  /**
   * Create Job Post
   * POST /api/v1/recruitment/jobs
   */
  async createJob(req: any, res: Response): Promise<void> {
    try {
      const { body, user } = req;
      const job = await jobsService.createJob(body, user._id);
      
      res.status(201).json(
        createSuccessResponse(job, 'Job created successfully', 201)
      );
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to create job post', undefined, 400)
      );
    }
  }

  /**
   * Get Job Details
   * GET /api/v1/recruitment/jobs/:id
   */
  async getJob(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const job = await jobsService.getJobDetails(id);

      if (!job) {
        res.status(404).json(createErrorResponse('Job post not found', undefined, 404));
        return;
      }

      res.json(createSuccessResponse(job, 'Job retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve job details', undefined, 400)
      );
    }
  }

  /**
   * Update Job Details
   * PATCH /api/v1/recruitment/jobs/:id
   */
  async updateJob(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { body, user } = req;
      const job = await jobsService.updateJob(id, body, user._id);

      if (!job) {
        res.status(404).json(createErrorResponse('Job post not found', undefined, 404));
        return;
      }

      res.json(createSuccessResponse(job, 'Job updated successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to update job details', undefined, 400)
      );
    }
  }

  /**
   * Delete Job Post (Soft Delete)
   * DELETE /api/v1/recruitment/jobs/:id
   */
  async deleteJob(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const job = await jobsService.deleteJob(id);

      if (!job) {
        res.status(404).json(createErrorResponse('Job post not found', undefined, 404));
        return;
      }

      res.json(createSuccessResponse(null, 'Job deleted successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to delete job post', undefined, 400)
      );
    }
  }

  /**
   * List Jobs with filtering and pagination (Recruiters)
   * GET /api/v1/recruitment/jobs
   */
  async listJobs(req: any, res: Response): Promise<void> {
    try {
      const query = req.query as JobQueryDTO;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await jobsService.listJobs(query, { page, limit });
      const paginatedResult = createPaginatedResponse(result.jobs, result.total, page, limit);

      res.json(createSuccessResponse(paginatedResult, 'Jobs retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to list jobs', undefined, 400)
      );
    }
  }

  /**
   * List Public Jobs (Careers Portal)
   * GET /api/v1/public/recruitment/jobs
   */
  async listPublicJobs(req: any, res: Response): Promise<void> {
    try {
      const query = req.query as JobQueryDTO;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await jobsService.listPublicJobs(query, { page, limit });
      const paginatedResult = createPaginatedResponse(result.jobs, result.total, page, limit);

      res.json(createSuccessResponse(paginatedResult, 'Careers jobs retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve career jobs', undefined, 400)
      );
    }
  }
}

export default new JobsController();
