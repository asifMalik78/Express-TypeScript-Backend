import { db } from '#config/database';
import { refreshTokens, users } from '#models/schema';
import app from '#src/app';
import request from 'supertest';

// Check if database is available before running tests
let isDatabaseAvailable = false;

beforeAll(async () => {
  try {
    // Try a simple query to check database connection
    await db.select().from(users).limit(1);
    isDatabaseAvailable = true;
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (
      err.message?.includes('fetch failed') ||
      err.message?.includes('connect')
    ) {
      console.warn('⚠️  Database not available. Tests will be skipped.');
      console.warn(
        '   To run tests, ensure DATABASE_URL is set and database is accessible.'
      );
      isDatabaseAvailable = false;
    } else {
      throw error;
    }
  }
});

describe('Auth API', () => {
  const testUser = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'Test1234',
  };

  beforeEach(async () => {
    if (!isDatabaseAvailable) return;
    // Clean up test data
    await db.delete(refreshTokens);
    await db.delete(users);
  });

  afterAll(async () => {
    if (!isDatabaseAvailable) return;
    // Clean up after all tests
    await db.delete(refreshTokens);
    await db.delete(users);
  });

  describe('POST /api/v1/auth/signup', () => {
    const test = isDatabaseAvailable ? it : it.skip;

    test('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('status', 'success');
      const body = response.body as { data: { user: { email: string } } };
      const bodyData = body.data;
      expect(bodyData).toHaveProperty('user');
      expect(bodyData.user).toHaveProperty('email', testUser.email);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    test('should return 409 if user already exists', async () => {
      // Create user first
      await request(app).post('/api/v1/auth/signup').send(testUser);

      // Try to create again
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(testUser)
        .expect(409);

      expect(response.body).toHaveProperty('status', 'fail');
    });

    test('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          ...testUser,
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body).toHaveProperty('status', 'fail');
      expect(response.body).toHaveProperty('errors');
    });

    test('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          ...testUser,
          password: 'weak',
        })
        .expect(400);

      expect(response.body).toHaveProperty('status', 'fail');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const test = isDatabaseAvailable ? it : it.skip;

    beforeEach(async () => {
      if (!isDatabaseAvailable) return;
      // Create a user for login tests
      await request(app).post('/api/v1/auth/signup').send(testUser);
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      const body = response.body as {
        data: { access_token?: string; user: unknown };
      };
      const bodyData = body.data;
      expect(bodyData).toHaveProperty('access_token');
      expect(bodyData).toHaveProperty('user');
    });

    test('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'wrong@example.com',
          password: testUser.password,
        })
        .expect(401);

      expect(response.body).toHaveProperty('status', 'fail');
    });

    test('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('status', 'fail');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    const test = isDatabaseAvailable ? it : it.skip;
    let refreshToken: string;

    beforeEach(async () => {
      if (!isDatabaseAvailable) return;
      // Create user and login
      await request(app).post('/api/v1/auth/signup').send(testUser);
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });
      const loginBody = loginResponse.body as {
        data: { refresh_token?: string };
      };
      const loginData = loginBody.data;
      const cookies = loginResponse.headers['set-cookie'] as unknown as
        | string[]
        | undefined;
      refreshToken =
        loginData.refresh_token ??
        cookies?.[0]?.split('refresh_token=')[1]?.split(';')[0] ??
        '';
    });

    test('should refresh access token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      const body = response.body as { data: { access_token?: string } };
      const bodyData = body.data;
      expect(bodyData).toHaveProperty('access_token');
    });
  });
});
