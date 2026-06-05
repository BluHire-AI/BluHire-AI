import { AttendanceStatus } from '../../models/Attendance';
import { LeaveStatus, LeaveType } from '../../models/Leave';

export interface IAttendanceResponse {
  _id: string;
  employeeId: string;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  totalHours: number;
  workingHours: number;
  overtimeHours: number;
  breakDuration: number;
  attendanceStatus: AttendanceStatus;
  remarks?: string;
  location?: string;
  ipAddress?: string;
  deviceInfo?: string;
  attendancePatternScore?: number;
  riskFlags?: string[];
  behaviorMetrics?: Record<string, any>;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IShiftResponse {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
  workingHoursPerDay: number;
  isFlexible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeaveResponse {
  _id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHolidayResponse {
  _id: string;
  name: string;
  date: Date;
  description?: string;
  isOptional: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceSummaryResponse {
  _id: string;
  employeeId: string;
  month: number;
  year: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  lateDays: number;
  totalHours: number;
  overtimeHours: number;
  attendancePercentage: number;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceFilterOptions {
  employeeId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  attendanceStatus?: AttendanceStatus;
}

export interface ILeaveFilterOptions {
  employeeId?: string;
  departmentId?: string;
  status?: LeaveStatus;
  leaveType?: LeaveType;
  startDate?: string;
  endDate?: string;
}
