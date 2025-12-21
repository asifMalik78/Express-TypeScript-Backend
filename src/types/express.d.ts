/**
 * Global type declarations and Express extensions
 */

import { AuthUser } from './user.types';

// Extend Express Request interface to include user and validated data
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      validatedQuery?: Record<string, unknown>;
      validatedParams?: Record<string, unknown>;
      refreshToken?: string;
    }
  }
}

export {};
