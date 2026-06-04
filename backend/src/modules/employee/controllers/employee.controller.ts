import { Request, Response } from 'express';
import EmployeeService from '../services/employee.service';
import { createSuccessResponse, createErrorResponse, ApiResponseDTO } from '../dtos/common.dto';
import { EmployeeQueryDTO } from '../dtos/employee.dto';

export class EmployeeController {
  /**
   * Create employee
   * POST /api/v1/employees
   */
  async createEmployee(req: any, res: Response): Promise<void> {
    try {
      const { body, user } = req;

      const employee = await EmployeeService.createEmployee(req.body, req.user._id);

      res.status(201).json(
        createSuccessResponse(employee, 'Employee created successfully', 201)
      );
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to create employee', undefined, 400)
      );
    }
  }

  /**
   * Get employee by ID
   * GET /api/v1/employees/:id
   */
  async getEmployee(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const employee = await EmployeeService.getEmployee(id);

      res.json(createSuccessResponse(employee, 'Employee retrieved successfully'));
    } catch (error: any) {
      res.status(404).json(
        createErrorResponse(error.message || 'Employee not found', undefined, 404)
      );
    }
  }

  /**
   * List employees
   * GET /api/v1/employees
   */
  async listEmployees(req: any, res: Response): Promise<void> {
    try {
      const query = req.query as EmployeeQueryDTO;
      const page = parseInt(query.page as any) || 1;
      const limit = parseInt(query.limit as any) || 10;

      const result = await EmployeeService.listEmployees(query, { page, limit });

      res.json(createSuccessResponse(result, 'Employees retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to list employees', undefined, 400)
      );
    }
  }

  /**
   * Update employee
   * PUT /api/v1/employees/:id
   */
  async updateEmployee(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { body, user } = req;

      const employee = await EmployeeService.updateEmployee(id, body, user._id);

      res.json(createSuccessResponse(employee, 'Employee updated successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to update employee', undefined, 400)
      );
    }
  }

  /**
   * Delete employee
   * DELETE /api/v1/employees/:id
   */
  async deleteEmployee(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { user } = req;

      await EmployeeService.deleteEmployee(id, user._id);

      res.json(createSuccessResponse(null, 'Employee deleted successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to delete employee', undefined, 400)
      );
    }
  }

  /**
   * Search employees
   * GET /api/v1/employees/search/:query
   */
  async searchEmployees(req: any, res: Response): Promise<void> {
    try {
      const { query } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await EmployeeService.searchEmployees(query, { page, limit });

      res.json(createSuccessResponse(result, 'Search results retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Search failed', undefined, 400)
      );
    }
  }

  /**
   * Get employee directory
   * GET /api/v1/employees/directory
   */
  async getDirectory(req: any, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await EmployeeService.getEmployeeDirectory({ page, limit });

      res.json(createSuccessResponse(result, 'Employee directory retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve directory', undefined, 400)
      );
    }
  }

  /**
   * Get organization hierarchy
   * GET /api/v1/employees/hierarchy
   */
  async getHierarchy(req: any, res: Response): Promise<void> {
    try {
      const hierarchy = await EmployeeService.getOrganizationHierarchy();

      res.json(createSuccessResponse(hierarchy, 'Organization hierarchy retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve hierarchy', undefined, 400)
      );
    }
  }

  /**
   * Get team members
   * GET /api/v1/employees/:id/team
   */
  async getTeamMembers(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await EmployeeService.getTeamMembers(id, { page, limit });

      res.json(createSuccessResponse(result, 'Team members retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve team members', undefined, 400)
      );
    }
  }

  /**
   * Promote employee
   * POST /api/v1/employees/:id/promote
   */
  async promoteEmployee(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { body, user } = req;

      const employee = await EmployeeService.promoteEmployee(
        { employeeId: id, ...body },
        user._id
      );

      res.json(createSuccessResponse(employee, 'Employee promoted successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to promote employee', undefined, 400)
      );
    }
  }

  /**
   * Transfer employee
   * POST /api/v1/employees/:id/transfer
   */
  async transferEmployee(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { body, user } = req;

      const employee = await EmployeeService.transferEmployee(
        { employeeId: id, ...body },
        user._id
      );

      res.json(createSuccessResponse(employee, 'Employee transferred successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to transfer employee', undefined, 400)
      );
    }
  }

  /**
   * Change employee status
   * POST /api/v1/employees/:id/status
   */
  async changeStatus(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { body, user } = req;

      const employee = await EmployeeService.changeEmployeeStatus(
        { employeeId: id, ...body },
        user._id
      );

      res.json(createSuccessResponse(employee, 'Employee status changed successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to change status', undefined, 400)
      );
    }
  }

  /**
   * Add skill
   * POST /api/v1/employees/:id/skills
   */
  async addSkill(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { skill } = req.body;
      const { user } = req;

      const employee = await EmployeeService.addSkill(
        { employeeId: id, skill },
        user._id
      );

      res.json(createSuccessResponse(employee, 'Skill added successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to add skill', undefined, 400)
      );
    }
  }

  /**
   * Remove skill
   * DELETE /api/v1/employees/:id/skills/:skillName
   */
  async removeSkill(req: any, res: Response): Promise<void> {
    try {
      const { id, skillName } = req.params;
      const { user } = req;

      const employee = await EmployeeService.removeSkill(
        { employeeId: id, skill: skillName },
        user._id
      );

      res.json(createSuccessResponse(employee, 'Skill removed successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to remove skill', undefined, 400)
      );
    }
  }

  /**
   * Add education
   * POST /api/v1/employees/:id/education
   */
  async addEducation(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { body, user } = req;

      const employee = await EmployeeService.addEducation(
        { employeeId: id, ...body },
        user._id
      );

      res.json(createSuccessResponse(employee, 'Education added successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to add education', undefined, 400)
      );
    }
  }

  /**
   * Add certification
   * POST /api/v1/employees/:id/certifications
   */
  async addCertification(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { body, user } = req;

      const employee = await EmployeeService.addCertification(
        { employeeId: id, ...body },
        user._id
      );

      res.json(createSuccessResponse(employee, 'Certification added successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to add certification', undefined, 400)
      );
    }
  }

  /**
   * Upload document
   * POST /api/v1/employees/:id/documents
   */
  async uploadDocument(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { body, user } = req;

      const employee = await EmployeeService.uploadDocument(
        { employeeId: id, ...body },
        user._id
      );

      res.json(createSuccessResponse(employee, 'Document uploaded successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to upload document', undefined, 400)
      );
    }
  }

  /**
   * Get employee statistics
   * GET /api/v1/employees/stats/dashboard
   */
  async getStats(req: any, res: Response): Promise<void> {
    try {
      const stats = await EmployeeService.getEmployeeStats();

      res.json(createSuccessResponse(stats, 'Employee statistics retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve statistics', undefined, 400)
      );
    }
  }

  /**
   * Bulk update employees
   * PUT /api/v1/employees/bulk/update
   */
  async bulkUpdate(req: any, res: Response): Promise<void> {
    try {
      const { body, user } = req;

      const result = await EmployeeService.bulkUpdateEmployees(body, user._id);

      res.json(createSuccessResponse(result, 'Bulk update completed'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Bulk update failed', undefined, 400)
      );
    }
  }
}

export default new EmployeeController();
