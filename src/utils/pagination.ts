/**
 * Pagination utilities
 */

import { PaginationOptions, PaginationResult } from '#types/utils.types';

// Re-export types for backward compatibility
export type { PaginationOptions, PaginationResult };

/**
 * Calculate pagination metadata
 */
export const getPaginationMeta = (
  page: number,
  limit: number,
  total: number
) => {
  const totalPages = Math.ceil(total / limit);
  return {
    hasNext: page < totalPages,
    hasPrev: page > 1,
    limit,
    page,
    total,
    totalPages,
  };
};

/**
 * Calculate offset for database queries
 */
export const getOffset = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

/**
 * Normalize pagination options
 */
export const normalizePagination = (
  options: PaginationOptions
): { limit: number; page: number } => {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 10));
  return { limit, page };
};
