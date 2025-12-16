# Environment Variables Documentation

## Overview

This document lists all environment variables used in the backend application. All environment variables are validated at startup using Zod schema validation in `src/config/env.ts`. Invalid or missing required variables will cause the application to exit with clear error messages.

## Quick Setup

```bash
# Copy the example file to create your .env file
cp .env.example .env

# Then edit .env with your actual values
```

## Environment Variables Reference

### Server Configuration

| Variable   | Required | Default       | Description                                            |
| ---------- | -------- | ------------- | ------------------------------------------------------ |
| `PORT`     | No       | `3000`        | Port number for the server to listen on                |
| `NODE_ENV` | No       | `development` | Node environment (`development`, `production`, `test`) |

### Database Configuration

| Variable       | Required | Default | Description                                                                            |
| -------------- | -------- | ------- | -------------------------------------------------------------------------------------- |
| `DATABASE_URL` | **Yes**  | -       | PostgreSQL connection URL. Format: `postgresql://username:password@host:port/database` |

### JWT Configuration

| Variable                 | Required | Default           | Description                                                                               |
| ------------------------ | -------- | ----------------- | ----------------------------------------------------------------------------------------- |
| `JWT_SECRET`             | **Yes**  | -                 | Secret key for signing JWT access tokens. **Must be at least 32 characters**              |
| `JWT_REFRESH_SECRET`     | No       | Uses `JWT_SECRET` | Secret key for signing JWT refresh tokens. **Must be at least 32 characters if provided** |
| `JWT_EXPIRES_IN`         | No       | `15m`             | Access token expiration time. Examples: `15m`, `1h`, `1d`                                 |
| `JWT_REFRESH_EXPIRES_IN` | No       | `7d`              | Refresh token expiration time. Examples: `7d`, `30d`                                      |

### Security Configuration

| Variable      | Required | Default | Description                                                                                      |
| ------------- | -------- | ------- | ------------------------------------------------------------------------------------------------ |
| `ARCJET_KEY`  | No       | -       | Arcjet API key for rate limiting and security. Get from [app.arcjet.com](https://app.arcjet.com) |
| `CORS_ORIGIN` | No       | `*`     | CORS allowed origin. Use specific domain in production (e.g., `https://example.com`)             |

### Logging Configuration

| Variable    | Required | Default | Description                                              |
| ----------- | -------- | ------- | -------------------------------------------------------- |
| `LOG_LEVEL` | No       | `info`  | Logging level. Options: `error`, `warn`, `info`, `debug` |

## Environment Variable Validation

All environment variables are validated at application startup using `src/config/env.ts`. The validation:

- **Validates types** - Ensures correct data types (string, number, enum)
- **Checks required fields** - Ensures all required variables are present
- **Validates formats** - Checks URL format for `DATABASE_URL`, email patterns, etc.
- **Enforces constraints** - JWT secrets must be at least 32 characters
- **Provides defaults** - Sets sensible defaults for optional variables
- **Clear error messages** - Shows exactly which variables are invalid and why

### Validation Errors

If validation fails, the application will:

1. Display all validation errors
2. Exit with code 1
3. Prevent the server from starting

Example error output:

```
❌ Invalid environment variables:
  - JWT_SECRET: JWT_SECRET must be at least 32 characters
  - DATABASE_URL: Invalid DATABASE_URL
```

## Files Using Environment Variables

### `src/config/env.ts`

- **Central validation** - All environment variables validated here
- Exports validated `env` object for use throughout the application

### `src/server.ts`

- `env.PORT` - Server port
- `env.NODE_ENV` - Environment detection

### `src/config/database.ts`

- `env.DATABASE_URL` - Database connection
- `env.NODE_ENV` - Environment detection for Neon config

### `src/utils/jwt.ts`

- `env.JWT_SECRET` - Access token signing
- `env.JWT_REFRESH_SECRET` - Refresh token signing
- `env.JWT_EXPIRES_IN` - Access token expiration
- `env.JWT_REFRESH_EXPIRES_IN` - Refresh token expiration

### `src/config/arcjet.ts`

- `env.ARCJET_KEY` - Security and rate limiting (optional)

### `src/config/logger.ts`

- `env.LOG_LEVEL` - Logging verbosity
- `env.NODE_ENV` - Console logging in development

### `src/app.ts`

- `env.NODE_ENV` - Morgan logging format
- `process.env.CORS_ORIGIN` - CORS configuration

### `src/utils/cookies.ts`

- `process.env.NODE_ENV` - Secure cookie flag in production

### `drizzle.config.ts`

- `process.env.DATABASE_URL` - Database migrations

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use strong secrets** - Generate random strings for JWT secrets:
   ```bash
   # Generate a secure random string (macOS/Linux)
   openssl rand -base64 32
   ```
3. **Different secrets** - Use different values for `JWT_SECRET` and `JWT_REFRESH_SECRET`
4. **Production values** - Use different values in production vs development
5. **Rotate secrets** - Periodically change your JWT secrets
6. **Secure storage** - Use secret management tools in production (AWS Secrets Manager, HashiCorp Vault, etc.)

## Example Production Values

```bash
# Production example (DO NOT use these exact values!)
PORT=8080
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:strong_password@db.example.com:5432/prod_db
JWT_SECRET=8f3b2c1a9d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1
JWT_REFRESH_SECRET=1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ARCJET_KEY=ajkey_live_xxxxxxxxxxxxxxxxxxxxx
LOG_LEVEL=warn
```

## Troubleshooting

### Missing Environment Variable Errors

If you see errors like:

- `DATABASE_URL is missing` - Add `DATABASE_URL` to your `.env` file
- `JWT_SECRET is undefined` - Add `JWT_SECRET` to your `.env` file
- `ARCJET_KEY is missing` - Add `ARCJET_KEY` to your `.env` file

### Loading Environment Variables

The application uses `dotenv` to load environment variables. Make sure:

1. Your `.env` file is in the root of the backend directory
2. The file is named exactly `.env` (not `.env.txt` or similar)
3. Variables are in the format `KEY=value` (no spaces around `=`)
4. No quotes needed unless the value contains spaces

## Docker Configuration

When using Docker, you can:

1. Use `.env` file with `docker-compose.yml`:

   ```yaml
   services:
     backend:
       env_file:
         - .env
   ```

2. Or pass environment variables directly:

   ```yaml
   services:
     backend:
       environment:
         - PORT=3000
         - NODE_ENV=production
   ```

3. Or use Docker secrets for sensitive data in production
