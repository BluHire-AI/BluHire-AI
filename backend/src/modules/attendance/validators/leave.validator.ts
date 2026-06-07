import { z } from 'zod';
import { LeaveType, LeaveStatus } from '../../../models/Leave';

export const applyLeaveSchema = z.object({
  employeeId: z.string().optional(),
  leaveType: z.nativeEnum(LeaveType, { error: 'Leave type is required' }),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  reason: z.string().min(1, 'Reason is required'),
});

export const updateLeaveStatusSchema = z.object({
  status: z.nativeEnum(LeaveStatus, { error: 'Status is required' }),
});

export const leaveQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  employeeId: z.string().optional(),
  status: z.nativeEnum(LeaveStatus).optional(),
  leaveType: z.nativeEnum(LeaveType).optional(),
});
