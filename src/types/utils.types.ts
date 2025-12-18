/**
 * Utility-related types and interfaces
 */

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit?: number;
  page?: number;
}

/**
 * Pagination result with data and metadata
 */
export interface PaginationResult<T> {
  data: T[];
  pagination: {
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
}
