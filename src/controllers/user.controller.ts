import { Request, Response, NextFunction } from 'express';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../services/user.service';
import { catchAsync } from '../utils/catchAsync';
import { HTTP_STATUS } from '../constants/httpStatus';
import logger from '../config/logger';

/**
 * Create a new user (Admin only)
 */
export const create = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { name, email, password, role } = req.body;
    const user = await createUser({ name, email, password, role });

    logger.info('User created', { userId: user.id, createdBy: req.user?.id });

    return res.status(HTTP_STATUS.CREATED).json({
      status: 'success',
      data: {
        user,
      },
    });
  }
);

/**
 * Get all users with pagination (Admin only)
 */
export const getAll = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const result = await getAllUsers({ page, limit });

    return res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: result.data,
      pagination: result.pagination,
    });
  }
);

/**
 * Get user by ID (Admin only)
 */
export const getById = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const user = await getUserById(Number(id));

    return res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: {
        user,
      },
    });
  }
);

/**
 * Update user (Admin only)
 */
export const update = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    const user = await updateUser(Number(id), {
      name,
      email,
      password,
      role,
    });

    logger.info('User updated', {
      userId: user.id,
      updatedBy: req.user?.id,
    });

    return res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: {
        user,
      },
    });
  }
);

/**
 * Delete user (Admin only)
 */
export const remove = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    await deleteUser(Number(id));

    logger.info('User deleted', {
      userId: Number(id),
      deletedBy: req.user?.id,
    });

    return res.status(HTTP_STATUS.NO_CONTENT).send();
  }
);
