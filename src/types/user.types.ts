/**
 * User-related types and interfaces
 */

// User role types
export type UserRole = 'user' | 'admin' | 'moderator';

// Authenticated user payload (used in JWT and req.user)
export interface AuthUser {
  id: number;
  email?: string;
  role?: string;
}

// User from database (full user object)
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// User response (without sensitive data)
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: string;
}

// User registration input
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

// User login input
export interface LoginInput {
  email: string;
  password: string;
}

// Auth response with tokens
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserResponse;
}

// Refresh token response
export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

// Create user input (Admin only)
export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin' | 'moderator';
}

// Update user input (Admin only)
export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: 'user' | 'admin' | 'moderator';
}
