/**
 * User-related types and interfaces
 */

// Auth response with tokens
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserResponse;
}

// Authenticated user payload (used in JWT and req.user)
export interface AuthUser {
  email?: string;
  id: number;
  role?: string;
}

// Create user input (Admin only)
export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: 'admin' | 'moderator' | 'user';
}

// User login input
export interface LoginInput {
  email: string;
  password: string;
}

// Refresh token response
export interface RefreshTokenResponse {
  access_token: string;
}

// User registration input
export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

// Update user input (Admin only)
export interface UpdateUserInput {
  email?: string;
  name?: string;
  password?: string;
  role?: 'admin' | 'moderator' | 'user';
}

// User from database (full user object)
export interface User {
  createdAt: Date | null;
  email: string;
  id: number;
  name: string;
  password: string;
  role: string;
  updatedAt: Date | null;
}

// User response (without sensitive data)
export interface UserResponse {
  email: string;
  id: number;
  name: string;
  role: string;
}

// User role types
export type UserRole = 'admin' | 'moderator' | 'user';
