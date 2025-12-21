import { z } from 'zod';

/**
 * Password strength validation
 * Requires: at least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  )
  .trim();

/**
 * Email validation schema
 * Comprehensive email validation with proper regex pattern
 */
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .trim()
  .toLowerCase()
  .max(255, 'Email must be less than 255 characters')
  .refine(
    val => {
      // More comprehensive email regex pattern (RFC 5322 compliant)
      // Email is already lowercased, so no need for case-insensitive flag
      const emailRegex =
        /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
      return emailRegex.test(val);
    },
    {
      message: 'Invalid email address format',
    }
  );

/**
 * Register validation schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters')
    .trim(),
  password: passwordSchema,
  role: z.enum(['user', 'admin']).default('user').optional(),
});

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').trim(),
});

/**
 * Refresh token validation schema
 */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').trim(),
});
