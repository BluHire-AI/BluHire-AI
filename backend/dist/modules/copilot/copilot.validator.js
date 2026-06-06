"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportExportQuerySchema = exports.reportParamSchema = exports.actionConfirmSchema = exports.chatQuerySchema = void 0;
const zod_1 = require("zod");
exports.chatQuerySchema = zod_1.z.object({
    message: zod_1.z.string().min(1, 'Message cannot be empty'),
    conversationId: zod_1.z.string().optional()
});
exports.actionConfirmSchema = zod_1.z.object({
    tool: zod_1.z.string().min(1, 'Tool name is required'),
    args: zod_1.z.record(zod_1.z.string(), zod_1.z.any()),
    conversationId: zod_1.z.string().optional()
});
exports.reportParamSchema = zod_1.z.object({
    reportId: zod_1.z.string().uuid().or(zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Mongoose ID'))
});
exports.reportExportQuerySchema = zod_1.z.object({
    format: zod_1.z.enum(['csv', 'pdf']).default('csv')
});
