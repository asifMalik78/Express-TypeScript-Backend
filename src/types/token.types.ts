/**
 * Token-related types and interfaces
 */

/**
 * JWT token payload structure
 */
export interface JwtTokenPayload {
  userId: number;
  iat?: number;
  exp?: number;
}

/**
 * Access token payload
 */
export interface AccessTokenPayload {
  userId: number;
}

/**
 * Refresh token payload
 */
export interface RefreshTokenPayload {
  userId: number;
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
  valid: boolean;
  payload?: JwtTokenPayload;
  error?: string;
}

/**
 * Token expiration configuration
 */
export interface TokenExpirationConfig {
  accessToken: string | number;
  refreshToken: string | number;
}
