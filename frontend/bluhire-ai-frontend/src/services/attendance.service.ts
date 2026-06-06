import { api } from '@/lib/api';

export interface Attendance {
  _id: string;
  employeeId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalHours?: number;
  overtimeHours?: number;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LATE' | 'ON_LEAVE' | 'HOLIDAY';
  location?: string;
  ipAddress?: string;
  deviceInfo?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  _id: string;
  employeeId: string;
  month: number;
  year: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalHalfDays: number;
  totalOvertimeHours: number;
  totalWorkingHours: number;
}

export const attendanceService = {
  checkIn: async (data: { location?: string; ipAddress?: string; deviceInfo?: string; remarks?: string }): Promise<Attendance> => {
    const response = await api.post('/attendance/check-in', data);
    return response.data.data;
  },

  checkOut: async (data: { location?: string; ipAddress?: string; deviceInfo?: string; remarks?: string }): Promise<Attendance> => {
    const response = await api.post('/attendance/check-out', data);
    return response.data.data;
  },

  list: async (query?: any): Promise<{ data: Attendance[]; total: number }> => {
    const response = await api.get('/attendance', { params: query });
    return {
      data: response.data.data.data || [],
      total: response.data.data.pagination?.total || 0,
    };
  },

  getById: async (id: string): Promise<Attendance> => {
    const response = await api.get(`/attendance/${id}`);
    return response.data.data;
  },

  getSummary: async (query?: { month: number; year: number }): Promise<AttendanceSummary> => {
    const response = await api.get('/attendance/summary', { params: query });
    return response.data.data;
  },

  update: async (id: string, data: any): Promise<Attendance> => {
    const response = await api.put(`/attendance/${id}`, data);
    return response.data.data;
  },

  getAnalytics: async (query?: { startDate?: string; endDate?: string }): Promise<any> => {
    const response = await api.get('/attendance/analytics', { params: query });
    return response.data.data;
  },
};
