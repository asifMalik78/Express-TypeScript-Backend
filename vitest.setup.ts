// Vitest setup file - runs before all tests
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.development first (for test database), fallback to .env
const rootDir = resolve(process.cwd());
const devEnvPath = resolve(rootDir, '.env.development');
const baseEnvPath = resolve(rootDir, '.env');

// Try .env.development first, then .env
let envResult = config({ path: devEnvPath });
if (envResult.error) {
  config({ path: baseEnvPath });
}

process.env.NODE_ENV = 'test';
process.env.PORT = '3000';

process.env.JWT_SECRET =
  process.env.JWT_SECRET ??
  'test-jwt-secret-that-is-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ??
  'test-refresh-secret-that-is-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '15m';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'error';
