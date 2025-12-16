# HTTP Status Constants Implementation

## Overview

Created a centralized HTTP status constants file to maintain consistency across the application and improve code readability.

## Files Created

- **`src/constants/httpStatus.ts`**: Central location for all HTTP status code constants

## Files Updated

The following files were updated to use `HTTP_STATUS` constants instead of hardcoded numbers:

### 1. **Controllers**

- `src/controllers/auth.controller.ts`
  - `400` → `HTTP_STATUS.BAD_REQUEST`
  - `201` → `HTTP_STATUS.CREATED`
  - `200` → `HTTP_STATUS.OK`

### 2. **Services**

- `src/services/auth.service.ts`
  - `400` → `HTTP_STATUS.BAD_REQUEST`
  - `401` → `HTTP_STATUS.UNAUTHORIZED`

### 3. **Middleware**

- `src/middleware/error.middleware.ts`
  - `400` → `HTTP_STATUS.BAD_REQUEST`
  - `500` → `HTTP_STATUS.INTERNAL_SERVER_ERROR`

- `src/middleware/auth.middleware.ts`
  - `401` → `HTTP_STATUS.UNAUTHORIZED` (5 occurrences)

### 4. **Application**

- `src/app.ts`
  - `200` → `HTTP_STATUS.OK`
  - `404` → `HTTP_STATUS.NOT_FOUND`

## Benefits

1. **Consistency**: All HTTP status codes are now centralized and consistent
2. **Readability**: Code is more self-documenting (e.g., `HTTP_STATUS.UNAUTHORIZED` vs `401`)
3. **Maintainability**: Easy to update or add new status codes in one place
4. **Type Safety**: TypeScript can provide better autocomplete and type checking
5. **Reduced Errors**: No more typos in status codes

## Available Status Codes

The `HTTP_STATUS` constant includes:

- **2xx Success**: OK (200), CREATED (201), ACCEPTED (202), NO_CONTENT (204)
- **3xx Redirection**: MOVED_PERMANENTLY (301), FOUND (302), NOT_MODIFIED (304)
- **4xx Client Errors**: BAD_REQUEST (400), UNAUTHORIZED (401), FORBIDDEN (403), NOT_FOUND (404), METHOD_NOT_ALLOWED (405), CONFLICT (409), UNPROCESSABLE_ENTITY (422), TOO_MANY_REQUESTS (429)
- **5xx Server Errors**: INTERNAL_SERVER_ERROR (500), NOT_IMPLEMENTED (501), BAD_GATEWAY (502), SERVICE_UNAVAILABLE (503), GATEWAY_TIMEOUT (504)

## Usage Example

```typescript
import { HTTP_STATUS } from '../constants/httpStatus';

// Instead of:
throw new AppError('User not found', 404);
res.status(200).json({ data });

// Use:
throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
res.status(HTTP_STATUS.OK).json({ data });
```
