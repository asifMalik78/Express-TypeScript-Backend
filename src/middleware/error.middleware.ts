import logger from '../config/logger';
import { HTTP_STATUS } from '../constants/httpStatus';
import { AppError } from '../utils/AppError';
import { Request, Response } from 'express';
import { ZodError } from 'zod';

export const globalErrorHandler = (
  err: AppError | Error | ZodError,
  req: Request,
  res: Response
) => {
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

  // Handle unknown/programming errors
  logger.error('Unexpected error', {
    error: err.message,
    method: req.method,
    path: req.path,
    requestId,
    stack: err.stack,
  });

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message:
      process.env.NODE_ENV === 'production'
        ? 'Something went wrong!'
        : err.message,
    requestId,
    status: 'error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
