import { z } from 'zod';
import { DocumentType } from '../../../models/KnowledgeDocument';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid Mongoose ObjectId');

export const searchSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty'),
  limit: z.number().int().min(1).max(50).default(5).optional()
});

export const documentTypeSchema = z.nativeEnum(DocumentType);

export const uploadQuerySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  documentType: documentTypeSchema,
  isApprovedForEmployees: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean()
  ).default(false).optional()
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  documentType: documentTypeSchema.optional(),
  isApprovedForEmployees: z.boolean().optional()
});

export const documentIdParamSchema = z.object({
  id: objectIdSchema
});
