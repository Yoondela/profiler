// tests/user.test.js
const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const Profile = require('../models/Profile');

describe('User endpoints', () => {

  afterAll(async () => {
    await User.deleteMany({});
    await Profile.deleteMany({});
  });

  test('POST /api/users creates user + default profile', async () => {
    const uniqueEmail = `user${Date.now()}@example.com`;

    const response = await request(app)
      .post('/api/users')
      .send({
        name: 'Yondela',
        email: uniqueEmail,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.newUser).toHaveProperty('name', 'Yondela');
    expect(response.body.newUser).toHaveProperty('email', uniqueEmail);

    // NEW: ensure roles default exists
    expect(response.body.newUser).toHaveProperty('roles');
    expect(Array.isArray(response.body.newUser.roles)).toBe(true);
    expect(response.body.newUser.roles).toContain('client');

    // providerProfile default should be null (no provider yet)
    expect(response.body.newUser).toHaveProperty('providerProfile', null);

    // ensure profile object is returned (if your controller returns it)
    if (response.body.profile) {
      expect(response.body.profile).toHaveProperty('user');
      expect(response.body.profile).toHaveProperty('profileCompletion');
    }
  });

  test('DELETE /api/users/:id deletes user and profile', async () => {
    const user = new User({ name: 'ToDelete', email: `del${Date.now()}@ex.com` });
    await user.save();

    const profile = new Profile({ user: user._id, bio: 'bye' });
    await profile.save();

    const res = await request(app).delete(`/api/users/${user._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('User and profile deleted successfully');

    const deletedUser = await User.findById(user._id);
    const deletedProfile = await Profile.findOne({ user: user._id });
    expect(deletedUser).toBeNull();
    expect(deletedProfile).toBeNull();
  });
});
