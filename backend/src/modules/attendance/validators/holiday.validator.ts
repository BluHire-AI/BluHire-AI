import { z } from 'zod';

export const createHolidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required'),
  date: z.string().or(z.date()),
  description: z.string().optional(),
  isOptional: z.boolean().optional().default(false),
});

export const updateHolidaySchema = z.object({
  name: z.string().min(1).optional(),
  date: z.string().or(z.date()).optional(),
  description: z.string().optional(),
  isOptional: z.boolean().optional(),
});

export const holidayQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  year: z.coerce.number().optional(),
  month: z.coerce.number().min(1).max(12).optional(),
});
