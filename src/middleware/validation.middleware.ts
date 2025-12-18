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
          errors: result.error.issues,
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
    const errors: z.core.$ZodIssue[] = [];

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
        errors,
        message: 'Validation failed',
        requestId: req.id,
        status: 'fail',
      });
    }

    next();
  };
};
