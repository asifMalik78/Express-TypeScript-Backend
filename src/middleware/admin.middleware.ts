import { HTTP_STATUS } from '#constants/httpStatus';
import { AppError } from '#utils/AppError';
import { NextFunction, Request, Response } from 'express';

/**
 * Middleware to check if user is admin
 * Must be used after authenticate middleware
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED);
  }

  if (req.user.role !== 'admin') {
    throw new AppError('Admin access required', HTTP_STATUS.FORBIDDEN);
  }

  next();
};
