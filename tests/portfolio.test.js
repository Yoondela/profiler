const request = require('supertest');
const app = require('../app');

const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Service = require('../models/Service');

describe('Portfolio API', () => {

  let portfolio;
  let user;
  let gardening;
  let tiling;

  beforeAll(async () => {

    user = await User.create({
      name: 'Tester Provider',
      email: 'provider@test2.com',
      roles: ['provider'],
    });

    gardening = await Service.create({
      name: 'Gardening',
      slug: 'gardening'
    });

    tiling = await Service.create({
      name: 'Tiling',
      slug: 'tiling'
    });

    portfolio = await Portfolio.create({
      user: user._id,
      servicesOffered: [gardening._id, tiling._id],
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
    await Service.deleteMany({});
  });

  test('should return provider portfolio when provider exists', async () => {

    const res = await request(app)
      .get(`/api/portfolios/${user._id}`);

    expect(res.statusCode).toBe(200);

    const services = res.body.servicesOffered.map(s => s.slug);

    expect(services).toContain('gardening');
    expect(res.body.rating).toBe(4.7);

  });

});

describe('PATCH /api/portfolios/:providerId', () => {

  let portfolio;
  let user;
  let plumbing;
  let tiling;

  beforeAll(async () => {

    user = await User.create({
      name: 'Tester Provider',
      email: 'provider2@test.com',
      roles: ['provider'],
    });

    plumbing = await Service.create({
      name: 'Plumbing',
      slug: 'plumbing'
    });

    tiling = await Service.create({
      name: 'Tiling',
      slug: 'tiling'
    });

    portfolio = await Portfolio.create({
      user: user._id,
      servicesOffered: [tiling._id],
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
    await Service.deleteMany({});
  });

  it('should update portfolio fields (bio + services)', async () => {

    const res = await request(app)
      .patch(`/api/portfolios/${user._id}`)
      .send({
        bio: 'updated bio',
        servicesOffered: [plumbing._id, tiling._id],
      });

    expect(res.status).toBe(200);

    expect(res.body.bio).toBe('updated bio');

    expect(res.body.servicesOffered.length).toBe(2);

  });

});
