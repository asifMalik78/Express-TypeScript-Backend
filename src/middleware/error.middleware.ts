import logger from '../config/logger';
import { HTTP_STATUS } from '../constants/httpStatus';
import { AppError } from '../utils/AppError';
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export const globalErrorHandler = (
  err: AppError | Error | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If response has already been sent, delegate to default Express error handler
  if (res.headersSent) {
    next(err);
    return;
  }

  const requestId = req.id ?? 'unknown';

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    logger.warn('Validation error', {
      errors: err.issues,
      method: req.method,
      path: req.path,
      requestId,
    });

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      errors: err.issues,
      message: 'Validation failed',
      requestId,
      status: 'fail',
    });
  }

  // Handle operational AppErrors
  if (err instanceof AppError && err.isOperational) {
    logger.warn('Operational error', {
      message: err.message,
      method: req.method,
      path: req.path,
      requestId,
      statusCode: err.statusCode,
    });

    return res.status(err.statusCode).json({
      message: err.message,
      requestId,
      status: err.status,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    logger.warn('JWT error', {
      error: err.message,
      method: req.method,
      path: req.path,
      requestId,
    });

    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: 'Invalid token',
      requestId,
      status: 'fail',
    });
  }

  if (err.name === 'TokenExpiredError') {
    logger.warn('Token expired', {
      method: req.method,
      path: req.path,
      requestId,
    });

    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: 'Token expired',
      requestId,
      status: 'fail',
    });
  }

  // Handle database connection and query errors
  // Check for various database error patterns without exposing sensitive details
  const isDatabaseError =
    err.message.includes('Failed query') ||
    err.message.includes('fetch failed') ||
    err.message.includes('connect') ||
    err.message.includes('ECONNREFUSED') ||
    err.message.includes('ENOTFOUND') ||
    err.message.includes('ECONNRESET') ||
    err.message.includes('ETIMEDOUT') ||
    err.message.includes('database') ||
    err.message.includes('connection') ||
    err.message.includes('timeout') ||
    err.message.includes('SQL') ||
    err.message.includes('query') ||
    err.name === 'PostgresError' ||
    err.name === 'DatabaseError';

  if (isDatabaseError) {
    // Log full error details server-side only
    logger.error('Database error', {
      error: err.message,
      stack: err.stack,
      method: req.method,
      path: req.path,
      requestId,
      // Log additional context if available
      ...(err instanceof Error && 'code' in err && { code: err.code }),
    });

    // Never expose database error details to clients
    return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      message:
        'Database service is temporarily unavailable. Please try again later.',
      requestId,
      status: 'error',
    });
  }

  // Handle unknown/programming errors
  // Always log full error details server-side
  logger.error('Unexpected error', {
    error: err.message,
    method: req.method,
    path: req.path,
    requestId,
    stack: err.stack,
    // Log error name and code if available
    ...(err instanceof Error && {
      name: err.name,
      ...('code' in err && { code: err.code }),
    }),
  });

  // Never expose error details to clients in production
  // In development, show message but not stack traces or sensitive info
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message:
      process.env.NODE_ENV === 'production'
        ? 'Something went wrong!'
        : err.message,
    requestId,
    status: 'error',
    // Only show stack in development (database errors already handled above)
    ...(process.env.NODE_ENV !== 'production' && {
      stack: err.stack,
    }),
  });
};
