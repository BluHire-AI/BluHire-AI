import { attendanceRepository, shiftRepository, holidayRepository } from '../repositories';
import { CheckInDto, CheckOutDto, UpdateAttendanceDto, AttendanceQueryDto } from '../dtos/attendance.dto';
import { IAttendance, AttendanceStatus } from '../../../models/Attendance';
import ApiError from '../../../utils/ApiError';
import mongoose from 'mongoose';
// Import Employee model to check for assigned shift
import EmployeeModel from '../../../models/Employee';
import AttendanceModel from '../../../models/Attendance';
import LeaveModel from '../../../models/Leave';

export class AttendanceService {
  /**
   * Helper to get employee shift or default
   */
  private async getEmployeeShift(employeeId: string) {
    const employee = await EmployeeModel.findById(employeeId);
    if (!employee) throw new ApiError(404, 'Employee not found');
    
    if (employee.shiftId) {
      return await shiftRepository.findById(employee.shiftId.toString());
    }
    return null; // Return null if no shift is explicitly assigned
  }

  async checkIn(employeeId: string, userId: string, data: CheckInDto): Promise<IAttendance> {
    const today = new Date();
    const dateOnly = new Date(today);
    dateOnly.setHours(0, 0, 0, 0);
    
    const employee = await EmployeeModel.findById(employeeId);
    if (!employee) throw new ApiError(404, 'Employee not found');

    // Enforce self-checkin permissions
    if (employee.userId === userId && employee.allowSelfCheckIn === false) {
      throw new ApiError(403, 'Self check-in is disabled. Please contact HR to check you in.');
    }
    
    // Check if already checked in today
    const existingAttendance = await attendanceRepository.findByEmployeeAndDate(employeeId, today);
    if (existingAttendance && existingAttendance.checkInTime) {
      throw new ApiError(400, 'Already checked in for today');
    }

    // Reuse employee fetch for shift query to avoid redundant DB call
    const shift = employee.shiftId ? await shiftRepository.findById(employee.shiftId.toString()) : null;
    let status = AttendanceStatus.PRESENT;

    // Check if late based on shift
    if (shift) {
      const currentTimeStr = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;
      // Basic time comparison (assumes same day, simple shifts)
      // e.g., shift.startTime = "09:00", gracePeriod = 15
      const [shiftHour, shiftMin] = shift.startTime.split(':').map(Number);
      const shiftStartTime = new Date(today);
      shiftStartTime.setHours(shiftHour, shiftMin, 0, 0);
      
      const graceTime = new Date(shiftStartTime.getTime() + shift.gracePeriodMinutes * 60000);

      if (today > graceTime) {
        status = AttendanceStatus.LATE;
      }
    }

    // Check if today is a holiday
    const isHoliday = await holidayRepository.isHoliday(today);
    if (isHoliday) {
      // Still allow check-in but might flag for holiday pay/overtime
      status = AttendanceStatus.HOLIDAY;
    }

    if (existingAttendance) {
      return await attendanceRepository.update(existingAttendance._id.toString(), {
        checkInTime: today,
        attendanceStatus: status,
        ...data,
        updatedBy: new mongoose.Types.ObjectId(userId)
      }) as IAttendance;
    }

    return await attendanceRepository.create({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      date: dateOnly,
      checkInTime: today,
      attendanceStatus: status,
      ...data,
      createdBy: new mongoose.Types.ObjectId(userId),
    });
  }

  async checkOut(employeeId: string, userId: string, data: CheckOutDto): Promise<IAttendance> {
    const today = new Date();
    
    const employee = await EmployeeModel.findById(employeeId);
    if (!employee) throw new ApiError(404, 'Employee not found');

    // Enforce self-checkout permissions
    if (employee.userId === userId && employee.allowSelfCheckIn === false) {
      throw new ApiError(403, 'Self check-out is disabled. Please contact HR to check you out.');
    }
    
    const attendance = await attendanceRepository.findByEmployeeAndDate(employeeId, today);
    if (!attendance || !attendance.checkInTime) {
      throw new ApiError(400, 'Cannot check out without checking in first');
    }

    if (attendance.checkOutTime) {
      throw new ApiError(400, 'Already checked out for today');
    }

    const checkOutTime = today;
    const checkInTime = attendance.checkInTime;

    // Calculate hours worked
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const totalHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
    
    // Assume 1 hour break by default if working more than 5 hours (could be parameterized)
    const breakDuration = totalHours > 5 ? 1 : 0;
    const workingHours = Math.max(0, totalHours - breakDuration);

    const shift = employee.shiftId ? await shiftRepository.findById(employee.shiftId.toString()) : null;
    let overtimeHours = 0;

    if (shift && workingHours > shift.workingHoursPerDay) {
      overtimeHours = Number((workingHours - shift.workingHoursPerDay).toFixed(2));
    } else if (!shift && workingHours > 8) {
      // Default 8-hour shift if none assigned
      overtimeHours = Number((workingHours - 8).toFixed(2));
    }

    return await attendanceRepository.update(attendance._id.toString(), {
      checkOutTime,
      totalHours,
      workingHours,
      overtimeHours,
      breakDuration,
      ...data,
      updatedBy: new mongoose.Types.ObjectId(userId)
    }) as IAttendance;
  }

  async getAttendance(query: AttendanceQueryDto): Promise<{ records: IAttendance[]; total: number }> {
    return await attendanceRepository.findWithPagination(query);
  }

  async updateAttendance(id: string, userId: string, data: UpdateAttendanceDto): Promise<IAttendance> {
    const attendance = await attendanceRepository.findById(id);
    if (!attendance) {
      throw new ApiError(404, 'Attendance record not found');
    }

    // Need to recalculate hours if times are manually updated
    const updatePayload: any = { ...data, updatedBy: new mongoose.Types.ObjectId(userId) };
    
    const checkInTime = data.checkInTime ? new Date(data.checkInTime) : attendance.checkInTime;
    const checkOutTime = data.checkOutTime ? new Date(data.checkOutTime) : attendance.checkOutTime;

    if (checkInTime && checkOutTime) {
      const diffMs = checkOutTime.getTime() - checkInTime.getTime();
      const totalHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
      const breakDuration = totalHours > 5 ? 1 : 0;
      const workingHours = Math.max(0, totalHours - breakDuration);
      
      const shift = await this.getEmployeeShift(attendance.employeeId.toString());
      let overtimeHours = 0;
      if (shift && workingHours > shift.workingHoursPerDay) {
        overtimeHours = Number((workingHours - shift.workingHoursPerDay).toFixed(2));
      } else if (!shift && workingHours > 8) {
        overtimeHours = Number((workingHours - 8).toFixed(2));
      }

      updatePayload.totalHours = totalHours;
      updatePayload.workingHours = workingHours;
      updatePayload.overtimeHours = overtimeHours;
      updatePayload.breakDuration = breakDuration;
    }

    return await attendanceRepository.update(id, updatePayload) as IAttendance;
  }

  async getAttendanceById(id: string): Promise<IAttendance> {
    const attendance = await attendanceRepository.findById(id);
    if (!attendance) {
      throw new ApiError(404, 'Attendance record not found');
    }
    return attendance;
  }

  async getTodayForEmployee(employeeId: string): Promise<IAttendance | null> {
    const today = new Date();
    return await attendanceRepository.findByEmployeeAndDate(employeeId, today);
  }

  async getCompanyAnalytics(startDateStr?: string, endDateStr?: string): Promise<any> {
    // Default to current month
    const now = new Date();
    const startDate = startDateStr ? new Date(startDateStr) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = endDateStr ? new Date(endDateStr) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const stats = await attendanceRepository.getCompanyAnalytics(startDate, endDate);
    
    // Calculate average attendance % based on expected working days (simplified)
    // A more accurate formula would consider total employees * working days
    const averageAttendance = stats.totalRecords > 0 
      ? Number(((stats.totalPresent / stats.totalRecords) * 100).toFixed(1)) 
      : 0;

    return {
      ...stats,
      averageAttendance,
      period: {
        start: startDate,
        end: endDate
      }
    };
  }

  async getTodayStats(): Promise<any> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const activeEmployeesCount = await EmployeeModel.countDocuments({ isDeleted: false, employmentStatus: 'ACTIVE' } as any);

    const todayAttendance = await AttendanceModel.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    } as any);

    const todayLeaves = await LeaveModel.find({
      status: 'APPROVED',
      startDate: { $lte: endOfDay },
      endDate: { $gte: startOfDay }
    } as any);

    const presentToday = todayAttendance.filter(att => 
      ['PRESENT', 'LATE', 'HALF_DAY', 'WORK_FROM_HOME'].includes(att.attendanceStatus)
    ).length;

    const lateToday = todayAttendance.filter(att => att.attendanceStatus === 'LATE').length;
    const onLeaveToday = todayLeaves.length;
    const overtimeToday = todayAttendance.filter(att => att.overtimeHours > 0).length;
    const absentToday = Math.max(0, activeEmployeesCount - presentToday - onLeaveToday);

    return {
      presentToday,
      absentToday,
      onLeaveToday,
      lateToday,
      overtimeToday,
      totalEmployees: activeEmployeesCount
    };
  }
}

export default new AttendanceService();
