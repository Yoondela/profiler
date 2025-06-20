const request = require('supertest');
const app = require('../index');
const mongoose = require('mongoose');

jest.setTimeout(10000); // in case anything is slow

describe('POST /api/users', () => {
  it('should create a new user and return user data', async () => {
    const uniqueEmail = `user${Date.now()}@example.com`;

    const response = await request(app)
      .post('/api/users')
      .send({
        name: 'Yondela',
        email: uniqueEmail,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('name', 'Yondela');
    expect(response.body).toHaveProperty('email', uniqueEmail);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });
});
