import {
  login,
  logout,
  refreshToken,
  signup,
} from '../controllers/auth.controller';
import {
  authenticate,
  authenticateRefreshToken,
} from '../middleware/auth.middleware';
import { rateLimit } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  loginSchema,
  refreshSchema,
  signupSchema,
} from '../validations/auth.validation';
import { Router } from 'express';

const router = Router();

// Rate limiting for auth routes
const authRateLimit = rateLimit({
  maxRequests: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  windowMs: 15 * 60 * 1000, // 15 minutes
});

/**
 * @route   POST /api/v1/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', authRateLimit, validate(signupSchema), signup);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authRateLimit, validate(loginSchema), login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  authRateLimit,
  validate(refreshSchema),
  authenticateRefreshToken,
  refreshToken
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (revoke refresh token)
 * @access  Private
 */
router.post('/logout', authenticate, logout);

export default router;
