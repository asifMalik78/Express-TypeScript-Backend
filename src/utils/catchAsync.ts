import { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wraps async route handlers to catch errors and pass them to error middleware
 * @param fn - Async route handler function
 * @returns Wrapped function that catches errors
 */
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
