# Express Backend Template

A production-ready Express.js backend template with TypeScript, featuring authentication, validation, error handling, and comprehensive security measures.

## Features

- ✅ **TypeScript** - Full type safety
- ✅ **Express.js** - Fast, unopinionated web framework
- ✅ **Drizzle ORM** - Type-safe SQL ORM
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Zod Validation** - Runtime type validation
- ✅ **Winston Logging** - Structured logging
- ✅ **Error Handling** - Centralized error management
- ✅ **Security** - Helmet, CORS, rate limiting
- ✅ **Environment Validation** - Type-safe env variables
- ✅ **Request ID Tracking** - Request tracing
- ✅ **Graceful Shutdown** - Clean server termination
- ✅ **Comprehensive Tests** - Jest test suite

## Project Structure

```
src/
├── config/          # Configuration files
│   ├── database.ts  # Database connection
│   ├── env.ts       # Environment validation
│   ├── logger.ts    # Winston logger setup
│   └── arcjet.ts    # Security configuration
├── constants/        # Application constants
│   ├── httpStatus.ts # HTTP status codes
│   └── tokens.ts     # Token constants
├── controllers/      # Route controllers
│   ├── auth.controller.ts
│   └── user.controller.ts
├── middleware/       # Express middleware
│   ├── admin.middleware.ts        # Admin role check
│   ├── auth.middleware.ts         # Authentication
│   ├── error.middleware.ts        # Error handling
│   ├── rateLimit.middleware.ts    # Rate limiting
│   ├── requestId.middleware.ts    # Request ID
│   └── validation.middleware.ts    # Request validation
├── models/          # Database schemas
│   └── schema.ts
├── routes/          # Route definitions
│   ├── auth.routes.ts
│   └── user.routes.ts
├── services/        # Business logic
│   ├── auth.service.ts
│   └── user.service.ts
├── types/           # TypeScript types
│   ├── index.ts
│   ├── express.d.ts
│   ├── middleware.types.ts
│   ├── token.types.ts
│   ├── user.types.ts
│   └── utils.types.ts
├── utils/           # Utility functions
│   ├── AppError.ts
│   ├── catchAsync.ts
│   ├── cookies.ts
│   ├── hash.ts
│   ├── jwt.ts
│   ├── pagination.ts
│   └── transactions.ts
├── validations/     # Zod schemas
│   ├── auth.validation.ts
│   └── user.validation.ts
└── tests/           # Test files
    └── auth.test.ts
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or compatible database)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
```

### Environment Variables

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key-min-32-chars-required
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars-optional
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000
ARCJET_KEY=your-arcjet-key-optional
```

**Note:** All environment variables are validated at startup. See `docs/ENVIRONMENT_VARIABLES.md` for details.

### Database Setup

```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio
npm run db:studio
```

### Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## API Endpoints

All API endpoints are versioned with `/api/v1/` prefix.

### Authentication

#### POST `/api/v1/auth/signup`

Register a new user.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**

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

#### POST `/api/v1/auth/login`

Login user.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**

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
    "access_token": "eyJhbGc..."
  }
}
```

#### POST `/api/v1/auth/refresh`

Refresh access token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGc..."
  }
}
```

#### POST `/api/v1/auth/logout`

Logout user (requires authentication).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

### Users (Admin Only)

All user endpoints require admin role.

#### POST `/api/v1/users`

Create a new user.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass123",
  "role": "user"
}
```

#### GET `/api/v1/users?page=1&limit=10`

Get all users with pagination.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### GET `/api/v1/users/:id`

Get user by ID.

**Headers:**

```
Authorization: Bearer <access_token>
```

#### PATCH `/api/v1/users/:id`

Update user.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "admin"
}
```

#### DELETE `/api/v1/users/:id`

Delete user.

**Headers:**

```
Authorization: Bearer <access_token>
```

### Health Check

#### GET `/health`

Check server health.

**Response:**

```json
{
  "status": 200,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345,
  "message": "Server is healthy"
}
```

## Security Features

- **Helmet** - Security headers with CSP configuration
- **CORS** - Configurable cross-origin resource sharing
- **Rate Limiting** - In-memory rate limiting to prevent abuse
- **JWT Tokens** - Secure token-based authentication
- **Password Hashing** - bcrypt with salt rounds
- **Input Validation** - Comprehensive Zod schemas
- **Environment Validation** - Type-safe config with validation
- **Request ID** - Request tracing for debugging
- **Compression** - Response compression for bandwidth optimization
- **Admin Middleware** - Role-based access control

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## Best Practices

1. **Error Handling** - All errors go through centralized error handler
2. **Validation** - All inputs validated with Zod
3. **Logging** - Structured logging with Winston
4. **Type Safety** - Full TypeScript coverage
5. **Security** - Multiple layers of security
6. **Testing** - Comprehensive test coverage
7. **Documentation** - Well-documented code

