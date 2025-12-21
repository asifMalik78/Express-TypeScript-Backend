import { db } from '../config/database';
import logger from '../config/logger';
import { HTTP_STATUS } from '../constants/httpStatus';
import { COOKIE_NAMES } from '../constants/tokens';
import { refreshTokens, users } from '../models/schema';
import { AppError } from '../utils/AppError';
import JwtUtil from '../utils/jwt';
import { and, eq } from 'drizzle-orm';
import { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Authenticate user using access token
 */
export const authenticate: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(
        'Authorization token required',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = JwtUtil.verifyAccessToken(token);

    if (!decoded.userId) {
      throw new AppError('Invalid token', HTTP_STATUS.UNAUTHORIZED);
    }

    // Fetch user details from DB to ensure user exists and is active
    const [user] = await db
      .select({
        email: users.email,
        id: users.id,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    // User will always exist if decoded.userId exists (checked above)
    // This check is for type safety

    req.user = {
      email: user.email,
      id: user.id,
      role: user.role ?? 'user',
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticate user using refresh token from cookies (dev) or body (test fallback)
 */
export const authenticateRefreshToken: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get refresh token from cookies first (dev), then body as fallback (test)
    const body = req.body as undefined | { refreshToken?: string };
    const refreshToken =
      (req.cookies[COOKIE_NAMES.REFRESH_TOKEN] as string | undefined) ??
      body?.refreshToken;

    if (!refreshToken) {
      throw new AppError('Refresh token required', HTTP_STATUS.UNAUTHORIZED);
    }

    const decoded = JwtUtil.verifyRefreshToken(refreshToken);
    if (!decoded.userId) {
      throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
    }

    // Check if token exists in DB and is not revoked
    const refreshTokenRecords = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, refreshToken),
          eq(refreshTokens.isRevoked, false)
        )
      )
      .limit(1);

    if (refreshTokenRecords.length === 0) {
      throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
    }

    const [refreshTokenRecord] = refreshTokenRecords;

    // Check if token has expired - if expired, we'll logout the user
    const now = Date.now();
    const expiresAt = refreshTokenRecord.expiresAt.getTime();
    if (now > expiresAt) {
      logger.warn('Expired refresh token used', {
        requestId: req.id,
        tokenId: refreshTokenRecord.id,
        userId: decoded.userId,
      });
      // Revoke the expired token
      await db
        .update(refreshTokens)
        .set({
          isRevoked: true,
          revokedAt: new Date(),
        })
        .where(eq(refreshTokens.id, refreshTokenRecord.id));
      throw new AppError('Refresh token expired', HTTP_STATUS.UNAUTHORIZED);
    }

    req.user = {
      id: decoded.userId,
    };

    // Store refresh token in request for use in controller
    req.refreshToken = refreshToken;

    next();
  } catch (error) {
    next(error);
  }
};
