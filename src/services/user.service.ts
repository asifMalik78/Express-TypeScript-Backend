import { db } from '#config/database';
import { users } from '#models/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '#utils/hash';
import { AppError } from '#utils/AppError';
import { HTTP_STATUS } from '#constants/httpStatus';
import logger from '#config/logger';
import { UserResponse } from '#types/user.types';
import { PaginationOptions, PaginationResult } from '#types/utils.types';
import {
  normalizePagination,
  getPaginationMeta,
  getOffset,
} from '#utils/pagination';

/**
 * Create a new user (Admin only)
 */
export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
  role?: string;
}): Promise<UserResponse> => {
  // Check if user already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existingUser) {
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
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || 'user',
    })
    .returning();

  logger.info('User created by admin', {
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
  });

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role ?? 'user',
  };
};

/**
 * Get all users with pagination (Admin only)
 */
export const getAllUsers = async (
  options: PaginationOptions
): Promise<PaginationResult<UserResponse>> => {
  const { page, limit } = normalizePagination(options);
  const offset = getOffset(page, limit);

  // Get total count
  const allUsers = await db.select().from(users);
  const total = allUsers.length;

  // Get paginated users
  const userList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .limit(limit)
    .offset(offset);

  return {
    data: userList.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
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
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role ?? 'user',
  };
};

/**
 * Update user (Admin only)
 */
export const updateUser = async (
  userId: number,
  data: {
    name?: string;
    email?: string;
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

  if (!existingUser) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  // Check if email is being changed and if it's already taken
  if (data.email && data.email !== existingUser.email) {
    const [emailTaken] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (emailTaken) {
      throw new AppError('Email already in use', HTTP_STATUS.CONFLICT);
    }
  }

  // Prepare update data
  const updateData: {
    name?: string;
    email?: string;
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
    userId: updatedUser.id,
    updatedFields: Object.keys(updateData),
  });

  return {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
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

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  // Delete user
  await db.delete(users).where(eq(users.id, userId));

  logger.info('User deleted by admin', {
    userId,
    email: user.email,
  });
};
