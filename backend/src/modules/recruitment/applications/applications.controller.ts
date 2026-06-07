import { Response } from 'express';
import applicationsService from './applications.service';
import { createSuccessResponse, createErrorResponse, createPaginatedResponse } from '../../employee/dtos/common.dto';
import { ApplicationQueryDTO } from '../repositories/application.repository';
import path from 'path';
import fs from 'fs';

export class ApplicationsController {
  /**
   * Apply to Job Post (Public Career Portal)
   * POST /api/v1/public/recruitment/apply
   */
  async applyToJob(req: any, res: Response): Promise<void> {
    try {
      const { jobId, email, firstName, lastName, phone, skills, currentCompany, currentDesignation, expectedSalary, noticePeriod, experience, education, linkedinUrl, portfolioUrl } = req.body;
      const file = req.file;

      // Parse skills if string array passed as JSON string
      let parsedSkills = skills;
      if (typeof skills === 'string') {
        try {
          parsedSkills = JSON.parse(skills);
        } catch {
          parsedSkills = skills.split(',').map((s: string) => s.trim());
        }
      }

      const candidateData = {
        firstName,
        lastName,
        email,
        phone,
        skills: parsedSkills || [],
        currentCompany,
        currentDesignation,
        expectedSalary: parseFloat(expectedSalary) || undefined,
        noticePeriod,
        experience,
        education,
        linkedinUrl,
        portfolioUrl,
      };

      const application = await applicationsService.applyToJob(candidateData, jobId, file);

      res.status(201).json(
        createSuccessResponse(application, 'Application submitted successfully', 201)
      );
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to submit application', undefined, 400)
      );
    }
  }

  /**
   * Move Application Stage (Recruiter Board)
   * PATCH /api/v1/recruitment/applications/:id/stage
   */
  async moveStage(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { stage, notes } = req.body;
      const { user } = req;

      const application = await applicationsService.moveStage(id, stage, user._id, notes);

      res.json(createSuccessResponse(application, 'Application stage updated successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to transition application stage', undefined, 400)
      );
    }
  }

  /**
   * List Applications
   * GET /api/v1/recruitment/applications
   */
  async listApplications(req: any, res: Response): Promise<void> {
    try {
      const query = req.query as ApplicationQueryDTO;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await applicationsService.listApplications(query, { page, limit });
      const paginatedResult = createPaginatedResponse(result.applications, result.total, page, limit);

      res.json(createSuccessResponse(paginatedResult, 'Applications retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to list applications', undefined, 400)
      );
    }
  }

  /**
   * Get Pipeline Kanban Data
   * GET /api/v1/recruitment/pipeline
   */
  async getPipeline(req: any, res: Response): Promise<void> {
    try {
      const { jobId } = req.query;
      const pipeline = await applicationsService.getPipeline(jobId);

      res.json(createSuccessResponse(pipeline, 'Pipeline board details retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve pipeline board', undefined, 400)
      );
    }
  }

  /**
   * Get Recruitment Dashboard Analytics
   * GET /api/v1/recruitment/analytics
   */
  async getAnalytics(req: any, res: Response): Promise<void> {
    try {
      const stats = await applicationsService.getAnalytics();

      res.json(createSuccessResponse(stats, 'Recruitment analytics retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve recruitment statistics', undefined, 400)
      );
    }
  }

  /**
   * Get Recruitment Activity Feed
   * GET /api/v1/recruitment/activities
   */
  async getActivities(req: any, res: Response): Promise<void> {
    try {
      const feed = await applicationsService.getActivities();

      res.json(createSuccessResponse(feed, 'Recruitment activities retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve activities feed', undefined, 400)
      );
    }
  }

  /**
   * Secure Resume File Streaming Download
   * GET /api/v1/recruitment/resumes/download/:filename
   */
  async downloadResume(req: any, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), 'uploads', 'resumes', filename);

      if (!fs.existsSync(filePath)) {
        res.status(404).json(createErrorResponse('Resume file not found', undefined, 404));
        return;
      }

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to stream resume file download', undefined, 400)
      );
    }
  }
  /**
   * Invite candidate to AI Interview
   * POST /api/v1/recruitment/applications/:id/invite
   */
  async inviteToInterview(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { user } = req;

      const session = await applicationsService.inviteToInterview(id, user._id);

      res.status(201).json(createSuccessResponse(session, 'Interview invitation sent successfully', 201));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to send interview invitation', undefined, 400)
      );
    }
  }

  /**
   * Hire Candidate — Create Employee + User account + Send Onboarding Email
   * POST /api/v1/recruitment/applications/:id/hire
   */
  async hireCandidate(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { user } = req;

      const result = await applicationsService.hireCandidate(id, user._id);

      res.status(201).json(createSuccessResponse(result, 'Candidate hired successfully. Onboarding email sent!', 201));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to hire candidate', undefined, 400)
      );
    }
  }
}

export default new ApplicationsController();
