// tests/portfolio.test.js
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');

describe('Portfolio API', () => {

  let portfolio;

  beforeAll(async () => {
    const user = await User.create({
      name: 'Tester Provider',
      email: 'provider@test2.com',
      roles: ['provider'],
    });

    portfolio = await Portfolio.create({
      user: user._id,
      company: 'Tester Provider',
      servicesOffered: ['gardening', 'tiling'],
      bio: 'I do great work',
      bannerUrl: 'some-banner-url',
      avatarUrl: 'some-avatar-url',
      rating: 4.7,
      completedJobs: 20,
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Portfolio.deleteMany({});
  });

  test('should return provider portfolio when provider exists', async () => {

    const res = await request(app).get(`/api/portfolios/${portfolio._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('company', 'Tester Provider');
    expect(res.body.servicesOffered).toContain('gardening');
    expect(res.body.rating).toBe(4.7);
  });
});

describe('PATCH /api/portfolios/:providerId', () => {

  let portfolio;
  let user;

  beforeAll(async () => {
    user = await User.create({
      name: 'Tester Provider',
      email: 'provider@test2.com',
      roles: ['provider'],
    });

    portfolio = await Portfolio.create({
      user: user._id,
      company: 'Tester Provider',
      servicesOffered: ['gardening', 'tiling'],
      bio: 'I do great work',
      bannerUrl: 'some-banner-url',
      avatarUrl: 'some-avatar-url',
      rating: 4.7,
      completedJobs: 20,
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Portfolio.deleteMany({});
  });


  it('should update portfolio fields (bio + services)', async () => {
    const res = await request(app)
      .patch(`/api/portfolios/${user._id}`)
      .send({
        bio: 'updated bio',
        servicesOffered: ['plumbing', 'tiling'],
      });

    expect(res.status).toBe(200);
    expect(res.body.bio).toBe('updated bio');
    expect(res.body.servicesOffered).toContain('tiling');
  });

});
