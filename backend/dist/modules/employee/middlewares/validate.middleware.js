"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.validateParams = exports.validateQuery = exports.validateBody = void 0;
/**
 * Validation middleware for request body
 */
const validateBody = (schema) => {
    return async (req, res, next) => {
        try {
            const validated = await schema.parseAsync(req.body);
            req.body = validated;
            next();
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                error: error.errors || error.message,
                statusCode: 400,
            });
        }
    };
};
exports.validateBody = validateBody;
/**
 * Validation middleware for query parameters
 */
const validateQuery = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync(req.query);
            next();
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                error: error.errors || error.message,
                statusCode: 400,
            });
        }
    };
};
exports.validateQuery = validateQuery;
/**
 * Validation middleware for params
 */
const validateParams = (schema) => {
    return async (req, res, next) => {
        try {
            const validated = await schema.parseAsync(req.params);
            req.params = validated;
            next();
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                error: error.errors || error.message,
                statusCode: 400,
            });
        }
    };
};
exports.validateParams = validateParams;
/**
 * Combined validation middleware
 */
const validate = (bodySchema, querySchema, paramsSchema) => {
    return async (req, res, next) => {
        try {
            if (bodySchema && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
                req.body = await bodySchema.parseAsync(req.body);
            }
            if (querySchema && Object.keys(req.query).length > 0) {
                req.query = await querySchema.parseAsync(req.query);
            }
            if (paramsSchema && Object.keys(req.params).length > 0) {
                req.params = await paramsSchema.parseAsync(req.params);
            }
            next();
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                error: error.errors || error.message,
                statusCode: 400,
            });
        }
    };
};
exports.validate = validate;
