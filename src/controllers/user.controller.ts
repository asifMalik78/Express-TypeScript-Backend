import logger from '../config/logger';
import { HTTP_STATUS } from '../constants/httpStatus';
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
} from '../services/user.service';
import { catchAsync } from '../utils/catchAsync';
import { Request, Response } from 'express';

/**
 * Create a new user (Admin only)
 */
export const create = catchAsync(async (req: Request, res: Response) => {
  const { email, name, password, role } = req.body as {
    email: string;
    name: string;
    password: string;
    role?: string;
  };
  const user = await createUser({ email, name, password, role });

  logger.info('User created', { createdBy: req.user?.id, userId: user.id });

  return res.status(HTTP_STATUS.CREATED).json({
    data: {
      user,
    },
    status: 'success',
  });
});

/**
 * Get all users with pagination (Admin only)
 */
export const getAll = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;

  const result = await getAllUsers({ limit, page });

  return res.status(HTTP_STATUS.OK).json({
    data: result.data,
    pagination: result.pagination,
    status: 'success',
  });
});

/**
 * Get user by ID (Admin only)
 */
export const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await getUserById(Number(id));

  return res.status(HTTP_STATUS.OK).json({
    data: {
      user,
    },
    status: 'success',
  });
});

/**
 * Update user (Admin only)
 */
export const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, name, password, role } = req.body as {
    email?: string;
    name?: string;
    password?: string;
    role?: string;
  };

  const user = await updateUser(Number(id), {
    email,
    name,
    password,
    role,
  });

  logger.info('User updated', {
    updatedBy: req.user?.id,
    userId: user.id,
  });

  return res.status(HTTP_STATUS.OK).json({
    data: {
      user,
    },
    status: 'success',
  });
});

/**
 * Delete user (Admin only)
 */
export const remove = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await deleteUser(Number(id));

  logger.info('User deleted', {
    deletedBy: req.user?.id,
    userId: Number(id),
  });

  return res.status(HTTP_STATUS.NO_CONTENT).send();
});
