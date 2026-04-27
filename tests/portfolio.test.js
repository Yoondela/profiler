const request = require('supertest');
const app = require('../app');

const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Company = require('../models/Company');
const Service = require('../models/Service');

const mockStoredAddress = () => ({
  formatted: '56 Hendry Rd, Morningside, Berea, 4001, South Africa',
  placeId: 'test-place-id',
  addressComponents: {
    street: '56 Hendry Road',
    suburb: 'Morningside',
    city: 'Berea',
    province: 'KwaZulu-Natal',
    postalCode: '4001',
    country: 'South Africa',
  },
  location: {
    type: 'Point',
    coordinates: [18.4241, -33.9249],
  },
});

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
      slug: 'gardening',
    });

    tiling = await Service.create({
      name: 'Tiling',
      slug: 'tiling',
    });

    portfolio = await Portfolio.create({
      user: user._id,
      servicesOffered: [gardening._id, tiling._id],
      bio: 'I do great work',
      address: mockStoredAddress(),
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

    console.log('res:', res.body);

    expect(res.statusCode).toBe(200);

    const services = res.body.portfolio.servicesOffered.map(s => s.slug);

    expect(services).toContain('gardening');
    expect(res.body.portfolio.rating).toBe(4.7);

  });

});


// ---------------------------
// PATCH (NO COMPANY)
// ---------------------------
describe('PATCH /api/portfolios/:providerId (portfolio only)', () => {

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
      slug: 'plumbing',
    });

    tiling = await Service.create({
      name: 'Tiling',
      slug: 'tiling',
    });

    portfolio = await Portfolio.create({
      user: user._id,
      servicesOffered: [tiling._id],
      bio: 'I do great work',
      address: mockStoredAddress(),

    });

  });

  afterAll(async () => {
    await User.deleteMany({});
    await Portfolio.deleteMany({});
    await Service.deleteMany({});
    await Company.deleteMany({});
  });

  it('should update portfolio when no company exists', async () => {

    const res = await request(app)
      .patch(`/api/portfolios/${user._id}`)
      .send({
        bio: 'updated bio',
        servicesOffered: [plumbing._id, tiling._id],
      });

    expect(res.status).toBe(200);

    expect(res.body.type).toBe('portfolio');
    expect(res.body.data.bio).toBe('updated bio');
    expect(res.body.data.servicesOffered.length).toBe(2);

  });

});

// ---------------------------
// PATCH (WITH COMPANY)
// ---------------------------
describe('PATCH /api/portfolios/:providerId (company precedence)', () => {

  let user;
  let portfolio;
  let company;
  let plumbing;

  beforeAll(async () => {

    user = await User.create({
      name: 'Company Provider',
      email: 'company@test.com',
      roles: ['provider'],
    });

    plumbing = await Service.create({
      name: 'Plumbing',
      slug: 'plumbing',
    });

    portfolio = await Portfolio.create({
      user: user._id,
      bio: 'portfolio bio',
      address: mockStoredAddress(),
    });

    company = await Company.create({
      name: 'FixItCo',
      owner: user._id,
      about: 'company bio',
      servicesOffered: [],
      address: mockStoredAddress(),
    });

  });

  afterAll(async () => {
    await User.deleteMany({});
    await Portfolio.deleteMany({});
    await Company.deleteMany({});
    await Service.deleteMany({});
  });

  it('should update company instead of portfolio', async () => {

    const res = await request(app)
      .patch(`/api/portfolios/${user._id}`)
      .send({
        about: 'updated company bio',
        servicesOffered: [plumbing._id],
      });

    expect(res.status).toBe(200);

    expect(res.body.type).toBe('company');
    expect(res.body.data.about).toBe('updated company bio');
    expect(res.body.data.servicesOffered.length).toBe(1);

    // 🔑 ensure portfolio NOT updated
    const updatedPortfolio = await Portfolio.findOne({ user: user._id });
    expect(updatedPortfolio.bio).toBe('portfolio bio');

  });

});
