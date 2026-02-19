const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Simple auth helper for tests
 * Replace later with real JWT/Auth0 helper
 */
const auth = (user) => {
  return `Bearer test-user-${user._id}`;
};

let user;
let otherUser;

beforeAll(async () => {
  await User.deleteMany();
  await Notification.deleteMany();

  user = await User.create({
    name: 'Test User',
    email: 'user@test.com',
    roles: ['provider'],
  });

  otherUser = await User.create({
    name: 'Other User',
    email: 'other@test.com',
    roles: ['provider'],
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('GET /api/notifications', () => {
  test('returns unread notifications for user', async () => {
    await Notification.create([
      {
        user: user._id,
        type: 'company_invite',
        message: 'Invited you',
        status: 'unread',
      },
      {
        user: user._id,
        type: 'system',
        message: 'Read notification',
        status: 'read',
      },
      {
        user: otherUser._id,
        type: 'company_invite',
        message: 'Not for you',
        status: 'unread',
      },
    ]);

    const res = await request(app)
      .get(`/api/notifications/${user._id}`)
      .set('Authorization', auth(user))
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);

    const notification = res.body[0];
    expect(notification.type).toBe('company_invite');
    expect(notification.message).toBe('Invited you');
  });

  test('returns empty array when user has no unread notifications', async () => {
    await Notification.deleteMany({ user: user._id });

    const res = await request(app)
      .get(`/api/notifications/${user._id}`)
      .set('Authorization', auth(user))
      .expect(200);

    expect(res.body).toEqual([]);
  });
});
