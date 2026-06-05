import { Response } from 'express';
import analyticsService from './analytics.service';
import { createSuccessResponse, createErrorResponse, createPaginatedResponse } from '../employee/dtos/common.dto';

export class AnalyticsController {
  /**
   * GET /api/v1/analytics/recruitment/overview
   */
  async getRecruitmentOverview(req: any, res: Response): Promise<void> {
    try {
      const stats = await analyticsService.getRecruitmentOverview(req.user, req.query);
      res.json(createSuccessResponse(stats, 'Recruitment overview retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve recruitment overview', undefined, 400)
      );
    }
  }

  /**
   * GET /api/v1/analytics/recruitment/funnel
   */
  async getRecruitmentFunnel(req: any, res: Response): Promise<void> {
    try {
      const stats = await analyticsService.getRecruitmentFunnel(req.user, req.query);
      res.json(createSuccessResponse(stats, 'Recruitment funnel retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve recruitment funnel', undefined, 400)
      );
    }
  }

  /**
   * GET /api/v1/analytics/ai-screening
   */
  async getAIScreeningStats(req: any, res: Response): Promise<void> {
    try {
      const stats = await analyticsService.getAIScreeningStats(req.user, req.query);
      res.json(createSuccessResponse(stats, 'AI Screening stats retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve AI screening statistics', undefined, 400)
      );
    }
  }

  /**
   * GET /api/v1/analytics/interviews
   */
  async getAIInterviewStats(req: any, res: Response): Promise<void> {
    try {
      const stats = await analyticsService.getAIInterviewStats(req.user, req.query);
      res.json(createSuccessResponse(stats, 'AI Interview stats retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve AI interview statistics', undefined, 400)
      );
    }
  }

  /**
   * GET /api/v1/analytics/recruiters
   */
  async getRecruiterPerformance(req: any, res: Response): Promise<void> {
    try {
      const stats = await analyticsService.getRecruiterPerformance(req.user, req.query);
      res.json(createSuccessResponse(stats, 'Recruiter leaderboard retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve recruiter leaderboard', undefined, 400)
      );
    }
  }

  /**
   * GET /api/v1/analytics/departments
   */
  async getDepartmentHiringStats(req: any, res: Response): Promise<void> {
    try {
      const stats = await analyticsService.getDepartmentHiringStats(req.user, req.query);
      res.json(createSuccessResponse(stats, 'Department stats retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve department stats', undefined, 400)
      );
    }
  }

  /**
   * GET /api/v1/analytics/jobs
   */
  async getJobPerformance(req: any, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { data, total } = await analyticsService.getJobPerformance(req.user, req.query);
      const paginatedResult = createPaginatedResponse(data, total, page, limit);

      res.json(createSuccessResponse(paginatedResult, 'Job performance stats retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve job performance stats', undefined, 400)
      );
    }
  }

  /**
   * GET /api/v1/analytics/skills
   */
  async getSkillsIntelligence(req: any, res: Response): Promise<void> {
    try {
      const stats = await analyticsService.getSkillsIntelligence(req.user, req.query);
      res.json(createSuccessResponse(stats, 'Skills intelligence retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve skills intelligence', undefined, 400)
      );
    }
  }

  /**
   * GET /api/v1/analytics/activity
   */
  async getRecruitmentActivityStats(req: any, res: Response): Promise<void> {
    try {
      const stats = await analyticsService.getRecruitmentActivityStats(req.user, req.query);
      res.json(createSuccessResponse(stats, 'Recruitment activity stats retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve recruitment activity stats', undefined, 400)
      );
    }
  }

  /**
   * GET /api/v1/analytics/export
   */
  async exportReport(req: any, res: Response): Promise<void> {
    try {
      const exportResult = await analyticsService.exportReport(req.user, req.query);
      
      res.setHeader('Content-Type', exportResult.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportResult.fileName}"`);
      res.send(exportResult.data);
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to export report', undefined, 400)
      );
    }
  }
}

export default new AnalyticsController();
