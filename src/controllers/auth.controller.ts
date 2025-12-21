import logger from '../config/logger';
import { HTTP_STATUS } from '../constants/httpStatus';
import { COOKIE_NAMES } from '../constants/tokens';
import {
  login as loginService,
  logout as logoutService,
  refresh,
  register as registerService,
} from '../services/auth.service';
import { AuthResponse, RefreshTokenResponse } from '../types/user.types';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import Cookies from '../utils/cookies';
import { Request, Response } from 'express';

/**
 * Sign up a new user
 */
export const signup = catchAsync(async (req: Request, res: Response) => {
  const { email, name, password } = req.body as {
    email: string;
    name: string;
    password: string;
  };
  const result: AuthResponse = await registerService({ email, name, password });

  // Set cookies
  Cookies.set(res, COOKIE_NAMES.ACCESS_TOKEN, result.access_token);
  Cookies.set(res, COOKIE_NAMES.REFRESH_TOKEN, result.refresh_token);

  logger.info('User signed up', { email, userId: result.user.id });

  return res.status(HTTP_STATUS.CREATED).json({
    data: {
      user: result.user,
    },
    status: 'success',
  });
});

/**
 * Login user
 */
export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body as {
    email: string;
    password: string;
  };
  const result: AuthResponse = await loginService({ email, password });

  // Set cookies
  Cookies.set(res, COOKIE_NAMES.ACCESS_TOKEN, result.access_token);
  Cookies.set(res, COOKIE_NAMES.REFRESH_TOKEN, result.refresh_token);

  logger.info('User logged in', { userId: result.user.id });

  return res.status(HTTP_STATUS.OK).json({
    data: {
      access_token: result.access_token,
      user: result.user,
    },
    status: 'success',
  });
});

/**
 * Refresh access token
 * Gets refresh token from cookies (dev) or body (test fallback)
 * If refresh token expires, logs out user by clearing cookies
 */
export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  // Get refresh token from middleware (which got it from cookies or body)
  const refreshTokenFromRequest = req.refreshToken;

  if (!refreshTokenFromRequest) {
    throw new AppError(
      'Refresh token not found in request',
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  try {
    const result: RefreshTokenResponse = await refresh(refreshTokenFromRequest);

    // Set new access token cookie
    Cookies.set(res, COOKIE_NAMES.ACCESS_TOKEN, result.access_token);

    return res.status(HTTP_STATUS.OK).json({
      data: {
        access_token: result.access_token,
      },
      status: 'success',
    });
  } catch (error) {
    // If refresh token expired or invalid, logout user by clearing cookies
    if (
      (error instanceof AppError &&
        error.statusCode === HTTP_STATUS.UNAUTHORIZED) ||
      (error instanceof Error &&
        (error.message.includes('expired') ||
          error.message.includes('Invalid refresh token')))
    ) {
      logger.info('Logging out user due to expired/invalid refresh token');
      Cookies.remove(res, COOKIE_NAMES.ACCESS_TOKEN);
      Cookies.remove(res, COOKIE_NAMES.REFRESH_TOKEN);
    }
    throw error;
  }
});

/**
 * Logout user
 */
export const logout = catchAsync(async (req: Request, res: Response) => {
  const body = req.body as undefined | { refreshToken?: string };
  const refreshToken =
    body?.refreshToken ??
    (req.cookies[COOKIE_NAMES.REFRESH_TOKEN] as string | undefined);

  if (refreshToken) {
    await logoutService(refreshToken);
  }

  // Clear cookies
  Cookies.remove(res, COOKIE_NAMES.ACCESS_TOKEN);
  Cookies.remove(res, COOKIE_NAMES.REFRESH_TOKEN);

  logger.info('User logged out', {
    userId: req.user ? (req.user as { id: number }).id : undefined,
  });

  return res.status(HTTP_STATUS.OK).json({
    message: 'Logged out successfully',
    status: 'success',
  });
});
