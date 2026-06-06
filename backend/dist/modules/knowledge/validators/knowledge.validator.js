"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentIdParamSchema = exports.updateDocumentSchema = exports.uploadQuerySchema = exports.documentTypeSchema = exports.searchSchema = void 0;
const zod_1 = require("zod");
const KnowledgeDocument_1 = require("../../../models/KnowledgeDocument");
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = zod_1.z.string().regex(objectIdRegex, 'Invalid Mongoose ObjectId');
exports.searchSchema = zod_1.z.object({
    query: zod_1.z.string().min(1, 'Search query cannot be empty'),
    limit: zod_1.z.number().int().min(1).max(50).default(5).optional()
});
exports.documentTypeSchema = zod_1.z.nativeEnum(KnowledgeDocument_1.DocumentType);
exports.uploadQuerySchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(200),
    documentType: exports.documentTypeSchema,
    isApprovedForEmployees: zod_1.z.preprocess((val) => val === 'true' || val === true, zod_1.z.boolean()).default(false).optional()
});
exports.updateDocumentSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).optional(),
    documentType: exports.documentTypeSchema.optional(),
    isApprovedForEmployees: zod_1.z.boolean().optional()
});
exports.documentIdParamSchema = zod_1.z.object({
    id: objectIdSchema
});
