import logger from '../config/logger';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class JwtUtil {
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '15m';
  private static readonly JWT_REFRESH_EXPIRES_IN =
    process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
  private static readonly JWT_SECRET = process.env.JWT_SECRET ?? '';
  private static readonly JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ?? this.JWT_SECRET;

  /**
   * Generate access token
   */
  static generateAccessToken(payload: { userId: number }): string {
    try {
      return jwt.sign(payload, this.JWT_SECRET, {
        expiresIn: this.JWT_EXPIRES_IN,
      } as SignOptions);
    } catch (error) {
      logger.error('Error generating access token', error);
      throw error;
    }
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: { userId: number }): string {
    try {
      return jwt.sign(payload, this.JWT_REFRESH_SECRET, {
        expiresIn: this.JWT_REFRESH_EXPIRES_IN,
      } as SignOptions);
    } catch (error) {
      logger.error('Error generating refresh token', error);
      throw error;
    }
  }

  /**
   * Verify access token
   * @throws {JsonWebTokenError} if token is invalid
   * @throws {TokenExpiredError} if token is expired
   */
  static verifyAccessToken(token: string): JwtPayload & { userId: number } {
    if (!this.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }
    try {
      return jwt.verify(token, this.JWT_SECRET) as JwtPayload & {
        userId: number;
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid access token', { error: error.message });
        throw error;
      }
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Expired access token', { expiredAt: error.expiredAt });
        throw error;
      }
      logger.error('Error verifying access token', error);
      throw error;
    }
  }

  /**
   * Verify refresh token
   * @throws {JsonWebTokenError} if token is invalid
   * @throws {TokenExpiredError} if token is expired
   */
  static verifyRefreshToken(token: string): JwtPayload & { userId: number } {
    if (!this.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }
    try {
      return jwt.verify(token, this.JWT_REFRESH_SECRET) as JwtPayload & {
        userId: number;
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid refresh token', { error: error.message });
        throw error;
      }
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Expired refresh token', { expiredAt: error.expiredAt });
        throw error;
      }
      logger.error('Error verifying refresh token', error);
      throw error;
    }
  }
}

export default JwtUtil;
