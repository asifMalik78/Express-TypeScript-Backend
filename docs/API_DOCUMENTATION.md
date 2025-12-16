# API Documentation

## Base URL

All API endpoints are versioned and prefixed with `/api/v1/`.

```
Base URL: http://localhost:3000/api/v1
```

## Authentication

Most endpoints require authentication using JWT Bearer tokens. Include the token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "status": "success",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "status": "fail" | "error",
  "message": "Error message",
  "errors": [], // Validation errors (if applicable)
  "requestId": "uuid" // Request tracking ID
}
```

## Authentication Endpoints

### POST `/api/v1/auth/signup`

Register a new user account.

**Access:** Public

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Validation:**

- `name`: 2-255 characters
- `email`: Valid email address, max 255 characters
- `password`: Min 8 characters, must contain uppercase, lowercase, and number

**Response:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

**Cookies Set:**

- `access_token` - HttpOnly, Secure (production)
- `refresh_token` - HttpOnly, Secure (production)

---

### POST `/api/v1/auth/login`

Login with email and password.

**Access:** Public

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Cookies Set:**

- `access_token` - HttpOnly, Secure (production)
- `refresh_token` - HttpOnly, Secure (production)

---

### POST `/api/v1/auth/refresh`

Refresh access token using refresh token.

**Access:** Public

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Or via Cookie:**

- `refresh_token` cookie (automatically read)

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Note:** Old refresh token is revoked and a new one is issued (token rotation).

---

### POST `/api/v1/auth/logout`

Logout user and revoke refresh token.

**Access:** Private (requires authentication)

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

**Cookies Cleared:**

- `access_token`
- `refresh_token`

---

## User Management Endpoints (Admin Only)

All user management endpoints require:

1. Valid JWT access token
2. User role must be `admin`

### POST `/api/v1/users`

Create a new user.

**Access:** Admin

**Request Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass123",
  "role": "user"
}
```

**Validation:**

- `name`: 2-255 characters
- `email`: Valid email, unique
- `password`: Min 8 characters, uppercase, lowercase, number
- `role`: `user`, `admin`, or `moderator` (default: `user`)

**Response:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 2,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user"
    }
  }
}
```

---

### GET `/api/v1/users`

Get all users with pagination.

**Access:** Admin

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Example:** `/api/v1/users?page=1&limit=10`

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    {
      "id": 2,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "admin"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### GET `/api/v1/users/:id`

Get user by ID.

**Access:** Admin

**Path Parameters:**

- `id`: User ID (integer)

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

**Error:** `404 Not Found` if user doesn't exist

---

### PATCH `/api/v1/users/:id`

Update user (partial update).

**Access:** Admin

**Path Parameters:**

- `id`: User ID (integer)

**Request Body:** (all fields optional)

```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "password": "NewSecurePass123",
  "role": "admin"
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "name": "Updated Name",
      "email": "updated@example.com",
      "role": "admin"
    }
  }
}
```

---

### PUT `/api/v1/users/:id`

Update user (alternative to PATCH, same behavior).

**Access:** Admin

---

### DELETE `/api/v1/users/:id`

Delete user.

**Access:** Admin

**Path Parameters:**

- `id`: User ID (integer)

**Response:** `204 No Content`

**Error:** `404 Not Found` if user doesn't exist

---

## Health Check

### GET `/health`

Check server health and status.

**Access:** Public

**Response:** `200 OK`

```json
{
  "status": 200,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345.67,
  "message": "Server is healthy"
}
```

---

## Error Codes

| Status Code | Description                                                |
| ----------- | ---------------------------------------------------------- |
| `200`       | OK - Request successful                                    |
| `201`       | Created - Resource created successfully                    |
| `204`       | No Content - Request successful, no content to return      |
| `400`       | Bad Request - Validation error or invalid input            |
| `401`       | Unauthorized - Authentication required or invalid token    |
| `403`       | Forbidden - Insufficient permissions (e.g., not admin)     |
| `404`       | Not Found - Resource not found                             |
| `409`       | Conflict - Resource already exists (e.g., duplicate email) |
| `429`       | Too Many Requests - Rate limit exceeded                    |
| `500`       | Internal Server Error - Server error                       |

---

## Rate Limiting

Authentication endpoints have rate limiting:

- **Window:** 15 minutes
- **Max Requests:** 5 requests per window
- **Headers:** Rate limit info in response headers:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

---

## Request ID

All requests receive a unique request ID:

- **Header:** `X-Request-ID` in response
- **Purpose:** Request tracing and debugging
- **Format:** UUID v4

---

## Compression

All responses are automatically compressed using gzip/deflate when supported by the client.

---

## Token Expiration

- **Access Token:** 15 minutes (configurable via `JWT_EXPIRES_IN`)
- **Refresh Token:** 7 days (configurable via `JWT_REFRESH_EXPIRES_IN`)

---

## Pagination

List endpoints support pagination:

- **Default:** `page=1`, `limit=10`
- **Maximum:** `limit=100`
- **Response includes:** Total count, total pages, has next/prev
