import { z } from 'zod';
import { JobStatus } from '../../../models/Job';

export const createJobSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100, 'Title cannot exceed 100 characters'),
  departmentId: z.string().min(1, 'Department ID is required'),
  designationId: z.string().min(1, 'Designation ID is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  responsibilities: z.string().min(10, 'Responsibilities must be at least 10 characters'),
  requiredSkills: z.array(z.string()).min(1, 'At least one required skill is required'),
  preferredSkills: z.array(z.string()).optional(),
  experienceRequired: z.string().min(1, 'Experience required is required'),
  educationRequired: z.string().min(1, 'Education required is required'),
  employmentType: z.string().min(1, 'Employment type is required'),
  location: z.string().min(1, 'Location is required'),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  openings: z.number().min(1, 'Openings must be at least 1').optional().default(1),
  status: z.nativeEnum(JobStatus).optional().default(JobStatus.DRAFT),
});

export const updateJobSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  description: z.string().min(10).optional(),
  responsibilities: z.string().min(10).optional(),
  requiredSkills: z.array(z.string()).optional(),
  preferredSkills: z.array(z.string()).optional(),
  experienceRequired: z.string().optional(),
  educationRequired: z.string().optional(),
  employmentType: z.string().optional(),
  location: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  openings: z.number().min(1).optional(),
  status: z.nativeEnum(JobStatus).optional(),
});

export const jobListSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  status: z.nativeEnum(JobStatus).optional(),
  employmentType: z.string().optional(),
  location: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
