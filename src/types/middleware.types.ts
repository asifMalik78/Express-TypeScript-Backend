/**
 * Middleware-related types and interfaces
 */

import { z } from 'zod';

/**
 * Rate limit store entry
 */
export interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Rate limiting configuration options
 */
export interface RateLimitOptions {
  maxRequests: number; // Maximum number of requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  windowMs: number; // Time window in milliseconds
}

/**
 * Rate limit store structure
 */
export type RateLimitStore = Record<string, RateLimitEntry>;

/**
 * Validation schemas for request validation middleware
 */
export interface ValidationSchemas {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}
