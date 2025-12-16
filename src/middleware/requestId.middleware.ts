import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Middleware to add a unique request ID to each request
 * Useful for tracing requests in logs
 */
export const requestId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const id = randomUUID();
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}
