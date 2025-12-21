const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');

jest.mock('../services/geocodeAddress', () => ({
  geocodeAddress: jest.fn(),
}));

const { geocodeAddress } = require('../services/geocodeAddress');

describe('become provider API', () => {
  let user;

  beforeEach(async () => {
    await User.deleteMany({});
    user = new User({ name: 'Test User', email: `test${Date.now()}@mail.com` });
    await user.save();
  });


  it('should create portfolio and geocode address when becoming provider', async () => {
    geocodeAddress.mockResolvedValue({
      lng: 18.4241,
      lat: -33.9249,
    });

    const res = await request(app)
      .patch(`/api/users/${user._id}/upgrade-to-provider`)
      .send({
        company: 'Test Company',
        address: {
          formatted: 'Cape Town, South Africa',
          placeId: 'test-place-id',
        },
      });

    expect(res.statusCode).toBe(200);

    expect(geocodeAddress).toHaveBeenCalledWith(
      'Cape Town, South Africa',
    );

    expect(res.body.portfolio.company).toBe('Test Company');
    expect(res.body.portfolio.location.coordinates).toEqual([
      18.4241,
      -33.9249,
    ]);
  });

  it('should be idempotent: calling twice does not reset becameProviderAt', async () => {
    const firstRes = await request(app)
      .patch(`/api/users/${user._id}/upgrade-to-provider`)
      .send({
        company: 'Test Company',
        address: {
          formatted: 'Cape Town, South Africa',
          placeId: 'test-place-id',
        },
      });

    const firstDate = firstRes.body.portfolio.becameProviderAt;

    const secondRes = await request(app)
      .patch(`/api/users/${user._id}/upgrade-to-provider`)
      .send({
        company: 'Test Company',
        address: {
          formatted: 'Cape Town, South Africa',
          placeId: 'test-place-id',
        },
      });

    const secondDate = secondRes.body.portfolio.becameProviderAt;

    expect(secondRes.statusCode).toBe(200);
    expect(secondRes.body.userRoles).toContain('provider');
    expect(secondDate).toBe(firstDate);
  });

  it('should reject becoming provider without company and address', async () => {
    const res = await request(app)
      .patch(`/api/users/${user._id}/upgrade-to-provider`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });



  afterEach(async () => {
    await User.deleteMany({});
  });
});
