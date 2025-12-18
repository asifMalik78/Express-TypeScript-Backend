/**
 * HTTP Status Codes
 * Centralized constants for HTTP status codes used throughout the application
 */

// Success responses (2xx)
export const HTTP_STATUS = {
  ACCEPTED: 202,
  BAD_GATEWAY: 502,
  // 4xx Client Errors
  BAD_REQUEST: 400,
  CONFLICT: 409,

  CREATED: 201,
  FORBIDDEN: 403,
  FOUND: 302,

  GATEWAY_TIMEOUT: 504,
  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: 500,
  METHOD_NOT_ALLOWED: 405,
  // 3xx Redirection
  MOVED_PERMANENTLY: 301,
  NO_CONTENT: 204,
  NOT_FOUND: 404,
  NOT_IMPLEMENTED: 501,
  NOT_MODIFIED: 304,

  // 2xx Success
  OK: 200,
  SERVICE_UNAVAILABLE: 503,
  TOO_MANY_REQUESTS: 429,
  UNAUTHORIZED: 401,
  UNPROCESSABLE_ENTITY: 422,
} as const;

// Type for HTTP status codes
export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
