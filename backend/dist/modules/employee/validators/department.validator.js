"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentListSchema = exports.assignDepartmentHeadSchema = exports.updateDepartmentSchema = exports.createDepartmentSchema = void 0;
const zod_1 = require("zod");
// Create department schema
exports.createDepartmentSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(2, 'Department name must be at least 2 characters')
        .max(100, 'Department name cannot exceed 100 characters'),
    description: zod_1.z
        .string()
        .max(500, 'Description cannot exceed 500 characters')
        .optional(),
    departmentHead: zod_1.z.string().optional(),
});
// Update department schema
exports.updateDepartmentSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(2, 'Department name must be at least 2 characters')
        .max(100, 'Department name cannot exceed 100 characters')
        .optional(),
    description: zod_1.z
        .string()
        .max(500, 'Description cannot exceed 500 characters')
        .optional(),
    departmentHead: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
// Assign department head schema
exports.assignDepartmentHeadSchema = zod_1.z.object({
    employeeId: zod_1.z.string().min(1, 'Employee ID is required'),
});
// Department list query schema
exports.departmentListSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).optional().default(10),
    search: zod_1.z.string().optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
});
