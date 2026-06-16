const request = require('supertest');
const app = require('../index');

describe('Auth Endpoints', () => {

  it('GET /api/health - should return ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/auth/register - should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/auth/login - should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fake@fake.com', password: 'wrongpassword' });
    expect([401, 500]).toContain(res.statusCode);
  });

});