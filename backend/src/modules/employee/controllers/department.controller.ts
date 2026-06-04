import { Request, Response } from 'express';
import DepartmentService from '../services/department.service';
import { createSuccessResponse, createErrorResponse } from '../dtos/common.dto';
import { DepartmentQueryDTO } from '../dtos/department.dto';

export class DepartmentController {
  /**
   * Create department
   * POST /api/v1/departments
   */
  async createDepartment(req: any, res: Response): Promise<void> {
    try {
      const { body, user } = req;

      const department = await DepartmentService.createDepartment(body, user._id);

      res.status(201).json(
        createSuccessResponse(department, 'Department created successfully', 201)
      );
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to create department', undefined, 400)
      );
    }
  }

  /**
   * Get department by ID
   * GET /api/v1/departments/:id
   */
  async getDepartment(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const department = await DepartmentService.getDepartment(id);

      res.json(createSuccessResponse(department, 'Department retrieved successfully'));
    } catch (error: any) {
      res.status(404).json(
        createErrorResponse(error.message || 'Department not found', undefined, 404)
      );
    }
  }

  /**
   * List departments
   * GET /api/v1/departments
   */
  async listDepartments(req: any, res: Response): Promise<void> {
    try {
      const query = req.query as DepartmentQueryDTO;
      const page = parseInt(query.page as any) || 1;
      const limit = parseInt(query.limit as any) || 10;

      const result = await DepartmentService.listDepartments(query, { page, limit });

      res.json(createSuccessResponse(result, 'Departments retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to list departments', undefined, 400)
      );
    }
  }

  /**
   * Get all active departments
   * GET /api/v1/departments/active
   */
  async getActiveDepartments(req: any, res: Response): Promise<void> {
    try {
      const departments = await DepartmentService.getAllActiveDepartments();

      res.json(
        createSuccessResponse(
          departments,
          'Active departments retrieved successfully'
        )
      );
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(
          error.message || 'Failed to retrieve active departments',
          undefined,
          400
        )
      );
    }
  }

  /**
   * Update department
   * PUT /api/v1/departments/:id
   */
  async updateDepartment(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { body, user } = req;

      const department = await DepartmentService.updateDepartment(id, body, user._id);

      res.json(createSuccessResponse(department, 'Department updated successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to update department', undefined, 400)
      );
    }
  }

  /**
   * Delete department
   * DELETE /api/v1/departments/:id
   */
  async deleteDepartment(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await DepartmentService.deleteDepartment(id);

      res.json(createSuccessResponse(null, 'Department deleted successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to delete department', undefined, 400)
      );
    }
  }

  /**
   * Assign department head
   * POST /api/v1/departments/:id/head
   */
  async assignHead(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { employeeId } = req.body;
      const { user } = req;

      const department = await DepartmentService.assignDepartmentHead(
        { departmentId: id, employeeId },
        user._id
      );

      res.json(createSuccessResponse(department, 'Department head assigned successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to assign head', undefined, 400)
      );
    }
  }

  /**
   * Remove department head
   * DELETE /api/v1/departments/:id/head
   */
  async removeHead(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const department = await DepartmentService.removeDepartmentHead(id);

      res.json(createSuccessResponse(department, 'Department head removed successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to remove head', undefined, 400)
      );
    }
  }

  /**
   * Toggle department status
   * PATCH /api/v1/departments/:id/toggle-status
   */
  async toggleStatus(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const department = await DepartmentService.toggleDepartmentStatus(id);

      res.json(createSuccessResponse(department, 'Department status toggled successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to toggle status', undefined, 400)
      );
    }
  }

  /**
   * Get department with details
   * GET /api/v1/departments/:id/details
   */
  async getDepartmentDetails(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const details = await DepartmentService.getDepartmentWithDetails(id);

      res.json(createSuccessResponse(details, 'Department details retrieved successfully'));
    } catch (error: any) {
      res.status(404).json(
        createErrorResponse(error.message || 'Department not found', undefined, 404)
      );
    }
  }

  /**
   * Get department statistics
   * GET /api/v1/departments/stats/dashboard
   */
  async getStats(req: any, res: Response): Promise<void> {
    try {
      const stats = await DepartmentService.getDepartmentStats();

      res.json(createSuccessResponse(stats, 'Department statistics retrieved successfully'));
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
   * Search departments
   * GET /api/v1/departments/search/:query
   */
  async searchDepartments(req: any, res: Response): Promise<void> {
    try {
      const { query } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await DepartmentService.searchDepartments(query, { page, limit });

      res.json(createSuccessResponse(result, 'Search results retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Search failed', undefined, 400)
      );
    }
  }
}

export default new DepartmentController();
