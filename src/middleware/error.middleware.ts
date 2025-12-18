import { Request, Response, NextFunction } from 'express';
import { AppError } from '#utils/AppError';
import { ZodError } from 'zod';
import logger from '#config/logger';
import { HTTP_STATUS } from '#constants/httpStatus';

export const globalErrorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = req.id || 'unknown';

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    logger.warn('Validation error', {
      requestId,
      path: req.path,
      method: req.method,
      errors: err.issues,
    });

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      status: 'fail',
      message: 'Validation failed',
      errors: err.issues,
      requestId,
    });
  }

  // Handle operational AppErrors
  if (err instanceof AppError && err.isOperational) {
    logger.warn('Operational error', {
      requestId,
      path: req.path,
      method: req.method,
      statusCode: err.statusCode,
      message: err.message,
    });

    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      requestId,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    logger.warn('JWT error', {
      requestId,
      path: req.path,
      method: req.method,
      error: err.message,
    });

    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      status: 'fail',
      message: 'Invalid token',
      requestId,
    });
  }

  if (err.name === 'TokenExpiredError') {
    logger.warn('Token expired', {
      requestId,
      path: req.path,
      method: req.method,
    });

    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      status: 'fail',
      message: 'Token expired',
      requestId,
    });
  }

  // Handle unknown/programming errors
  logger.error('Unexpected error', {
    requestId,
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    status: 'error',
    message:
      process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message,
    requestId,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
