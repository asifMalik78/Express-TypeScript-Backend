import logger from '../config/logger';
import { HTTP_STATUS } from '../constants/httpStatus';
import { RateLimitOptions, RateLimitStore } from '../types/middleware.types';
import { AppError } from '../utils/AppError';
import { NextFunction, Request, Response } from 'express';

const store: RateLimitStore = {};

/**
 * Simple in-memory rate limiting middleware
 */
export const rateLimit = (options: RateLimitOptions) => {
  const {
    maxRequests,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
    windowMs,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const now = Date.now();

    // Clean up expired entries
    Object.keys(store).forEach(k => {
      const entry = store[k];
      if (entry.resetTime < now) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete store[k];
      }
    });

    // Get or create rate limit entry
    let entry = store[key];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      store[key] = entry;
    }

    // Increment count
    entry.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, maxRequests - entry.count)
    );
    res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      logger.warn('Rate limit exceeded', {
        count: entry.count,
        ip: key,
        path: req.path,
        requestId: req.id,
      });

      next(new AppError(message, HTTP_STATUS.TOO_MANY_REQUESTS));
      return;
    }

    // Track successful requests if needed
    if (skipSuccessfulRequests) {
      const originalSend = res.send;
      res.send = function (body) {
        if (res.statusCode < 400) {
          entry.count = Math.max(0, entry.count - 1);
        }
        return originalSend.call(this, body);
      };
    }

    next();
  };
};
