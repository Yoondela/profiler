const request = require('supertest');
const app = require('../app'); // your express app

jest.setTimeout(10000);

test('GET /protected should return fake user', async () => {
  const res = await request(app).get('/api/protected');
  expect(res.status).toBe(200);
  console.log(res.body);
  expect(res.body).toEqual({
    message: 'This route is protected',
    user: {
      payload: {
        sub: 'auth0|mock-user-id',
        scope: 'read:all write:all',
      },
    },
  });
});

afterAll(async () => {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});
