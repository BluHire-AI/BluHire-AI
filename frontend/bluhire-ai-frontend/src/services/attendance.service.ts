import { api } from '@/lib/api';

export interface AttendanceRecord {
  _id: string;
  employeeId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalHours: number;
  workingHours: number;
  overtimeHours: number;
  breakDuration: number;
  attendanceStatus: AttendanceStatus;
  remarks?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'HALF_DAY'
  | 'LATE'
  | 'ON_LEAVE'
  | 'HOLIDAY'
  | 'WEEKEND'
  | 'WORK_FROM_HOME';

export interface AttendanceSummary {
  employeeId: string;
  month: number;
  year: number;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  leaveDays: number;
  holidayDays: number;
  weekendDays: number;
  totalWorkingHours: number;
  totalOvertimeHours: number;
  attendancePercentage: number;
}

export interface AttendanceAnalytics {
  totalRecords: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalOnLeave: number;
  averageAttendance: number;
  averageWorkingHours: number;
  period: { start: string; end: string };
}

export const attendanceService = {
  /** Get today's record for the logged-in employee */
  getToday: async (): Promise<AttendanceRecord | null> => {
    const res = await api.get('/attendance/today');
    return res.data.data;
  },

  /** Check in */
  checkIn: async (data: { location?: string; remarks?: string } = {}): Promise<AttendanceRecord> => {
    const res = await api.post('/attendance/check-in', data);
    return res.data.data;
  },

  /** Check out */
  checkOut: async (data: { remarks?: string } = {}): Promise<AttendanceRecord> => {
    const res = await api.post('/attendance/check-out', data);
    return res.data.data;
  },

  /** List attendance records */
  getHistory: async (params: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ records: AttendanceRecord[]; total: number }> => {
    const res = await api.get('/attendance', { params });
    return res.data.data;
  },

  /** Monthly summary */
  getSummary: async (
    employeeId: string,
    month: number,
    year: number
  ): Promise<AttendanceSummary | null> => {
    const res = await api.get('/attendance/summary', {
      params: { employeeId, month, year, generate: 'true' },
    });
    return res.data.data;
  },

  /** Company-wide analytics (HR/Admin only) */
  getAnalytics: async (
    startDate?: string,
    endDate?: string
  ): Promise<AttendanceAnalytics> => {
    const res = await api.get('/attendance/analytics', {
      params: { startDate, endDate },
    });
    return res.data.data;
  },
};
