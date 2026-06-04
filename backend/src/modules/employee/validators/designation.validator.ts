import { z } from 'zod';

// Create designation schema
export const createDesignationSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  departmentId: z.string().min(1, 'Department ID is required'),
  level: z
    .number()
    .min(1, 'Level must be between 1 and 7')
    .max(7, 'Level must be between 1 and 7'),
});

// Update designation schema
export const updateDesignationSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title cannot exceed 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  departmentId: z.string().optional(),
  level: z
    .number()
    .min(1, 'Level must be between 1 and 7')
    .max(7, 'Level must be between 1 and 7')
    .optional(),
});

// Designation list query schema
export const designationListSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  departmentId: z.string().optional(),
  level: z.coerce.number().min(1).max(7).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;
export type UpdateDesignationInput = z.infer<typeof updateDesignationSchema>;
export type DesignationListInput = z.infer<typeof designationListSchema>;
