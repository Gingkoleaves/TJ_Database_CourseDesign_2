const request = require('supertest');
const app = require('../server');
const db = require('../src/utils/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Authentication API', () => {
  beforeAll(async () => {
    // Create a test user for authentication tests
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    await db.execute(
      'INSERT INTO sys_user (username, password_hash, is_admin) VALUES (?, ?, FALSE)',
      ['testuser', hashedPassword]
    );
  });

  afterAll(async () => {
    // Clean up test data
    await db.execute('DELETE FROM sys_user WHERE username = ?', ['testuser']);
    await db.end();
  });

  test('should login successfully with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'testpassword'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.username).toBe('testuser');
  });

  test('should return 401 for invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('用户名或密码错误');
  });

  test('should return 400 for missing credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser'
      });

    expect(response.status).toBe(400);
  });

  test('should return current user info with valid token', async () => {
    // First get a token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'testpassword'
      });

    const token = loginResponse.body.token;

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('testuser');
  });

  test('should return 401 for invalid token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');

    expect(response.status).toBe(401);
  });
});