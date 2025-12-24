const request = require('supertest');
const app = require('../server');
const db = require('../src/utils/database');

describe('Asset Management API', () => {
  let authToken;
  let testCategoryId;

  beforeAll(async () => {
    // Get auth token for tests that require authentication
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });

    authToken = loginResponse.body.token;

    // Create a test category for asset tests
    const categoryResult = await db.execute(
      'INSERT INTO dim_category (category_name) VALUES (?)',
      ['Test Category']
    );
    testCategoryId = categoryResult[0].insertId;
  });

  afterAll(async () => {
    // Clean up test data
    await db.execute('DELETE FROM dim_asset_definition WHERE category_id = ?', [testCategoryId]);
    await db.execute('DELETE FROM dim_category WHERE category_id = ?', [testCategoryId]);
    await db.end();
  });

  test('should create a new asset', async () => {
    const response = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Asset',
        category_id: testCategoryId,
        brand: 'Test Brand',
        model: 'Test Model',
        unit: '个',
        requirement: 'Test Requirement'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('asset_id');
    expect(response.body.name).toBe('Test Asset');
  });

  test('should return 400 for missing required fields when creating asset', async () => {
    const response = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Asset'
      });

    expect(response.status).toBe(400);
  });

  test('should get all assets', async () => {
    const response = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('should get a specific asset by ID', async () => {
    // First create an asset
    const createResponse = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Specific Test Asset',
        category_id: testCategoryId,
        brand: 'Test Brand',
        model: 'Test Model',
        unit: '个',
        requirement: 'Test Requirement'
      });

    const assetId = createResponse.body.asset_id;

    const response = await request(app)
      .get(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Specific Test Asset');
  });

  test('should update an existing asset', async () => {
    // First create an asset
    const createResponse = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Update Test Asset',
        category_id: testCategoryId,
        brand: 'Test Brand',
        model: 'Test Model',
        unit: '个',
        requirement: 'Test Requirement'
      });

    const assetId = createResponse.body.asset_id;

    const response = await request(app)
      .put(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Updated Test Asset',
        category_id: testCategoryId,
        brand: 'Updated Brand',
        model: 'Updated Model',
        unit: '件',
        requirement: 'Updated Requirement'
      });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated Test Asset');
  });

  test('should delete an asset', async () => {
    // First create an asset
    const createResponse = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Delete Test Asset',
        category_id: testCategoryId,
        brand: 'Test Brand',
        model: 'Test Model',
        unit: '个',
        requirement: 'Test Requirement'
      });

    const assetId = createResponse.body.asset_id;

    const response = await request(app)
      .delete(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('资产删除成功');
  });
});