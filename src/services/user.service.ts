import { db } from '../config/database';
import logger from '../config/logger';
import { HTTP_STATUS } from '../constants/httpStatus';
import { users } from '../models/schema';
import { UserResponse } from '../types/user.types';
import { PaginationOptions, PaginationResult } from '../types/utils.types';
import { AppError } from '../utils/AppError';
import { hashPassword } from '../utils/hash';
import {
  getOffset,
  getPaginationMeta,
  normalizePagination,
} from '../utils/pagination';
import { eq } from 'drizzle-orm';

/**
 * Create a new user (Admin only)
 */
export const createUser = async (data: {
  email: string;
  name: string;
  password: string;
  role?: string;
}): Promise<UserResponse> => {
  // Check if user already exists
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existingUsers.length > 0) {
    logger.warn('User creation attempt with existing email', {
      email: data.email,
    });
    throw new AppError(
      'User with this email already exists',
      HTTP_STATUS.CONFLICT
    );
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      email: data.email,
      name: data.name,
      password: hashedPassword,
      role: data.role ?? 'user',
    })
    .returning();

  logger.info('User created by admin', {
    email: newUser.email,
    role: newUser.role,
    userId: newUser.id,
  });

  return {
    email: newUser.email,
    id: newUser.id,
    name: newUser.name,
    role: newUser.role ?? 'user',
  };
};

/**
 * Get all users with pagination (Admin only)
 */
export const getAllUsers = async (
  options: PaginationOptions
): Promise<PaginationResult<UserResponse>> => {
  const { limit, page } = normalizePagination(options);
  const offset = getOffset(page, limit);

  // Get total count
  const allUsers = await db.select().from(users);
  const total = allUsers.length;

  // Get paginated users
  const userList = await db
    .select({
      email: users.email,
      id: users.id,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .limit(limit)
    .offset(offset);

  return {
    data: userList.map((user: (typeof userList)[number]) => ({
      email: user.email,
      id: user.id,
      name: user.name,
      role: user.role ?? 'user',
    })),
    pagination: getPaginationMeta(page, limit, total),
  };
};

/**
 * Get user by ID (Admin only)
 */
export const getUserById = async (userId: number): Promise<UserResponse> => {
  const [user] = await db
    .select({
      email: users.email,
      id: users.id,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // User will always exist if query returns a result
  // This check is for type safety

  return {
    email: user.email,
    id: user.id,
    name: user.name,
    role: user.role ?? 'user',
  };
};

/**
 * Update user (Admin only)
 */
export const updateUser = async (
  userId: number,
  data: {
    email?: string;
    name?: string;
    password?: string;
    role?: string;
  }
): Promise<UserResponse> => {
  // Check if user exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // existingUser will always exist if query returns a result
  // This check is for type safety

  // Check if email is being changed and if it's already taken
  if (data.email && data.email !== existingUser.email) {
    const emailTakenUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (emailTakenUsers.length > 0) {
      throw new AppError('Email already in use', HTTP_STATUS.CONFLICT);
    }
  }

  // Prepare update data
  const updateData: {
    email?: string;
    name?: string;
    password?: string;
    role?: string;
    updatedAt?: Date;
  } = {
    updatedAt: new Date(),
  };

  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;
  if (data.role) updateData.role = data.role;

  // Hash password if provided
  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }

  // Update user
  const [updatedUser] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .returning();

  logger.info('User updated by admin', {
    updatedFields: Object.keys(updateData),
    userId: updatedUser.id,
  });

  return {
    email: updatedUser.email,
    id: updatedUser.id,
    name: updatedUser.name,
    role: updatedUser.role ?? 'user',
  };
};

/**
 * Delete user (Admin only)
 */
export const deleteUser = async (userId: number): Promise<void> => {
  // Check if user exists
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // User will always exist if query returns a result
  // This check is for type safety

  // Delete user
  await db.delete(users).where(eq(users.id, userId));

  logger.info('User deleted by admin', {
    email: user.email,
    userId,
  });
};
