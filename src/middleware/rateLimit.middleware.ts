import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '#constants/httpStatus';
import { AppError } from '#utils/AppError';
import logger from '#config/logger';
import { RateLimitOptions, RateLimitStore } from '#types/middleware.types';

const store: RateLimitStore = {};

/**
 * Simple in-memory rate limiting middleware
 */
export const rateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // Clean up expired entries
    Object.keys(store).forEach(k => {
      if (store[k].resetTime < now) {
        delete store[k];
      }
    });

    // Get or create rate limit entry
    let entry = store[key];
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
        ip: key,
        path: req.path,
        count: entry.count,
        requestId: req.id,
      });

      return next(new AppError(message, HTTP_STATUS.TOO_MANY_REQUESTS));
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
