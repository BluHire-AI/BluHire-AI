import { z } from 'zod';
import { EmploymentStatus, EmploymentType } from '../../../models/Employee';

// Employee creation schema
export const createEmployeeSchema = z.object({
  employeeCode: z
    .string()
    .min(1, 'Employee code is required')
    .max(20, 'Employee code cannot exceed 20 characters')
    .regex(/^[A-Z0-9]+$/, 'Employee code must be uppercase alphanumeric'),
  userId: z.string().optional(),
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters'),
  email: z.string().email('Invalid email format'),
  phone: z
    .string()
    .regex(
      /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
      'Invalid phone number format'
    ),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.string().datetime().optional(),
  departmentId: z.string().min(1, 'Department ID is required'),
  designationId: z.string().min(1, 'Designation ID is required'),
  managerId: z.string().nullable().optional(),
  employmentType: z.nativeEnum(EmploymentType, {
    message: 'Invalid employment type',
  }),
  joiningDate: z
    .string()
    .datetime('Joining date must be a valid date')
    .or(z.date()),
  experience: z.number().min(0, 'Experience cannot be negative').optional(),
  skills: z.array(z.string()).optional(),
  salaryGrade: z.string().optional(),
  workLocation: z
    .string()
    .min(1, 'Work location is required')
    .max(100, 'Work location cannot exceed 100 characters'),
  emergencyContact: z
    .object({
      name: z.string(),
      phone: z.string(),
      relationship: z.string(),
    })
    .optional(),
  address: z
    .object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string(),
    })
    .optional(),
  notes: z.string().optional(),
});

// Employee update schema
export const updateEmployeeSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .optional(),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .optional(),
  phone: z
    .string()
    .regex(
      /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
      'Invalid phone number format'
    )
    .optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.string().datetime().optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  managerId: z.string().nullable().optional(),
  experience: z.number().min(0, 'Experience cannot be negative').optional(),
  skills: z.array(z.string()).optional(),
  salaryGrade: z.string().optional(),
  workLocation: z
    .string()
    .min(1, 'Work location is required')
    .max(100, 'Work location cannot exceed 100 characters')
    .optional(),
  employmentStatus: z.nativeEnum(EmploymentStatus).optional(),
  profileImage: z.string().url().optional(),
  emergencyContact: z
    .object({
      name: z.string(),
      phone: z.string(),
      relationship: z.string(),
    })
    .optional(),
  address: z
    .object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string(),
    })
    .optional(),
  allowSelfCheckIn: z.boolean().optional(),
  notes: z.string().optional(),
});

// Employee promote schema
export const promoteEmployeeSchema = z.object({
  designationId: z.string().min(1, 'Designation ID is required'),
  departmentId: z.string().optional(),
  salaryGrade: z.string().optional(),
});

// Employee transfer schema
export const transferEmployeeSchema = z.object({
  departmentId: z.string().min(1, 'Department ID is required'),
  designationId: z.string().optional(),
  managerId: z.string().nullable().optional(),
});

// Change status schema
export const changeStatusSchema = z.object({
  employmentStatus: z.nativeEnum(EmploymentStatus, {
    message: 'Invalid employment status',
  }),
  reason: z.string().optional(),
  effectiveDate: z.string().datetime().optional(),
});

// Add skill schema
export const addSkillSchema = z.object({
  skill: z
    .string()
    .min(1, 'Skill is required')
    .max(100, 'Skill cannot exceed 100 characters'),
});

// Add education schema
export const addEducationSchema = z.object({
  institution: z
    .string()
    .min(1, 'Institution is required')
    .max(200, 'Institution cannot exceed 200 characters'),
  degree: z
    .string()
    .min(1, 'Degree is required')
    .max(100, 'Degree cannot exceed 100 characters'),
  field: z
    .string()
    .min(1, 'Field is required')
    .max(100, 'Field cannot exceed 100 characters'),
  graduationYear: z
    .number()
    .min(1900, 'Invalid graduation year')
    .max(new Date().getFullYear() + 10, 'Graduation year cannot be in the far future'),
});

// Add certification schema
export const addCertificationSchema = z.object({
  name: z
    .string()
    .min(1, 'Certification name is required')
    .max(200, 'Certification name cannot exceed 200 characters'),
  issuer: z
    .string()
    .min(1, 'Issuer is required')
    .max(200, 'Issuer cannot exceed 200 characters'),
  issueDate: z.string().datetime('Issue date must be a valid date'),
  expiryDate: z.string().datetime('Expiry date must be a valid date').optional(),
  certificateUrl: z.string().url().optional(),
});

// Upload document schema
export const uploadDocumentSchema = z.object({
  fileName: z
    .string()
    .min(1, 'File name is required')
    .max(255, 'File name cannot exceed 255 characters'),
  fileType: z.enum(['pdf', 'doc', 'docx', 'jpg', 'png', 'jpeg']),
  fileUrl: z.string().url('Invalid file URL'),
});

// Bulk update schema
export const bulkUpdateSchema = z.object({
  employeeIds: z.array(z.string().min(1)).min(1, 'At least one employee ID is required'),
  updates: updateEmployeeSchema,
});

// Employee list query schema
export const employeeListSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  managerId: z.string().optional(),
  employmentStatus: z.enum(Object.values(EmploymentStatus) as any).optional(),
  employmentType: z.enum(Object.values(EmploymentType) as any).optional(),
  workLocation: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type PromoteEmployeeInput = z.infer<typeof promoteEmployeeSchema>;
export type TransferEmployeeInput = z.infer<typeof transferEmployeeSchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
export type AddSkillInput = z.infer<typeof addSkillSchema>;
export type AddEducationInput = z.infer<typeof addEducationSchema>;
export type AddCertificationInput = z.infer<typeof addCertificationSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>;
export type EmployeeListInput = z.infer<typeof employeeListSchema>;
