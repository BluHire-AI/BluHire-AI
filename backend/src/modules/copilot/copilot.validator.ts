import { z } from 'zod';

export const chatQuerySchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  conversationId: z.string().optional()
});

export const actionConfirmSchema = z.object({
  tool: z.string().min(1, 'Tool name is required'),
  args: z.record(z.string(), z.any()),
  conversationId: z.string().optional()
});

export const reportParamSchema = z.object({
  reportId: z.string().uuid().or(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Mongoose ID'))
});

export const reportExportQuerySchema = z.object({
  format: z.enum(['csv', 'pdf']).default('csv')
});
