import { Request, Response } from 'express';
import { shiftService } from '../services';
import { createSuccessResponse, createErrorResponse } from '../../employee/dtos/common.dto';

export class ShiftController {
  async createShift(req: any, res: Response): Promise<void> {
    try {
      const shift = await shiftService.createShift(req.body);
      res.status(201).json(createSuccessResponse(shift, 'Shift created successfully', 201));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to create shift', undefined, 400));
    }
  }

  async getShifts(req: any, res: Response): Promise<void> {
    try {
      const shifts = await shiftService.getAllShifts();
      res.json(createSuccessResponse(shifts, 'Shifts retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to retrieve shifts', undefined, 400));
    }
  }

  async getShiftById(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const shift = await shiftService.getShiftById(id);
      res.json(createSuccessResponse(shift, 'Shift retrieved successfully'));
    } catch (error: any) {
      res.status(404).json(createErrorResponse(error.message || 'Shift not found', undefined, 404));
    }
  }

  async updateShift(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const shift = await shiftService.updateShift(id, req.body);
      res.json(createSuccessResponse(shift, 'Shift updated successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to update shift', undefined, 400));
    }
  }

  async deleteShift(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await shiftService.deleteShift(id);
      res.json(createSuccessResponse(null, 'Shift deleted successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to delete shift', undefined, 400));
    }
  }
}

export default new ShiftController();
