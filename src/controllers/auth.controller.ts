import logger from '../config/logger';
import { HTTP_STATUS } from '../constants/httpStatus';
import { COOKIE_NAMES } from '../constants/tokens';
import {
  login as loginService,
  logout as logoutService,
  refresh,
  register,
} from '../services/auth.service';
import {
  AuthResponse,
  AuthUser,
  RefreshTokenResponse,
} from '../types/user.types';
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
  const result: AuthResponse = await register({ email, name, password });

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
 */
export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken: requestRefreshToken } = req.body as {
    refreshToken: string;
  };
  const result: RefreshTokenResponse = await refresh(requestRefreshToken);

  // Update refresh token cookie
  Cookies.set(res, COOKIE_NAMES.REFRESH_TOKEN, result.refresh_token);

  return res.status(HTTP_STATUS.OK).json({
    data: {
      access_token: result.access_token,
    },
    status: 'success',
  });
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

  const user = req.user as AuthUser | undefined;
  logger.info('User logged out', { userId: user?.id });

  return res.status(HTTP_STATUS.OK).json({
    message: 'Logged out successfully',
    status: 'success',
  });
});
