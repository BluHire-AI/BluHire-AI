"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportQuerySchema = exports.analyticsPaginationSchema = exports.analyticsQuerySchema = void 0;
const zod_1 = require("zod");
exports.analyticsQuerySchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    endDate: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    jobId: zod_1.z.string().optional(),
    departmentId: zod_1.z.string().optional(),
});
exports.analyticsPaginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).optional().default(10),
    startDate: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    endDate: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    jobId: zod_1.z.string().optional(),
    departmentId: zod_1.z.string().optional(),
});
exports.exportQuerySchema = zod_1.z.object({
    report: zod_1.z.enum(['recruitment', 'recruiter', 'ai-screening', 'interview', 'hiring']).default('recruitment'),
    format: zod_1.z.enum(['csv', 'excel', 'pdf']).default('csv'),
    startDate: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    endDate: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    jobId: zod_1.z.string().optional(),
    departmentId: zod_1.z.string().optional(),
});
