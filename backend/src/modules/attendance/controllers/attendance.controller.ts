import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { attendanceService, attendanceSummaryService } from '../services';
import { createSuccessResponse, createErrorResponse } from '../../employee/dtos/common.dto';

export class AttendanceController {
  async checkIn(req: any, res: Response): Promise<void> {
    try {
      const { body, user } = req;
      // We assume user is populated and linked to employee. 
      // For this HRMS, employees typically act on their own attendance.
      // Easiest is to pass the explicit employeeId in the body or infer it from req.employeeId if populated by auth middleware.
      const employeeId = body.employeeId || req.user.employeeId; 
      
      if (!employeeId) {
        res.status(400).json(createErrorResponse('Employee ID is required', undefined, 400));
        return;
      }

      const attendance = await attendanceService.checkIn(employeeId, user._id, body);
      res.status(201).json(createSuccessResponse(attendance, 'Checked in successfully', 201));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to check in', undefined, 400));
    }
  }

  async checkOut(req: any, res: Response): Promise<void> {
    try {
      const { body, user } = req;
      const employeeId = body.employeeId || req.user.employeeId;

      if (!employeeId) {
        res.status(400).json(createErrorResponse('Employee ID is required', undefined, 400));
        return;
      }

      const attendance = await attendanceService.checkOut(employeeId, user._id, body);
      res.json(createSuccessResponse(attendance, 'Checked out successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to check out', undefined, 400));
    }
  }

  async getAttendance(req: any, res: Response): Promise<void> {
    try {
      const query = req.query;
      // Normal employee can only view their own attendance
      if (req.user.role === 'EMPLOYEE') {
        query.employeeId = req.user.employeeId;
      }

      const result = await attendanceService.getAttendance(query);
      res.json(createSuccessResponse(result, 'Attendance records retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to retrieve attendance', undefined, 400));
    }
  }

  async getAttendanceById(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const attendance = await attendanceService.getAttendanceById(id);
      res.json(createSuccessResponse(attendance, 'Attendance retrieved successfully'));
    } catch (error: any) {
      res.status(404).json(createErrorResponse(error.message || 'Attendance not found', undefined, 404));
    }
  }

  async updateAttendance(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { body, user } = req;
      const attendance = await attendanceService.updateAttendance(id, user._id, body);
      res.json(createSuccessResponse(attendance, 'Attendance updated successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to update attendance', undefined, 400));
    }
  }

  async getSummary(req: any, res: Response): Promise<void> {
    try {
      const { employeeId, month, year } = req.query;
      if (!employeeId || !month || !year) {
        res.status(400).json(createErrorResponse('employeeId, month, and year are required', undefined, 400));
        return;
      }

      // First try to fetch it, if not found or if a query param says `generate=true`, we can generate it.
      let summary = await attendanceSummaryService.getSummary(employeeId as string, Number(month), Number(year));
      
      if (!summary || req.query.generate === 'true') {
        summary = await attendanceSummaryService.generateSummaryForEmployee(employeeId as string, Number(month), Number(year));
      }

      res.json(createSuccessResponse(summary, 'Attendance summary retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to retrieve summary', undefined, 400));
    }
  }

  async generateDepartmentSummary(req: any, res: Response): Promise<void> {
    try {
      const { departmentId, month, year } = req.body;
      const result = await attendanceSummaryService.generateSummaryForDepartment(
        departmentId,
        Number(month),
        Number(year)
      );
      res.json(createSuccessResponse(result, 'Department summary generated successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to generate department summary', undefined, 400));
    }
  }

  async getToday(req: any, res: Response): Promise<void> {
    try {
      const employeeId = req.user.employeeId;
      if (!employeeId) {
        res.json(createSuccessResponse(null, 'No employee record linked to this account'));
        return;
      }
      const record = await attendanceService.getTodayForEmployee(employeeId);
      res.json(createSuccessResponse(record, 'Today\'s attendance retrieved'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to retrieve today\'s attendance', undefined, 400));
    }
  }

  async getAnalytics(req: any, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const result = await attendanceService.getCompanyAnalytics(
        startDate as string | undefined, 
        endDate as string | undefined
      );
      res.json(createSuccessResponse(result, 'Attendance analytics retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to retrieve analytics', undefined, 400));
    }
  }

  async getTodayStats(req: any, res: Response): Promise<void> {
    try {
      const result = await attendanceService.getTodayStats();
      res.json(createSuccessResponse(result, 'Today\'s attendance stats retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to retrieve today\'s stats', undefined, 400));
    }
  }

  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const User = mongoose.model('User');
      const Employee = mongoose.model('Employee');
      const Attendance = mongoose.model('Attendance');
      const Leave = mongoose.model('Leave');
      const Shift = mongoose.model('Shift');
      const Holiday = mongoose.model('Holiday');

      const [employees, attendanceRecords, leaveRecords, shifts, holidays] = await Promise.all([
        Employee.countDocuments({ isDeleted: { $ne: true } }),
        Attendance.countDocuments({}),
        Leave.countDocuments({}),
        Shift.countDocuments({}),
        Holiday.countDocuments({})
      ]);

      // Calculate orphanedUsers: Users who have role EMPLOYEE or SENIOR_MANAGER but no Employee profile
      const users = await User.find({ role: { $in: ['EMPLOYEE', 'SENIOR_MANAGER'] } });
      const employeeUserIds = await Employee.distinct('userId', { isDeleted: { $ne: true } });
      const employeeCodes = await Employee.distinct('employeeCode', { isDeleted: { $ne: true } });
      
      const orphanedUsers = users.filter((u: any) => {
        const userIdStr = u._id.toString();
        const codeStr = u.employeeId;
        return !employeeUserIds.some((id: any) => id?.toString() === userIdStr) && 
               !employeeCodes.some((code: any) => code === codeStr);
      }).length;

      // Calculate orphanedEmployees: Employees with userId set, but the User document doesn't exist
      const employeesList = await Employee.find({ userId: { $ne: null }, isDeleted: { $ne: true } });
      const userIds = await User.distinct('_id');
      const userIdsStrings = userIds.map((id: any) => id.toString());
      
      const orphanedEmployees = employeesList.filter((e: any) => {
        return !userIdsStrings.includes(e.userId?.toString());
      }).length;

      res.json(createSuccessResponse({
        employees,
        attendanceRecords,
        leaveRecords,
        shifts,
        holidays,
        orphanedUsers,
        orphanedEmployees
      }, 'Attendance health metrics retrieved successfully'));
    } catch (error: any) {
      res.status(500).json(createErrorResponse(error.message || 'Failed to retrieve attendance health metrics', undefined, 500));
    }
  }
}

export default new AttendanceController();
