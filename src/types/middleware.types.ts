/**
 * Middleware-related types and interfaces
 */

import { ZodTypeAny } from 'zod';

/**
 * Rate limiting configuration options
 */
export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
}

/**
 * Rate limit store entry
 */
export interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Rate limit store structure
 */
export interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

/**
 * Validation schemas for request validation middleware
 */
export interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}
