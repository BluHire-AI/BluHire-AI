"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.designationListSchema = exports.updateDesignationSchema = exports.createDesignationSchema = void 0;
const zod_1 = require("zod");
// Create designation schema
exports.createDesignationSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .min(2, 'Title must be at least 2 characters')
        .max(100, 'Title cannot exceed 100 characters'),
    description: zod_1.z
        .string()
        .max(500, 'Description cannot exceed 500 characters')
        .optional(),
    departmentId: zod_1.z.string().min(1, 'Department ID is required'),
    level: zod_1.z
        .number()
        .min(1, 'Level must be between 1 and 7')
        .max(7, 'Level must be between 1 and 7'),
});
// Update designation schema
exports.updateDesignationSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .min(2, 'Title must be at least 2 characters')
        .max(100, 'Title cannot exceed 100 characters')
        .optional(),
    description: zod_1.z
        .string()
        .max(500, 'Description cannot exceed 500 characters')
        .optional(),
    departmentId: zod_1.z.string().optional(),
    level: zod_1.z
        .number()
        .min(1, 'Level must be between 1 and 7')
        .max(7, 'Level must be between 1 and 7')
        .optional(),
});
// Designation list query schema
exports.designationListSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).optional().default(10),
    search: zod_1.z.string().optional(),
    departmentId: zod_1.z.string().optional(),
    level: zod_1.z.coerce.number().min(1).max(7).optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
});
