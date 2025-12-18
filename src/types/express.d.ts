/**
 * Global type declarations and Express extensions
 */

import { AuthUser } from '#types/user.types';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
