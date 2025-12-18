import { z } from 'zod';

/**
 * Email validation schema
 * Using refine for email validation as .email() is deprecated in Zod v4
 */
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(255, 'Email must be less than 255 characters')
  .refine(val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
    message: 'Invalid email address',
  });

/**
 * Password strength validation
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
 * Create user validation schema
 */
export const createUserSchema = z.object({
  email: emailSchema,
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters')
    .trim(),
  password: passwordSchema,
  role: z.enum(['user', 'admin', 'moderator']).default('user').optional(),
});

/**
 * Update user validation schema
 */
export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters')
    .trim()
    .optional(),
  password: passwordSchema.optional(),
  role: z.enum(['user', 'admin', 'moderator']).optional(),
});

/**
 * User ID parameter validation
 */
export const userIdSchema = z.object({
  id: z.string().transform(Number).pipe(z.number().int().positive()),
});
