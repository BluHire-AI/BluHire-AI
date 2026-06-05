"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobListSchema = exports.updateJobSchema = exports.createJobSchema = void 0;
const zod_1 = require("zod");
const Job_1 = require("../../../models/Job");
exports.createJobSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, 'Title must be at least 2 characters').max(100, 'Title cannot exceed 100 characters'),
    departmentId: zod_1.z.string().min(1, 'Department ID is required'),
    designationId: zod_1.z.string().min(1, 'Designation ID is required'),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
    responsibilities: zod_1.z.string().min(10, 'Responsibilities must be at least 10 characters'),
    requiredSkills: zod_1.z.array(zod_1.z.string()).min(1, 'At least one required skill is required'),
    preferredSkills: zod_1.z.array(zod_1.z.string()).optional(),
    experienceRequired: zod_1.z.string().min(1, 'Experience required is required'),
    educationRequired: zod_1.z.string().min(1, 'Education required is required'),
    employmentType: zod_1.z.string().min(1, 'Employment type is required'),
    location: zod_1.z.string().min(1, 'Location is required'),
    salaryMin: zod_1.z.number().optional(),
    salaryMax: zod_1.z.number().optional(),
    openings: zod_1.z.number().min(1, 'Openings must be at least 1').optional().default(1),
    status: zod_1.z.nativeEnum(Job_1.JobStatus).optional().default(Job_1.JobStatus.DRAFT),
});
exports.updateJobSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).max(100).optional(),
    departmentId: zod_1.z.string().optional(),
    designationId: zod_1.z.string().optional(),
    description: zod_1.z.string().min(10).optional(),
    responsibilities: zod_1.z.string().min(10).optional(),
    requiredSkills: zod_1.z.array(zod_1.z.string()).optional(),
    preferredSkills: zod_1.z.array(zod_1.z.string()).optional(),
    experienceRequired: zod_1.z.string().optional(),
    educationRequired: zod_1.z.string().optional(),
    employmentType: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    salaryMin: zod_1.z.number().optional(),
    salaryMax: zod_1.z.number().optional(),
    openings: zod_1.z.number().min(1).optional(),
    status: zod_1.z.nativeEnum(Job_1.JobStatus).optional(),
});
exports.jobListSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).optional().default(10),
    search: zod_1.z.string().optional(),
    departmentId: zod_1.z.string().optional(),
    designationId: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(Job_1.JobStatus).optional(),
    employmentType: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
});
