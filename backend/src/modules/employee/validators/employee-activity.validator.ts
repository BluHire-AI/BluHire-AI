import { z } from 'zod';
import { ActivityType } from '../../../models/EmployeeActivity';

// Employee activity list query schema
export const activityListSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  employeeId: z.string().optional(),
  activityType: z.enum(Object.values(ActivityType) as any).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Activity date range query schema
export const activityDateRangeSchema = z.object({
  startDate: z.string().datetime('Start date must be a valid date'),
  endDate: z.string().datetime('End date must be a valid date'),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
});

export type ActivityListInput = z.infer<typeof activityListSchema>;
export type ActivityDateRangeInput = z.infer<typeof activityDateRangeSchema>;
