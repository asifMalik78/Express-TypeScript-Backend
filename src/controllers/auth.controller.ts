import { Request, Response, NextFunction } from 'express';
import {
  register,
  login as loginService,
  refresh,
  logout as logoutService,
} from '../services/auth.service';
import { catchAsync } from '../utils/catchAsync';
import { HTTP_STATUS } from '../constants/httpStatus';
import Cookies from '../utils/cookies';
import { COOKIE_NAMES } from '../constants/tokens';
import logger from '../config/logger';

/**
 * Sign up a new user
 */
export const signup = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { name, email, password } = req.body;
    const result = await register({ name, email, password });

    // Set cookies
    Cookies.set(res, COOKIE_NAMES.ACCESS_TOKEN, result.access_token);
    Cookies.set(res, COOKIE_NAMES.REFRESH_TOKEN, result.refresh_token);

    logger.info('User signed up', { userId: result.user.id, email });

    return res.status(HTTP_STATUS.CREATED).json({
      status: 'success',
      data: {
        user: result.user,
      },
    });
  }
);

/**
 * Login user
 */
export const login = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { email, password } = req.body;
    const result = await loginService({ email, password });

    // Set cookies
    Cookies.set(res, COOKIE_NAMES.ACCESS_TOKEN, result.access_token);
    Cookies.set(res, COOKIE_NAMES.REFRESH_TOKEN, result.refresh_token);

    logger.info('User logged in', { userId: result.user.id });

    return res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: {
        user: result.user,
        access_token: result.access_token,
      },
    });
  }
);

/**
 * Refresh access token
 */
export const refreshToken = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { refreshToken: requestRefreshToken } = req.body;
    const result = await refresh(requestRefreshToken);

    // Update refresh token cookie
    Cookies.set(res, COOKIE_NAMES.REFRESH_TOKEN, result.refresh_token);

    return res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: {
        access_token: result.access_token,
      },
    });
  }
);

/**
 * Logout user
 */
export const logout = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const refreshToken =
      req.cookies[COOKIE_NAMES.REFRESH_TOKEN] || req.body.refreshToken;

    if (refreshToken) {
      await logoutService(refreshToken);
    }

    // Clear cookies
    Cookies.remove(res, COOKIE_NAMES.ACCESS_TOKEN);
    Cookies.remove(res, COOKIE_NAMES.REFRESH_TOKEN);

    logger.info('User logged out', { userId: req.user?.id });

    return res.status(HTTP_STATUS.OK).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  }
);
