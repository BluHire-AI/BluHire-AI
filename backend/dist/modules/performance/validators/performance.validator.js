"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessSkillSchema = exports.updateGoalSchema = exports.createGoalSchema = exports.updateReviewSchema = exports.createReviewSchema = void 0;
const zod_1 = require("zod");
exports.createReviewSchema = zod_1.z.object({
    employeeId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Employee ID'),
    reviewPeriod: zod_1.z.string().min(1, 'Review period is required'),
    reviewType: zod_1.z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']),
    overallScore: zod_1.z.number().min(0).max(100),
    communicationScore: zod_1.z.number().min(1).max(10),
    technicalScore: zod_1.z.number().min(1).max(10),
    leadershipScore: zod_1.z.number().min(1).max(10),
    productivityScore: zod_1.z.number().min(1).max(10),
    teamworkScore: zod_1.z.number().min(1).max(10),
    comments: zod_1.z.string().min(1, 'Supervisor comments are required'),
    strengths: zod_1.z.array(zod_1.z.string()).default([]),
    weaknesses: zod_1.z.array(zod_1.z.string()).default([])
});
exports.updateReviewSchema = exports.createReviewSchema.partial().extend({
    status: zod_1.z.enum(['DRAFT', 'SUBMITTED']).optional()
});
exports.createGoalSchema = zod_1.z.object({
    employeeId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Employee ID'),
    title: zod_1.z.string().min(1, 'Goal title is required'),
    description: zod_1.z.string().optional(),
    category: zod_1.z.string().default('General'),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
    targetDate: zod_1.z.string().transform((str) => new Date(str)),
    progressPercentage: zod_1.z.number().min(0).max(100).default(0),
    status: zod_1.z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']).default('NOT_STARTED')
});
exports.updateGoalSchema = exports.createGoalSchema.partial();
exports.assessSkillSchema = zod_1.z.object({
    employeeId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Employee ID'),
    skillName: zod_1.z.string().min(1, 'Skill name is required'),
    currentLevel: zod_1.z.number().min(1).max(10),
    desiredLevel: zod_1.z.number().min(1).max(10)
});
