import { HTTP_STATUS } from '../constants/httpStatus';
import { ValidationSchemas } from '../types/middleware.types';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

/**
 * Validation middleware factory
 * Supports validating body, query, and params
 */
export const validate = (schemas: ValidationSchemas | z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // If a single schema is provided, assume it's for body (backward compatibility)
    // Check if it's a ValidationSchemas object or a single ZodType
    if (
      'safeParse' in schemas &&
      !('body' in schemas) &&
      !('query' in schemas) &&
      !('params' in schemas)
    ) {
      const bodySchema = schemas;
      const result = bodySchema.safeParse(req.body);

      if (!result.success) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          errors: result.error.issues.map(issue => ({
            message: issue.message,
          })),
          message: 'Validation failed',
          requestId: req.id,
          status: 'fail',
        });
      }

      req.body = result.data;
      next();
      return;
    }

    // Multiple schemas provided
    const validationSchemas = schemas as ValidationSchemas;
    const errors: z.ZodError['issues'] = [];

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
        // In Express 5, req.query is read-only, so store validated data in custom property
        req.validatedQuery = result.data as Record<string, unknown>;
        // Also merge into req.query for backward compatibility (if possible)
        try {
          Object.assign(req.query, result.data);
        } catch {
          // If assignment fails, validatedQuery will be used
        }
      }
    }

    // Validate params
    if (validationSchemas.params) {
      const result = validationSchemas.params.safeParse(req.params);
      if (!result.success) {
        errors.push(...result.error.issues);
      } else {
        // In Express 5, req.params is read-only, so store validated data in custom property
        req.validatedParams = result.data as Record<string, unknown>;
        // Also merge into req.params for backward compatibility (if possible)
        try {
          Object.assign(req.params, result.data);
        } catch {
          // If assignment fails, validatedParams will be used
        }
      }
    }

    if (errors.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        errors: errors.map(issue => ({ message: issue.message })),
        message: 'Validation failed',
        requestId: req.id,
        status: 'fail',
      });
    }

    next();
  };
};
