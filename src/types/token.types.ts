/**
 * Token-related types and interfaces
 */

/**
 * Access token payload
 */
export interface AccessTokenPayload {
  userId: number;
}

/**
 * JWT token payload structure
 */
export interface JwtTokenPayload {
  exp?: number;
  iat?: number;
  userId: number;
}

/**
 * Refresh token payload
 */
export interface RefreshTokenPayload {
  userId: number;
}

/**
 * Token expiration configuration
 */
export interface TokenExpirationConfig {
  accessToken: number | string;
  refreshToken: number | string;
}

/**
 * Token pair response
 */
export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

/**
 * Token verification result
 */
export interface TokenVerificationResult {
  error?: string;
  payload?: JwtTokenPayload;
  valid: boolean;
}
