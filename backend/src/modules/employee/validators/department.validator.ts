import { z } from 'zod';

// Create department schema
export const createDepartmentSchema = z.object({
  name: z
    .string()
    .min(2, 'Department name must be at least 2 characters')
    .max(100, 'Department name cannot exceed 100 characters'),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  departmentHead: z.string().optional(),
});

// Update department schema
export const updateDepartmentSchema = z.object({
  name: z
    .string()
    .min(2, 'Department name must be at least 2 characters')
    .max(100, 'Department name cannot exceed 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  departmentHead: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Assign department head schema
export const assignDepartmentHeadSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
});

// Department list query schema
export const departmentListSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type AssignDepartmentHeadInput = z.infer<typeof assignDepartmentHeadSchema>;
export type DepartmentListInput = z.infer<typeof departmentListSchema>;
