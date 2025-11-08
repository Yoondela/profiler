const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

describe('become provider API', () => {
  let user;

  beforeAll(async () => {
    await User.deleteMany({});
    user = new User({ name: 'Test User', email: `test${Date.now()}@mail.com` });
    await user.save();
  });


  it('should upgrade a user to provider with becameProviderAt set', async () => {
    const res = await request(app)
      .patch(`/api/users/${user._id}/upgrade-to-provider`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('User upgraded to provider successfully');
    expect(res.body.userRoles).toContain('provider');
    expect(res.body.portfolio.becameProviderAt).toBeDefined();
    expect(new Date(res.body.portfolio.becameProviderAt)).toBeInstanceOf(Date);

    const updated = await User.findById(user._id).lean();
    expect(updated.roles).toContain('provider');
  });

  it('should be idempotent: calling twice does not reset becameProviderAt', async () => {
    const firstRes = await request(app)
      .patch(`/api/users/${user._id}/upgrade-to-provider`);
    const firstDate = firstRes.body.portfolio.becameProviderAt;

    const secondRes = await request(app)
      .patch(`/api/users/${user._id}/upgrade-to-provider`);
    const secondDate = secondRes.body.portfolio.becameProviderAt;

    expect(secondRes.statusCode).toBe(200);
    expect(secondRes.body.userRoles).toContain('provider');
    expect(secondDate).toBe(firstDate);
  });


  afterAll(async () => {
    await User.deleteMany({});
  });
});
