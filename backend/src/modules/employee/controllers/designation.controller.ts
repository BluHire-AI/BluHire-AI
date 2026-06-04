import { Request, Response } from 'express';
import DesignationService from '../services/designation.service';
import { createSuccessResponse, createErrorResponse } from '../dtos/common.dto';
import { DesignationQueryDTO } from '../dtos/designation.dto';

export class DesignationController {
  /**
   * Create designation
   * POST /api/v1/designations
   */
  async createDesignation(req: any, res: Response): Promise<void> {
    try {
      const { body, user } = req;

      const designation = await DesignationService.createDesignation(body, user._id);

      res.status(201).json(
        createSuccessResponse(designation, 'Designation created successfully', 201)
      );
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to create designation', undefined, 400)
      );
    }
  }

  /**
   * Get designation by ID
   * GET /api/v1/designations/:id
   */
  async getDesignation(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const designation = await DesignationService.getDesignation(id);

      res.json(createSuccessResponse(designation, 'Designation retrieved successfully'));
    } catch (error: any) {
      res.status(404).json(
        createErrorResponse(error.message || 'Designation not found', undefined, 404)
      );
    }
  }

  /**
   * List designations
   * GET /api/v1/designations
   */
  async listDesignations(req: any, res: Response): Promise<void> {
    try {
      const query = req.query as DesignationQueryDTO;
      const page = parseInt(query.page as any) || 1;
      const limit = parseInt(query.limit as any) || 10;

      const result = await DesignationService.listDesignations(query, { page, limit });

      res.json(createSuccessResponse(result, 'Designations retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to list designations', undefined, 400)
      );
    }
  }

  /**
   * Get all designations
   * GET /api/v1/designations/all
   */
  async getAllDesignations(req: any, res: Response): Promise<void> {
    try {
      const designations = await DesignationService.getAllDesignations();

      res.json(createSuccessResponse(designations, 'All designations retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(
          error.message || 'Failed to retrieve all designations',
          undefined,
          400
        )
      );
    }
  }

  /**
   * Get designations by department
   * GET /api/v1/designations/by-department/:departmentId
   */
  async getByDepartment(req: any, res: Response): Promise<void> {
    try {
      const { departmentId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await DesignationService.getDesignationsByDepartment(
        departmentId,
        { page, limit }
      );

      res.json(createSuccessResponse(result, 'Designations retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(
          error.message || 'Failed to retrieve designations',
          undefined,
          400
        )
      );
    }
  }

  /**
   * Get designations by level
   * GET /api/v1/designations/by-level/:level
   */
  async getByLevel(req: any, res: Response): Promise<void> {
    try {
      const { level } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await DesignationService.getDesignationsByLevel(
        parseInt(level),
        { page, limit }
      );

      res.json(createSuccessResponse(result, 'Designations retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(
          error.message || 'Failed to retrieve designations',
          undefined,
          400
        )
      );
    }
  }

  /**
   * Get all levels
   * GET /api/v1/designations/levels
   */
  async getLevels(req: any, res: Response): Promise<void> {
    try {
      const levels = await DesignationService.getAllLevels();

      res.json(createSuccessResponse(levels, 'Designation levels retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve levels', undefined, 400)
      );
    }
  }

  /**
   * Update designation
   * PUT /api/v1/designations/:id
   */
  async updateDesignation(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { body, user } = req;

      const designation = await DesignationService.updateDesignation(id, body, user._id);

      res.json(createSuccessResponse(designation, 'Designation updated successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to update designation', undefined, 400)
      );
    }
  }

  /**
   * Delete designation
   * DELETE /api/v1/designations/:id
   */
  async deleteDesignation(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await DesignationService.deleteDesignation(id);

      res.json(createSuccessResponse(null, 'Designation deleted successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to delete designation', undefined, 400)
      );
    }
  }

  /**
   * Get designation statistics
   * GET /api/v1/designations/stats/dashboard
   */
  async getStats(req: any, res: Response): Promise<void> {
    try {
      const stats = await DesignationService.getDesignationStats();

      res.json(createSuccessResponse(stats, 'Designation statistics retrieved successfully'));
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
   * Search designations
   * GET /api/v1/designations/search/:query
   */
  async searchDesignations(req: any, res: Response): Promise<void> {
    try {
      const { query } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await DesignationService.searchDesignations(query, { page, limit });

      res.json(createSuccessResponse(result, 'Search results retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Search failed', undefined, 400)
      );
    }
  }

  /**
   * Get designations by level range
   * GET /api/v1/designations/range/:minLevel/:maxLevel
   */
  async getByLevelRange(req: any, res: Response): Promise<void> {
    try {
      const { minLevel, maxLevel } = req.params;

      const designations = await DesignationService.getDesignationsByLevelRange(
        parseInt(minLevel),
        parseInt(maxLevel)
      );

      res.json(createSuccessResponse(designations, 'Designations retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(
          error.message || 'Failed to retrieve designations',
          undefined,
          400
        )
      );
    }
  }
}

export default new DesignationController();
