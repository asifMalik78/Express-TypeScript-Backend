import { Request, Response, NextFunction } from 'express';
import JwtUtil from '../utils/jwt';
import { db } from '../config/database';
import { users, refreshTokens } from '../models/schema';
import { eq, and } from 'drizzle-orm';
import { HTTP_STATUS } from '../constants/httpStatus';
import { AppError } from '../utils/AppError';
import logger from '../config/logger';

/**
 * Authenticate user using access token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(
        'Authorization token required',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = JwtUtil.verifyAccessToken(token);

    if (!decoded || !decoded.userId) {
      throw new AppError('Invalid token', HTTP_STATUS.UNAUTHORIZED);
    }

    // Fetch user details from DB to ensure user exists and is active
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user) {
      logger.warn('User not found during authentication', {
        userId: decoded.userId,
        requestId: req.id,
      });
      throw new AppError('User not found', HTTP_STATUS.UNAUTHORIZED);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role ?? 'user',
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticate user using refresh token from cookies
 */
export const authenticateRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies['refresh_token'] || req.body.refreshToken;

    if (!refreshToken) {
      throw new AppError('Refresh token required', HTTP_STATUS.UNAUTHORIZED);
    }

    const decoded = JwtUtil.verifyRefreshToken(refreshToken);
    if (!decoded || !decoded.userId) {
      throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
    }

    // Check if token exists in DB and is not revoked
    const [refreshTokenRecord] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, refreshToken),
          eq(refreshTokens.isRevoked, false)
        )
      )
      .limit(1);

    if (!refreshTokenRecord) {
      logger.warn('Refresh token not found or revoked', {
        userId: decoded.userId,
        requestId: req.id,
      });
      throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
    }

    // Check if token has expired
    const now = Date.now();
    const expiresAt = refreshTokenRecord.expiresAt.getTime();
    if (now > expiresAt) {
      logger.warn('Expired refresh token used', {
        userId: decoded.userId,
        tokenId: refreshTokenRecord.id,
        requestId: req.id,
      });
      throw new AppError('Refresh token expired', HTTP_STATUS.UNAUTHORIZED);
    }

    req.user = {
      id: decoded.userId,
    };

    next();
  } catch (error) {
    next(error);
  }
};
