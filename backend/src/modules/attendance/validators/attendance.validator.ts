import { z } from 'zod';
import { AttendanceStatus } from '../../../models/Attendance';

export const checkInSchema = z.object({
  employeeId: z.string().optional(), // usually extracted from req.user
  location: z.string().optional(),
  ipAddress: z.string().optional(),
  deviceInfo: z.string().optional(),
  remarks: z.string().optional(),
});

export const checkOutSchema = z.object({
  employeeId: z.string().optional(),
  location: z.string().optional(),
  ipAddress: z.string().optional(),
  deviceInfo: z.string().optional(),
  remarks: z.string().optional(),
});

export const updateAttendanceSchema = z.object({
  checkInTime: z.string().datetime().or(z.date()).optional(),
  checkOutTime: z.string().datetime().or(z.date()).optional(),
  attendanceStatus: z.nativeEnum(AttendanceStatus).optional(),
  remarks: z.string().optional(),
});

export const attendanceQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  employeeId: z.string().optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  status: z.nativeEnum(AttendanceStatus).optional(),
});
