import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  jobId: z.string().optional(),
  departmentId: z.string().optional(),
});

export const analyticsPaginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  jobId: z.string().optional(),
  departmentId: z.string().optional(),
});

export const exportQuerySchema = z.object({
  report: z.enum(['recruitment', 'recruiter', 'ai-screening', 'interview', 'hiring']).default('recruitment'),
  format: z.enum(['csv', 'excel', 'pdf']).default('csv'),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  jobId: z.string().optional(),
  departmentId: z.string().optional(),
});
