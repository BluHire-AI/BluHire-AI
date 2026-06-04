"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeListSchema = exports.bulkUpdateSchema = exports.uploadDocumentSchema = exports.addCertificationSchema = exports.addEducationSchema = exports.addSkillSchema = exports.changeStatusSchema = exports.transferEmployeeSchema = exports.promoteEmployeeSchema = exports.updateEmployeeSchema = exports.createEmployeeSchema = void 0;
const zod_1 = require("zod");
const Employee_1 = require("../../../models/Employee");
// Employee creation schema
exports.createEmployeeSchema = zod_1.z.object({
    employeeCode: zod_1.z
        .string()
        .min(1, 'Employee code is required')
        .max(20, 'Employee code cannot exceed 20 characters')
        .regex(/^[A-Z0-9]+$/, 'Employee code must be uppercase alphanumeric'),
    userId: zod_1.z.string().optional(),
    firstName: zod_1.z
        .string()
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name cannot exceed 50 characters'),
    lastName: zod_1.z
        .string()
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name cannot exceed 50 characters'),
    email: zod_1.z.string().email('Invalid email format'),
    phone: zod_1.z
        .string()
        .regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Invalid phone number format'),
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    dateOfBirth: zod_1.z.string().datetime().optional(),
    departmentId: zod_1.z.string().min(1, 'Department ID is required'),
    designationId: zod_1.z.string().min(1, 'Designation ID is required'),
    managerId: zod_1.z.string().optional(),
    employmentType: zod_1.z.nativeEnum(Employee_1.EmploymentType, {
        message: 'Invalid employment type',
    }),
    joiningDate: zod_1.z
        .string()
        .datetime('Joining date must be a valid date')
        .or(zod_1.z.date()),
    experience: zod_1.z.number().min(0, 'Experience cannot be negative').optional(),
    skills: zod_1.z.array(zod_1.z.string()).optional(),
    salaryGrade: zod_1.z.string().optional(),
    workLocation: zod_1.z
        .string()
        .min(1, 'Work location is required')
        .max(100, 'Work location cannot exceed 100 characters'),
    emergencyContact: zod_1.z
        .object({
        name: zod_1.z.string(),
        phone: zod_1.z.string(),
        relationship: zod_1.z.string(),
    })
        .optional(),
    address: zod_1.z
        .object({
        street: zod_1.z.string(),
        city: zod_1.z.string(),
        state: zod_1.z.string(),
        postalCode: zod_1.z.string(),
        country: zod_1.z.string(),
    })
        .optional(),
    notes: zod_1.z.string().optional(),
});
// Employee update schema
exports.updateEmployeeSchema = zod_1.z.object({
    firstName: zod_1.z
        .string()
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name cannot exceed 50 characters')
        .optional(),
    lastName: zod_1.z
        .string()
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name cannot exceed 50 characters')
        .optional(),
    phone: zod_1.z
        .string()
        .regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Invalid phone number format')
        .optional(),
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    dateOfBirth: zod_1.z.string().datetime().optional(),
    departmentId: zod_1.z.string().optional(),
    designationId: zod_1.z.string().optional(),
    managerId: zod_1.z.string().optional(),
    experience: zod_1.z.number().min(0, 'Experience cannot be negative').optional(),
    skills: zod_1.z.array(zod_1.z.string()).optional(),
    salaryGrade: zod_1.z.string().optional(),
    workLocation: zod_1.z
        .string()
        .min(1, 'Work location is required')
        .max(100, 'Work location cannot exceed 100 characters')
        .optional(),
    employmentStatus: zod_1.z.nativeEnum(Employee_1.EmploymentStatus).optional(),
    profileImage: zod_1.z.string().url().optional(),
    emergencyContact: zod_1.z
        .object({
        name: zod_1.z.string(),
        phone: zod_1.z.string(),
        relationship: zod_1.z.string(),
    })
        .optional(),
    address: zod_1.z
        .object({
        street: zod_1.z.string(),
        city: zod_1.z.string(),
        state: zod_1.z.string(),
        postalCode: zod_1.z.string(),
        country: zod_1.z.string(),
    })
        .optional(),
    notes: zod_1.z.string().optional(),
});
// Employee promote schema
exports.promoteEmployeeSchema = zod_1.z.object({
    designationId: zod_1.z.string().min(1, 'Designation ID is required'),
    departmentId: zod_1.z.string().optional(),
    salaryGrade: zod_1.z.string().optional(),
});
// Employee transfer schema
exports.transferEmployeeSchema = zod_1.z.object({
    departmentId: zod_1.z.string().min(1, 'Department ID is required'),
    designationId: zod_1.z.string().optional(),
    managerId: zod_1.z.string().optional(),
});
// Change status schema
exports.changeStatusSchema = zod_1.z.object({
    employmentStatus: zod_1.z.nativeEnum(Employee_1.EmploymentStatus, {
        message: 'Invalid employment status',
    }),
    reason: zod_1.z.string().optional(),
    effectiveDate: zod_1.z.string().datetime().optional(),
});
// Add skill schema
exports.addSkillSchema = zod_1.z.object({
    skill: zod_1.z
        .string()
        .min(1, 'Skill is required')
        .max(100, 'Skill cannot exceed 100 characters'),
});
// Add education schema
exports.addEducationSchema = zod_1.z.object({
    institution: zod_1.z
        .string()
        .min(1, 'Institution is required')
        .max(200, 'Institution cannot exceed 200 characters'),
    degree: zod_1.z
        .string()
        .min(1, 'Degree is required')
        .max(100, 'Degree cannot exceed 100 characters'),
    field: zod_1.z
        .string()
        .min(1, 'Field is required')
        .max(100, 'Field cannot exceed 100 characters'),
    graduationYear: zod_1.z
        .number()
        .min(1900, 'Invalid graduation year')
        .max(new Date().getFullYear() + 10, 'Graduation year cannot be in the far future'),
});
// Add certification schema
exports.addCertificationSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, 'Certification name is required')
        .max(200, 'Certification name cannot exceed 200 characters'),
    issuer: zod_1.z
        .string()
        .min(1, 'Issuer is required')
        .max(200, 'Issuer cannot exceed 200 characters'),
    issueDate: zod_1.z.string().datetime('Issue date must be a valid date'),
    expiryDate: zod_1.z.string().datetime('Expiry date must be a valid date').optional(),
    certificateUrl: zod_1.z.string().url().optional(),
});
// Upload document schema
exports.uploadDocumentSchema = zod_1.z.object({
    fileName: zod_1.z
        .string()
        .min(1, 'File name is required')
        .max(255, 'File name cannot exceed 255 characters'),
    fileType: zod_1.z.enum(['pdf', 'doc', 'docx', 'jpg', 'png', 'jpeg']),
    fileUrl: zod_1.z.string().url('Invalid file URL'),
});
// Bulk update schema
exports.bulkUpdateSchema = zod_1.z.object({
    employeeIds: zod_1.z.array(zod_1.z.string().min(1)).min(1, 'At least one employee ID is required'),
    updates: exports.updateEmployeeSchema,
});
// Employee list query schema
exports.employeeListSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).optional().default(10),
    search: zod_1.z.string().optional(),
    departmentId: zod_1.z.string().optional(),
    designationId: zod_1.z.string().optional(),
    managerId: zod_1.z.string().optional(),
    employmentStatus: zod_1.z.enum(Object.values(Employee_1.EmploymentStatus)).optional(),
    employmentType: zod_1.z.enum(Object.values(Employee_1.EmploymentType)).optional(),
    workLocation: zod_1.z.string().optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
});
