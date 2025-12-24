const request = require('supertest');
const app = require('../server');
const db = require('../src/utils/database');

describe('Category Management API', () => {
  let authToken;

  beforeAll(async () => {
    // Get auth token for tests that require authentication
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Clean up test data
    await db.execute('DELETE FROM dim_category WHERE category_name LIKE ?', ['Test Category%']);
    await db.end();
  });

  test('should create a new category', async () => {
    const response = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        category_name: 'Test Category 1'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('category_id');
    expect(response.body.category_name).toBe('Test Category 1');
  });

  test('should return 400 for missing category name', async () => {
    const response = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(response.status).toBe(400);
  });

  test('should return 400 for duplicate category name', async () => {
    // First create a category
    await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        category_name: 'Duplicate Category'
      });

    // Try to create the same category again
    const response = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        category_name: 'Duplicate Category'
      });

    expect(response.status).toBe(400);
  });

  test('should get all categories', async () => {
    const response = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('should get a specific category by ID', async () => {
    // First create a category
    const createResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        category_name: 'Specific Test Category'
      });

    const categoryId = createResponse.body.category_id;

    const response = await request(app)
      .get(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.category_name).toBe('Specific Test Category');
  });

  test('should update an existing category', async () => {
    // First create a category
    const createResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        category_name: 'Update Test Category'
      });

    const categoryId = createResponse.body.category_id;

    const response = await request(app)
      .put(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        category_name: 'Updated Test Category'
      });

    expect(response.status).toBe(200);
    expect(response.body.category_name).toBe('Updated Test Category');
  });

  test('should delete a category', async () => {
    // First create a category
    const createResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        category_name: 'Delete Test Category'
      });

    const categoryId = createResponse.body.category_id;

    const response = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('分类删除成功');
  });
});