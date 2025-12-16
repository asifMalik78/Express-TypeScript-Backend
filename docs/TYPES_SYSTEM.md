# Centralized Types and Interfaces

## Overview

This document describes the centralized type system implemented in the backend application to maintain consistency and type safety across the codebase.

## Directory Structure

```
src/types/
├── index.ts           # Central export for all types
├── express.d.ts       # Express type extensions
├── user.types.ts      # User-related types and interfaces
├── token.types.ts     # Token-related types and interfaces
├── middleware.types.ts # Middleware-related types
└── utils.types.ts     # Utility-related types
```

## Files

### 1. **`user.types.ts`**

Contains all user-related types and interfaces:

#### Types

- **`UserRole`**: Union type for user roles (`'user' | 'admin' | 'moderator'`)

#### Interfaces

- **`AuthUser`**: Authenticated user payload (used in JWT and `req.user`)

  ```typescript
  {
    id: number;
    email: string;
    role: string;
  }
  ```

- **`User`**: Full user object from database

  ```typescript
  {
    id: number;
    name: string;
    email: string;
    password: string;
    role: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  }
  ```

- **`UserResponse`**: User data for API responses (without sensitive data)

  ```typescript
  {
    id: number;
    name: string;
    email: string;
    role: string;
  }
  ```

- **`RegisterInput`**: User registration input

  ```typescript
  {
    name: string;
    email: string;
    password: string;
  }
  ```

- **`LoginInput`**: User login input

  ```typescript
  {
    email: string;
    password: string;
  }
  ```

- **`AuthResponse`**: Authentication response with tokens

  ```typescript
  {
    access_token: string;
    refresh_token: string;
    user: UserResponse;
  }
  ```

- **`RefreshTokenResponse`**: Refresh token response

  ```typescript
  {
    access_token: string;
    refresh_token: string;
  }
  ```

- **`CreateUserInput`**: Create user input (Admin only)

  ```typescript
  {
    name: string;
    email: string;
    password: string;
    role?: 'user' | 'admin' | 'moderator';
  }
  ```

- **`UpdateUserInput`**: Update user input (Admin only)
  ```typescript
  {
    name?: string;
    email?: string;
    password?: string;
    role?: 'user' | 'admin' | 'moderator';
  }
  ```

### 2. **`token.types.ts`**

Contains token-related types and interfaces:

- **`JwtTokenPayload`**: JWT token payload structure

  ```typescript
  {
    userId: number;
    iat?: number;
    exp?: number;
  }
  ```

- **`AccessTokenPayload`**: Access token payload
- **`RefreshTokenPayload`**: Refresh token payload
- **`TokenPair`**: Token pair response structure
- **`TokenVerificationResult`**: Token verification result
- **`TokenExpirationConfig`**: Token expiration configuration

### 3. **`middleware.types.ts`**

Contains middleware-related types:

- **`RateLimitOptions`**: Rate limiting configuration options
- **`RateLimitEntry`**: Rate limit store entry
- **`RateLimitStore`**: Rate limit store structure
- **`ValidationSchemas`**: Validation schemas for request validation middleware

### 4. **`utils.types.ts`**

Contains utility-related types:

- **`PaginationOptions`**: Pagination configuration
- **`PaginationResult<T>`**: Pagination result with metadata

### 5. **`express.d.ts`**

Extends Express types to include custom properties:

- Adds `user?: AuthUser` to `Express.Request` interface
- Adds `id?: string` to `Express.Request` interface (request ID)

### 6. **`index.ts`**

Central export file for all types - allows importing from a single location:

```typescript
import {
  AuthUser,
  UserResponse,
  LoginInput,
  JwtTokenPayload,
  RateLimitOptions,
  PaginationOptions,
} from '../types';
```

## Usage Examples

### In Controllers

```typescript
import { Request, Response } from 'express';
import { LoginInput, AuthResponse } from '../types';

export const login = async (req: Request, res: Response) => {
  const credentials: LoginInput = req.body;
  const result: AuthResponse = await loginService(credentials);
  return res.json(result);
};
```

### In Services

```typescript
import { RegisterInput, AuthResponse } from '../types';

export const register = async (input: RegisterInput): Promise<AuthResponse> => {
  // Implementation
};
```

### In Middleware

```typescript
import { Request, Response, NextFunction } from 'express';
// req.user is automatically typed as AuthUser | undefined

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // req.user is typed correctly
  if (req.user) {
    console.log(req.user.id, req.user.email, req.user.role);
  }
};
```

### In Utils

```typescript
import { JwtPayload } from '../types';

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
```

## Benefits

1. **Type Safety**: Catch type errors at compile time
2. **Consistency**: Same types used across the entire application
3. **Maintainability**: Update types in one place
4. **Autocomplete**: Better IDE support and autocomplete
5. **Documentation**: Types serve as inline documentation
6. **Refactoring**: Easier to refactor with confidence
7. **No Duplication**: Avoid declaring the same types in multiple files

## Files Updated

The following files were updated to use centralized types:

1. **`src/middleware/auth.middleware.ts`**
   - Removed inline `declare global` for Express Request
   - Imported `JwtPayload` from types

2. **`src/services/auth.service.ts`**
   - Replaced `any` types with proper interfaces
   - Added return type annotations
   - Imported `RegisterInput`, `LoginInput`, `AuthResponse`, `RefreshTokenResponse`

3. **`src/utils/jwt.ts`**
   - Replaced `any` types with `{ userId: number }`
   - Added return type annotations
   - Imported `JwtPayload` from types

## Best Practices

1. **Always use types**: Never use `any` when a proper type exists
2. **Import from index**: Use `import { Type } from '../types'` instead of specific files
3. **Add new types**: When creating new features, add types to the appropriate file
4. **Keep types organized**: Group related types in the same file
5. **Document complex types**: Add JSDoc comments for complex interfaces
6. **Use strict types**: Enable strict TypeScript options in `tsconfig.json`

## Type Organization Benefits

1. **Separation of Concerns** - Types organized by domain/functionality
2. **Easy Discovery** - Clear file names indicate what types are inside
3. **Scalability** - Easy to add new type files as the application grows
4. **Maintainability** - Related types grouped together
5. **Reusability** - Types can be imported from central location

## Future Enhancements

Consider adding these type files as the application grows:

- `product.types.ts` - Product-related types
- `order.types.ts` - Order-related types
- `api.types.ts` - Generic API response types
- `error.types.ts` - Error-related types
- `database.types.ts` - Database-related types
