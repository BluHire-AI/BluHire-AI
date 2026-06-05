import { Request, Response } from 'express';
import { holidayService } from '../services';
import { createSuccessResponse, createErrorResponse } from '../../employee/dtos/common.dto';

export class HolidayController {
  async createHoliday(req: any, res: Response): Promise<void> {
    try {
      const holiday = await holidayService.createHoliday(req.body);
      res.status(201).json(createSuccessResponse(holiday, 'Holiday created successfully', 201));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to create holiday', undefined, 400));
    }
  }

  async getHolidays(req: any, res: Response): Promise<void> {
    try {
      const result = await holidayService.getHolidays(req.query);
      res.json(createSuccessResponse(result, 'Holidays retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to retrieve holidays', undefined, 400));
    }
  }

  async getHolidayById(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const holiday = await holidayService.getHolidayById(id);
      res.json(createSuccessResponse(holiday, 'Holiday retrieved successfully'));
    } catch (error: any) {
      res.status(404).json(createErrorResponse(error.message || 'Holiday not found', undefined, 404));
    }
  }

  async updateHoliday(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const holiday = await holidayService.updateHoliday(id, req.body);
      res.json(createSuccessResponse(holiday, 'Holiday updated successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to update holiday', undefined, 400));
    }
  }

  async deleteHoliday(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await holidayService.deleteHoliday(id);
      res.json(createSuccessResponse(null, 'Holiday deleted successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to delete holiday', undefined, 400));
    }
  }
}

export default new HolidayController();
