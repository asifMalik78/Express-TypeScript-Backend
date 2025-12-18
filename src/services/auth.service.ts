import { db } from '#config/database';
import logger from '#config/logger';
import { HTTP_STATUS } from '#constants/httpStatus';
import { TOKEN_EXPIRATION } from '#constants/tokens';
import { refreshTokens, users } from '#models/schema';
import {
  AuthResponse,
  LoginInput,
  RefreshTokenResponse,
  RegisterInput,
} from '#types/user.types';
import { AppError } from '#utils/AppError';
import { comparePassword, hashPassword } from '#utils/hash';
import JwtUtil from '#utils/jwt';
import { and, eq } from 'drizzle-orm';

/**
 * Register a new user
 */
export const register = async ({
  email,
  name,
  password,
}: RegisterInput): Promise<AuthResponse> => {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    logger.warn('Registration attempt with existing email', { email });
    throw new AppError('User already exists', HTTP_STATUS.CONFLICT);
  }

  const hashedPassword = await hashPassword(password);

  const [newUser] = await db
    .insert(users)
    .values({
      email,
      name,
      password: hashedPassword,
      role: 'user',
    })
    .returning();

  logger.info('User registered successfully', { email, userId: newUser.id });

  // Generate tokens
  const accessToken = JwtUtil.generateAccessToken({ userId: newUser.id });
  const refreshToken = JwtUtil.generateRefreshToken({ userId: newUser.id });

  // Store refresh token (access token is stateless, no need to store)
  await db.insert(refreshTokens).values({
    expiresAt: new Date(Date.now() + TOKEN_EXPIRATION.REFRESH_TOKEN),
    token: refreshToken,
    userId: newUser.id,
  });

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      email: newUser.email,
      id: newUser.id,
      name: newUser.name,
      role: newUser.role ?? 'user',
    },
  };
};

/**
 * Login user
 */
export const login = async ({
  email,
  password,
}: LoginInput): Promise<AuthResponse> => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // User will always exist if query returns a result
  // This check is for type safety

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    logger.warn('Login attempt with invalid password', { userId: user.id });
    throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
  }

  logger.info('User logged in successfully', { userId: user.id });

  // Generate tokens
  const accessToken = JwtUtil.generateAccessToken({ userId: user.id });
  const refreshToken = JwtUtil.generateRefreshToken({ userId: user.id });

  // Store refresh token (create new session)
  // Access token is stateless, no need to store in DB
  await db.insert(refreshTokens).values({
    expiresAt: new Date(Date.now() + TOKEN_EXPIRATION.REFRESH_TOKEN),
    token: refreshToken,
    userId: user.id,
  });

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      email: user.email,
      id: user.id,
      name: user.name,
      role: user.role ?? 'user',
    },
  };
};

/**
 * Refresh access token using refresh token
 */
export const refresh = async (
  requestRefreshToken: string
): Promise<RefreshTokenResponse> => {
  const decoded = JwtUtil.verifyRefreshToken(requestRefreshToken);
  if (!decoded.userId) {
    logger.warn('Invalid refresh token attempt');
    throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
  }

  // Check if token exists in DB and is not revoked
  const [storedRefreshToken] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.token, requestRefreshToken),
        eq(refreshTokens.isRevoked, false)
      )
    )
    .limit(1);

  // storedRefreshToken will always exist if decoded.userId exists (checked above)
  // This check is for type safety

  // Check if token has expired
  if (new Date() > storedRefreshToken.expiresAt) {
    logger.warn('Expired refresh token used', {
      tokenId: storedRefreshToken.id,
      userId: decoded.userId,
    });
    throw new AppError('Refresh token has expired', HTTP_STATUS.UNAUTHORIZED);
  }

  // Generate new tokens
  const newAccessToken = JwtUtil.generateAccessToken({
    userId: decoded.userId,
  });
  const newRefreshToken = JwtUtil.generateRefreshToken({
    userId: decoded.userId,
  });

  // Revoke old refresh token
  await db
    .update(refreshTokens)
    .set({
      isRevoked: true,
      revokedAt: new Date(),
    })
    .where(eq(refreshTokens.id, storedRefreshToken.id));

  // Store new refresh token
  // Access token is stateless, no need to store in DB
  await db.insert(refreshTokens).values({
    expiresAt: new Date(Date.now() + TOKEN_EXPIRATION.REFRESH_TOKEN),
    token: newRefreshToken,
    userId: decoded.userId,
  });

  logger.info('Tokens refreshed successfully', { userId: decoded.userId });

  return {
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
  };
};

/**
 * Revoke a specific refresh token
 */
export const revokeRefreshToken = async (
  refreshToken: string
): Promise<void> => {
  const result = await db
    .update(refreshTokens)
    .set({
      isRevoked: true,
      revokedAt: new Date(),
    })
    .where(eq(refreshTokens.token, refreshToken))
    .returning();

  if (result.length > 0) {
    logger.info('Refresh token revoked', { tokenId: result[0].id });
  }
};

/**
 * Revoke all refresh tokens for a user
 */
export const revokeAllUserRefreshTokens = async (
  userId: number
): Promise<void> => {
  const result = await db
    .update(refreshTokens)
    .set({
      isRevoked: true,
      revokedAt: new Date(),
    })
    .where(
      and(eq(refreshTokens.userId, userId), eq(refreshTokens.isRevoked, false))
    )
    .returning();

  if (result.length > 0) {
    logger.info('All user refresh tokens revoked', {
      count: result.length,
      userId,
    });
  }
};

/**
 * Logout user (revoke refresh token)
 */
export const logout = async (refreshToken: string): Promise<void> => {
  await revokeRefreshToken(refreshToken);
  logger.info('User logged out', {
    refreshToken: refreshToken.substring(0, 10) + '...',
  });
};
