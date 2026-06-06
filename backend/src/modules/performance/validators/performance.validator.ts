import { z } from 'zod';

export const createReviewSchema = z.object({
  employeeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Employee ID'),
  reviewPeriod: z.string().min(1, 'Review period is required'),
  reviewType: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']),
  overallScore: z.number().min(0).max(100),
  communicationScore: z.number().min(1).max(10),
  technicalScore: z.number().min(1).max(10),
  leadershipScore: z.number().min(1).max(10),
  productivityScore: z.number().min(1).max(10),
  teamworkScore: z.number().min(1).max(10),
  comments: z.string().min(1, 'Supervisor comments are required'),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([])
});

export const updateReviewSchema = createReviewSchema.partial().extend({
  status: z.enum(['DRAFT', 'SUBMITTED']).optional()
});

export const createGoalSchema = z.object({
  employeeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Employee ID'),
  title: z.string().min(1, 'Goal title is required'),
  description: z.string().optional(),
  category: z.string().default('General'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  targetDate: z.string().transform((str) => new Date(str)),
  progressPercentage: z.number().min(0).max(100).default(0),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']).default('NOT_STARTED')
});

export const updateGoalSchema = createGoalSchema.partial();

export const assessSkillSchema = z.object({
  employeeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Employee ID'),
  skillName: z.string().min(1, 'Skill name is required'),
  currentLevel: z.number().min(1).max(10),
  desiredLevel: z.number().min(1).max(10)
});
