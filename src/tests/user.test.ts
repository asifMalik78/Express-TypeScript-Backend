/// <reference types="vitest/globals" />
import { db } from '../config/database.js';
import { refreshTokens, users } from '../models/schema.js';
import app from '../app.js';
import request from 'supertest';
import { eq, inArray, not } from 'drizzle-orm';

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

describe('User API', () => {
  let adminToken: string;
  let adminUserId: number;

  beforeAll(async () => {
    // Clean up and create admin user
    try {
      await db.delete(refreshTokens);
      await db.delete(users);
    } catch {
      // Ignore cleanup errors
    }

    const adminData = {
      email: 'admin@test.com',
      name: 'Admin User',
      password: 'Admin1234',
    };

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', getUniqueIP())
      .send(adminData)
      .expect(201);

    const registerBody = registerResponse.body as {
      data: { user: { id: number } };
    };
    adminUserId = registerBody.data.user.id;

    await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.id, adminUserId));

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', getUniqueIP())
      .send(adminData)
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
    adminToken = getCookieValue(cookieArray, 'access_token') ?? '';
  });

  beforeEach(async () => {
    // Ensure admin token is valid - recreate admin user if needed
    const adminData = {
      email: 'admin@test.com',
      password: 'Admin1234',
    };

    let loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', getUniqueIP())
      .send(adminData);

    if (loginResponse.status !== 200) {
      // Admin user doesn't exist or password is wrong - recreate it
      const existingAdmin = await db
        .select()
        .from(users)
        .where(eq(users.email, adminData.email))
        .limit(1);

      if (existingAdmin.length > 0) {
        // User exists but password is wrong - delete and recreate
        adminUserId = existingAdmin[0].id;
        await db
          .delete(refreshTokens)
          .where(eq(refreshTokens.userId, adminUserId));
        await db.delete(users).where(eq(users.id, adminUserId));
      }

      // Create new admin user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .set('X-Forwarded-For', getUniqueIP())
        .send({
          ...adminData,
          name: 'Admin User',
        })
        .expect(201);

      const registerBody = registerResponse.body as {
        data: { user: { id: number } };
      };
      adminUserId = registerBody.data.user.id;

      await db
        .update(users)
        .set({ role: 'admin' })
        .where(eq(users.id, adminUserId));

      // Login to get token
      loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', getUniqueIP())
        .send(adminData)
        .expect(200);
    }

    // Extract token from successful login
    const cookies = loginResponse.headers['set-cookie'] as
      | string[]
      | string
      | undefined;
    const cookieArray = Array.isArray(cookies)
      ? cookies
      : cookies
        ? [cookies]
        : [];
    const token = getCookieValue(cookieArray, 'access_token');

    if (!token) {
      throw new Error('Failed to get admin token from login');
    }

    adminToken = token;
    const loginBody = loginResponse.body as {
      data?: { user?: { id?: number } };
    };
    if (loginBody.data?.user?.id) {
      adminUserId = loginBody.data.user.id;
    }

    // Clean up non-admin users
    try {
      const nonAdminUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(not(eq(users.id, adminUserId)));
      const nonAdminIds = nonAdminUsers.map(u => u.id);
      if (nonAdminIds.length > 0) {
        await db
          .delete(refreshTokens)
          .where(inArray(refreshTokens.userId, nonAdminIds));
        await db.delete(users).where(inArray(users.id, nonAdminIds));
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  test('should create a new user', async () => {
    const newUser = {
      email: 'newuser@example.com',
      name: 'New User',
      password: 'NewUser123',
      role: 'user',
    };

    const response = await request(app)
      .post('/api/v1/users')
      .set('X-Forwarded-For', getUniqueIP())
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newUser)
      .expect(201);

    expect(response.body).toHaveProperty('status', 'success');
    const body = response.body as {
      data: { user: { email: string } };
    };
    expect(body.data.user).toHaveProperty('email', newUser.email);
  });

  test('should get all users with pagination', async () => {
    // Create test users
    await request(app)
      .post('/api/v1/users')
      .set('X-Forwarded-For', getUniqueIP())
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'user1@example.com',
        name: 'User One',
        password: 'Password123',
      });

    const response = await request(app)
      .get('/api/v1/users?page=1&limit=10')
      .set('X-Forwarded-For', getUniqueIP())
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('status', 'success');
    const body = response.body as {
      data: unknown[];
      pagination: { page: number };
    };
    expect(body.data).toBeInstanceOf(Array);
    expect(body.pagination).toHaveProperty('page', 1);
  });

  test('should get user by ID', async () => {
    const createResponse = await request(app)
      .post('/api/v1/users')
      .set('X-Forwarded-For', getUniqueIP())
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'fetchuser@example.com',
        name: 'Fetch User',
        password: 'FetchUser123',
      });

    const createBody = createResponse.body as {
      data: { user: { id: number } };
    };
    const userId = createBody.data.user.id;

    const response = await request(app)
      .get(`/api/v1/users/${String(userId)}`)
      .set('X-Forwarded-For', getUniqueIP())
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('status', 'success');
    const body = response.body as {
      data: { user: { id: number } };
    };
    expect(body.data.user).toHaveProperty('id', userId);
  });

  test('should update a user', async () => {
    const createResponse = await request(app)
      .post('/api/v1/users')
      .set('X-Forwarded-For', getUniqueIP())
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'updateuser@example.com',
        name: 'Update User',
        password: 'UpdateUser123',
      });

    const createBody = createResponse.body as {
      data: { user: { id: number } };
    };
    const userId = createBody.data.user.id;

    const response = await request(app)
      .patch(`/api/v1/users/${String(userId)}`)
      .set('X-Forwarded-For', getUniqueIP())
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Name' })
      .expect(200);

    expect(response.body).toHaveProperty('status', 'success');
    const body = response.body as {
      data: { user: { name: string } };
    };
    expect(body.data.user).toHaveProperty('name', 'Updated Name');
  });

  test('should delete a user', async () => {
    const createResponse = await request(app)
      .post('/api/v1/users')
      .set('X-Forwarded-For', getUniqueIP())
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'deleteuser@example.com',
        name: 'Delete User',
        password: 'DeleteUser123',
      });

    const createBody = createResponse.body as {
      data: { user: { id: number } };
    };
    const userId = createBody.data.user.id;

    const response = await request(app)
      .delete(`/api/v1/users/${String(userId)}`)
      .set('X-Forwarded-For', getUniqueIP())
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('status', 'success');
  });
});
