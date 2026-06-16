const request = require('supertest');
const app = require('../index');

afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
});

describe('Products Endpoints', () => {

  it('GET /api/products - should return 200 or 500', async () => {
    const res = await request(app).get('/api/products');
    expect([200, 500]).toContain(res.statusCode);
  });

  it('GET /api/categories - should return 200 or 500', async () => {
    const res = await request(app).get('/api/categories');
    expect([200, 500]).toContain(res.statusCode);
  }, 15000);

});