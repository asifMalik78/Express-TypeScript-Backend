import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../constants/httpStatus';
import { z, ZodTypeAny } from 'zod';
import { ValidationSchemas } from '../types/middleware.types';

/**
 * Validation middleware factory
 * Supports validating body, query, and params
 */
export const validate = (schemas: ValidationSchemas | ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // If a single schema is provided, assume it's for body (backward compatibility)
    if (
      schemas &&
      !('body' in schemas) &&
      !('query' in schemas) &&
      !('params' in schemas)
    ) {
      const bodySchema = schemas as ZodTypeAny;
      const result = bodySchema.safeParse(req.body);

      if (!result.success) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'fail',
          message: 'Validation failed',
          errors: result.error.issues,
          requestId: req.id,
        });
      }

      req.body = result.data;
      return next();
    }

    // Multiple schemas provided
    const validationSchemas = schemas as ValidationSchemas;
    const errors: z.ZodIssue[] = [];

    // Validate body
    if (validationSchemas.body) {
      const result = validationSchemas.body.safeParse(req.body);
      if (!result.success) {
        errors.push(...result.error.issues);
      } else {
        req.body = result.data;
      }
    }

    // Validate query
    if (validationSchemas.query) {
      const result = validationSchemas.query.safeParse(req.query);
      if (!result.success) {
        errors.push(...result.error.issues);
      } else {
        req.query = result.data as typeof req.query;
      }
    }

    // Validate params
    if (validationSchemas.params) {
      const result = validationSchemas.params.safeParse(req.params);
      if (!result.success) {
        errors.push(...result.error.issues);
      } else {
        req.params = result.data as typeof req.params;
      }
    }

    if (errors.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: 'fail',
        message: 'Validation failed',
        errors,
        requestId: req.id,
      });
    }

    next();
  };
};
