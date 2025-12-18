import { Router } from 'express';
import {
  create,
  getAll,
  getById,
  update,
  remove,
} from '#controllers/user.controller';
import { authenticate } from '#middleware/auth.middleware';
import { requireAdmin } from '#middleware/admin.middleware';
import { validate } from '#middleware/validation.middleware';
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
} from '#validations/user.validation';
import { z } from 'zod';

const router = Router();

// All user routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   POST /api/v1/users
 * @desc    Create a new user
 * @access  Admin
 */
router.post('/', validate(createUserSchema), create);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users with pagination
 * @access  Admin
 */
router.get(
  '/',
  validate({
    query: z.object({
      page: z
        .string()
        .transform(Number)
        .pipe(z.number().int().positive())
        .optional(),
      limit: z
        .string()
        .transform(Number)
        .pipe(z.number().int().positive())
        .optional(),
    }),
  }),
  getAll
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Admin
 */
router.get('/:id', validate({ params: userIdSchema }), getById);

/**
 * @route   PATCH /api/v1/users/:id
 * @desc    Update user
 * @access  Admin
 */
router.patch(
  '/:id',
  validate({ params: userIdSchema, body: updateUserSchema }),
  update
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user (alternative to PATCH)
 * @access  Admin
 */
router.put(
  '/:id',
  validate({ params: userIdSchema, body: updateUserSchema }),
  update
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user
 * @access  Admin
 */
router.delete('/:id', validate({ params: userIdSchema }), remove);

export default router;
