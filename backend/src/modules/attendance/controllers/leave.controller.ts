import { Request, Response } from 'express';
import { leaveService } from '../services';
import { createSuccessResponse, createErrorResponse } from '../../employee/dtos/common.dto';

export class LeaveController {
  async applyLeave(req: any, res: Response): Promise<void> {
    try {
      const employeeId = req.body.employeeId || req.user.employeeId;
      if (!employeeId) {
        res.status(400).json(createErrorResponse('Employee ID is required', undefined, 400));
        return;
      }
      const leave = await leaveService.applyLeave(employeeId, req.body);
      res.status(201).json(createSuccessResponse(leave, 'Leave applied successfully', 201));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to apply leave', undefined, 400));
    }
  }

  async getLeaves(req: any, res: Response): Promise<void> {
    try {
      const query = req.query;
      // Normal employee can only view their own leaves
      if (req.user.role === 'EMPLOYEE') {
        query.employeeId = req.user.employeeId;
      }
      const result = await leaveService.getLeaves(query);
      res.json(createSuccessResponse(result, 'Leaves retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to retrieve leaves', undefined, 400));
    }
  }

  async getLeaveById(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const leave = await leaveService.getLeaveById(id);
      res.json(createSuccessResponse(leave, 'Leave retrieved successfully'));
    } catch (error: any) {
      res.status(404).json(createErrorResponse(error.message || 'Leave not found', undefined, 404));
    }
  }

  async updateLeaveStatus(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const approverId = req.user._id;
      const leave = await leaveService.updateLeaveStatus(id, approverId, req.body);
      res.json(createSuccessResponse(leave, 'Leave status updated successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to update leave status', undefined, 400));
    }
  }

  async cancelLeave(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const employeeId = req.user.employeeId;
      if (!employeeId) {
        res.status(400).json(createErrorResponse('Employee profile not linked', undefined, 400));
        return;
      }
      const leave = await leaveService.cancelLeave(id, employeeId);
      res.json(createSuccessResponse(leave, 'Leave cancelled successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to cancel leave', undefined, 400));
    }
  }
}

export default new LeaveController();
