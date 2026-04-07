const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Profile = require('../../models/Profile');

describe('Flack user lookup', () => {
  afterAll(async () => {
    await Profile.deleteMany({});
    await User.deleteMany({});
  });

  test('GET /api/flack-users/me/:userId returns flackUserId for that user', async () => {
    const user = await User.create({
      name: 'Flack User',
      email: `flack${Date.now()}@example.com`,
      flackUserId: 'flack_12345',
    });

    const res = await request(app)
      .get(`/api/flack-users/me/${user._id}`)
      .set('Authorization', 'Bearer auth0|flack-test');

    console.log('Response body:', res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('flackUserId', 'flack_12345');
  });

  test('GET /api/flack-users/by-flack/:flackUserId returns user info for flack user', async () => {
    const flackUserId = 'flack_67890';
    const user = await User.create({
      name: 'Flack Info User',
      email: `flack-info-${Date.now()}@example.com`,
      flackUserId,
    });

    await Profile.create({
      user: user._id,
      avatarUrl: 'https://avatar.example.com/flack.jpg',
    });

    const res = await request(app)
      .get(`/api/flack-users/by-flack/${flackUserId}`)
      .set('Authorization', 'Bearer auth0|flack-test');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'Flack Info User');
    expect(res.body).toHaveProperty('email', user.email);
    expect(res.body).toHaveProperty('flackUserId', flackUserId);
    expect(res.body).toHaveProperty('avatarUrl', 'https://avatar.example.com/flack.jpg');
  });
});
