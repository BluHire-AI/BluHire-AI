import { Request, Response } from 'express';
import EmployeeActivityService from '../services/employee-activity.service';
import { createSuccessResponse, createErrorResponse } from '../dtos/common.dto';
import { EmployeeActivityQueryDTO } from '../dtos/employee-activity.dto';

export class EmployeeActivityController {
  /**
   * Get activity by ID
   * GET /api/v1/activities/:id
   */
  async getActivity(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const activity = await EmployeeActivityService.getActivity(id);

      res.json(createSuccessResponse(activity, 'Activity retrieved successfully'));
    } catch (error: any) {
      res.status(404).json(
        createErrorResponse(error.message || 'Activity not found', undefined, 404)
      );
    }
  }

  /**
   * List activities
   * GET /api/v1/activities
   */
  async listActivities(req: any, res: Response): Promise<void> {
    try {
      const query = req.query as EmployeeActivityQueryDTO;
      const page = parseInt(query.page as any) || 1;
      const limit = parseInt(query.limit as any) || 10;

      const result = await EmployeeActivityService.listActivities(query, { page, limit });

      res.json(createSuccessResponse(result, 'Activities retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to list activities', undefined, 400)
      );
    }
  }

  /**
   * Get employee timeline
   * GET /api/v1/activities/employee/:employeeId/timeline
   */
  async getEmployeeTimeline(req: any, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const timeline = await EmployeeActivityService.getEmployeeTimeline(employeeId, limit);

      res.json(createSuccessResponse(timeline, 'Employee timeline retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve timeline', undefined, 400)
      );
    }
  }

  /**
   * Get activities by employee
   * GET /api/v1/activities/employee/:employeeId
   */
  async getByEmployee(req: any, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await EmployeeActivityService.getActivitiesByEmployee(employeeId, {
        page,
        limit,
      });

      res.json(createSuccessResponse(result, 'Activities retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve activities', undefined, 400)
      );
    }
  }

  /**
   * Get activities by type
   * GET /api/v1/activities/type/:activityType
   */
  async getByType(req: any, res: Response): Promise<void> {
    try {
      const { activityType } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await EmployeeActivityService.getActivitiesByType(
        activityType as any,
        { page, limit }
      );

      res.json(createSuccessResponse(result, 'Activities retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve activities', undefined, 400)
      );
    }
  }

  /**
   * Get recent activities
   * GET /api/v1/activities/recent
   */
  async getRecent(req: any, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;

      const activities = await EmployeeActivityService.getRecentActivities(limit);

      res.json(createSuccessResponse(activities, 'Recent activities retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve activities', undefined, 400)
      );
    }
  }

  /**
   * Get activities by date range
   * GET /api/v1/activities/date-range
   */
  async getByDateRange(req: any, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!startDate || !endDate) {
        res.status(400).json(
          createErrorResponse(
            'startDate and endDate query parameters are required',
            undefined,
            400
          )
        );
        return;
      }

      const result = await EmployeeActivityService.getActivitiesByDateRange(
        new Date(startDate as string),
        new Date(endDate as string),
        { page, limit }
      );

      res.json(createSuccessResponse(result, 'Activities retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve activities', undefined, 400)
      );
    }
  }

  /**
   * Get activity statistics
   * GET /api/v1/activities/stats/dashboard
   */
  async getStats(req: any, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const stats = await EmployeeActivityService.getActivityStats(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json(createSuccessResponse(stats, 'Activity statistics retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(
          error.message || 'Failed to retrieve statistics',
          undefined,
          400
        )
      );
    }
  }

  /**
   * Get activity summary
   * GET /api/v1/activities/summary/dashboard
   */
  async getSummary(req: any, res: Response): Promise<void> {
    try {
      const summary = await EmployeeActivityService.getActivitySummary();

      res.json(createSuccessResponse(summary, 'Activity summary retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve summary', undefined, 400)
      );
    }
  }

  /**
   * Get activity type distribution
   * GET /api/v1/activities/distribution
   */
  async getDistribution(req: any, res: Response): Promise<void> {
    try {
      const distribution = await EmployeeActivityService.getActivityTypeDistribution();

      res.json(
        createSuccessResponse(distribution, 'Activity distribution retrieved successfully')
      );
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(
          error.message || 'Failed to retrieve distribution',
          undefined,
          400
        )
      );
    }
  }

  /**
   * Search activities
   * GET /api/v1/activities/search/:query
   */
  async searchActivities(req: any, res: Response): Promise<void> {
    try {
      const { query } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await EmployeeActivityService.searchActivities(query, { page, limit });

      res.json(createSuccessResponse(result, 'Search results retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Search failed', undefined, 400)
      );
    }
  }

  /**
   * Get employee activity count
   * GET /api/v1/activities/employee/:employeeId/count
   */
  async getEmployeeActivityCount(req: any, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;

      const count = await EmployeeActivityService.getEmployeeActivityCount(employeeId);

      res.json(
        createSuccessResponse({ count }, 'Activity count retrieved successfully')
      );
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve count', undefined, 400)
      );
    }
  }
}

export default new EmployeeActivityController();
