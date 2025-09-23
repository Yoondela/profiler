// tests/profiles.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');
const Profile = require('../models/Profile');
const calculateProfileCompletion = require('../utils/calculateProfileCompletion');

jest.setTimeout(15000);

describe('Profiles API', () => {
  let user;
  let profile;

  beforeAll(async () => {
    await Profile.deleteMany({});
    await User.deleteMany({});

    const uniqueEmail = `profileowner${Date.now()}@test.com`;
    user = new User({ name: 'Profile Owner', email: uniqueEmail });
    await user.save();
  });

  test('POST /api/profiles creates profile and computes completion', async () => {
    const payload = {
      user: String(user._id),
      bio: 'Testing profile API',
      phone: '0712345678',
      address: '1 Test Lane',
      preferredContactMethod: 'sms',
      notificationSettings: { email: true, sms: true }
    };

    const expectedCompletion = calculateProfileCompletion(payload);

    const res = await request(app)
      .post('/api/profiles')
      .send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(String(res.body.user)).toBe(String(user._id));
    expect(res.body).toHaveProperty('bio', payload.bio);
    expect(res.body).toHaveProperty('profileCompletion', expectedCompletion);

    profile = res.body;
    const saved = await Profile.findById(profile._id).lean();
    expect(saved).not.toBeNull();
    expect(String(saved.user)).toBe(String(user._id));
    expect(saved.profileCompletion).toBe(expectedCompletion);
  });

  test('GET /api/profiles/:id returns profile', async () => {
    const res = await request(app)
      .get(`/api/profiles/${profile._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.bio).toBe('Testing profile API');
    expect(res.body.phone).toBe('0712345678');
  });

  test('GET /api/profiles/me/:userId returns profile', async () => {
    const res = await request(app)
      .get(`/api/profiles/me/${user._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.bio).toBe('Testing profile API');
    expect(res.body.phone).toBe('0712345678');
  });

  test('GET /api/profiles/me/mail/:email returns nested userAccount shape', async () => {
    const res = await request(app)
      .get(`/api/profiles/me/mail/${user.email}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.userAccount).toBeDefined();
    expect(res.body.userAccount.user.email).toBe(user.email);
    expect(res.body.userAccount.profile.bio).toBe('Testing profile API');
    expect(res.body.userAccount.profile.phone).toBe('0712345678');
  });

  test('PATCH /api/profiles/:id edits profile and updates completion', async () => {
    const updatePayload = { bio: 'Updated bio', phone: '0799999999' };
    const expectedCompletion = calculateProfileCompletion({ ...profile, ...updatePayload });

    const res = await request(app)
      .patch(`/api/profiles/${profile._id}`)
      .send(updatePayload);

    expect(res.statusCode).toBe(200);
    expect(res.body.bio).toBe(updatePayload.bio);
    expect(res.body.phone).toBe(updatePayload.phone);
    expect(res.body.profileCompletion).toBe(expectedCompletion);

    const saved = await Profile.findById(profile._id).lean();
    expect(saved.bio).toBe(updatePayload.bio);
    expect(saved.phone).toBe(updatePayload.phone);
    expect(saved.profileCompletion).toBe(expectedCompletion);
  });

  test('PATCH /api/profiles/update-by-mail/:email edits profile by email', async () => {
    const updatePayload = { bio: 'Updated bio via email', phone: '0791111111' };
    const expectedCompletion = calculateProfileCompletion({ ...profile, ...updatePayload });

    const res = await request(app)
      .patch(`/api/profiles/update-by-mail/${user.email}`)
      .send(updatePayload);

    expect(res.statusCode).toBe(200);
    expect(res.body.bio).toBe(updatePayload.bio);
    expect(res.body.phone).toBe(updatePayload.phone);
    expect(res.body.profileCompletion).toBe(expectedCompletion);
  });

  afterAll(async () => {
    await Profile.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });
});
