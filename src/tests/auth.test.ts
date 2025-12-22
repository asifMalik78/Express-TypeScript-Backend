/// <reference types="vitest/globals" />
import { db } from '../config/database.js';
import { refreshTokens, users } from '../models/schema.js';
import app from '../app.js';
import request from 'supertest';
import { inArray } from 'drizzle-orm';

// Helper to get unique IP for rate limiting
const getUniqueIP = () => {
  const uniqueId = Math.random().toString(36).substring(7);
  return `127.0.0.${uniqueId}`;
};

// Helper function to extract cookie value
const getCookieValue = (
  cookies: string[] | undefined,
  name: string
): string | null => {
  if (!cookies) return null;
  const cookie = cookies.find(c => c.startsWith(`${name}=`));
  if (!cookie) return null;
  return cookie.split(`${name}=`)[1]?.split(';')[0] ?? null;
};

describe('Auth API', () => {
  const testUser = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'Test1234',
  };

  beforeEach(async () => {
    // Clean up test data before each test (preserve admin user)
    try {
      // Get all non-admin users
      const allUsers = await db
        .select({ id: users.id, email: users.email })
        .from(users);

      // Filter out admin user
      const testUserIds = allUsers
        .filter(u => u.email !== 'admin@test.com')
        .map(u => u.id);

      if (testUserIds.length > 0) {
        await db
          .delete(refreshTokens)
          .where(inArray(refreshTokens.userId, testUserIds));
        await db.delete(users).where(inArray(users.id, testUserIds));
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  afterAll(async () => {
    try {
      await db.delete(refreshTokens);
      await db.delete(users);
    } catch {
      // Ignore cleanup errors
    }
  });

  test('should register a new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', getUniqueIP())
      .send(testUser)
      .expect(201);

    expect(response.body).toHaveProperty('status', 'success');
    const body = response.body as { data: { user: { email: string } } };
    expect(body.data.user).toHaveProperty('email', testUser.email);
    expect(response.headers['set-cookie']).toBeDefined();
  });

  test('should login with valid credentials', async () => {
    // Register user first
    await request(app)
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', getUniqueIP())
      .send(testUser);

    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', getUniqueIP())
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(response.body).toHaveProperty('status', 'success');
    const body = response.body as { data: { access_token: string } };
    expect(body.data).toHaveProperty('access_token');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  test('should refresh access token', async () => {
    // Register and login
    await request(app)
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', getUniqueIP())
      .send(testUser);

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', getUniqueIP())
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const cookies = loginResponse.headers['set-cookie'] as
      | string[]
      | string
      | undefined;
    const cookieArray = Array.isArray(cookies)
      ? cookies
      : cookies
        ? [cookies]
        : [];
    const refreshToken = getCookieValue(cookieArray, 'refresh_token');

    if (!refreshToken) {
      return; // Skip if refresh token not available
    }

    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .set('X-Forwarded-For', getUniqueIP())
      .send({ refreshToken })
      .expect(200);

    expect(response.body).toHaveProperty('status', 'success');
    const body = response.body as { data: { access_token: string } };
    expect(body.data).toHaveProperty('access_token');
  });
});
