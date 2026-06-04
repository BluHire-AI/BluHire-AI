import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Validation middleware for request body
 */
export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: error.errors || error.message,
        statusCode: 400,
      });
    }
  };
};

/**
 * Validation middleware for query parameters
 */
export const validateQuery = (schema: ZodSchema) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      await schema.parseAsync(req.query);
      next();
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: error.errors || error.message,
        statusCode: 400,
      });
    }
  };
};

/**
 * Validation middleware for params
 */
export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated as any;
      next();
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: error.errors || error.message,
        statusCode: 400,
      });
    }
  };
};

/**
 * Combined validation middleware
 */
export const validate = (
  bodySchema?: ZodSchema,
  querySchema?: ZodSchema,
  paramsSchema?: ZodSchema
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (bodySchema && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        req.body = await bodySchema.parseAsync(req.body);
      }

      if (querySchema && Object.keys(req.query).length > 0) {
        req.query = await querySchema.parseAsync(req.query) as any;
      }

      if (paramsSchema && Object.keys(req.params).length > 0) {
        req.params = await paramsSchema.parseAsync(req.params) as any;
      }

      next();
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: error.errors || error.message,
        statusCode: 400,
      });
    }
  };
};
