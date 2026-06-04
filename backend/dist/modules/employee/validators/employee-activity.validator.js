"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityDateRangeSchema = exports.activityListSchema = void 0;
const zod_1 = require("zod");
const EmployeeActivity_1 = require("../../../models/EmployeeActivity");
// Employee activity list query schema
exports.activityListSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).optional().default(10),
    employeeId: zod_1.z.string().optional(),
    activityType: zod_1.z.enum(Object.values(EmployeeActivity_1.ActivityType)).optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
});
// Activity date range query schema
exports.activityDateRangeSchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime('Start date must be a valid date'),
    endDate: zod_1.z.string().datetime('End date must be a valid date'),
    page: zod_1.z.coerce.number().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).optional().default(10),
});
