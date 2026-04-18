const request = require('supertest');
const app = require('../app');

const User = require('../models/User');
const Company = require('../models/Company');
const Service = require('../models/Service');

const mockStoredAddress = () => ({
  formatted: '123 Test Avenue, Test City, 12345, Testland',
  placeId: 'test-place-id',
  addressComponents: {
    street: '123 Test Avenue',
    suburb: 'Test Suburb',
    city: 'Test City',
    province: 'Test Province',
    postalCode: '12345',
    country: 'Testland',
  },
  location: {
    type: 'Point',
    coordinates: [18.4241, -33.9249],
  },
});

describe('Company edits API', () => {
  let company;
  let user;
  let gardening;
  let tiling;

  beforeAll(async () => {
    await User.deleteMany({});
    await Company.deleteMany({});
    await Service.deleteMany({});

    user = await User.create({
      name: 'Company Owner',
      email: `owner${Date.now()}@example.com`,
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

    company = await Company.create({
      name: 'CleanCo',
      owner: user._id,
      servicesOffered: [gardening._id],
      otherSkills: ['ironing'],
      logoUrl: 'logo.png',
      bannerUrl: 'banner.png',
      about: 'Company bio',
      email: 'contact@cleanco.com',
      phone: '0812345678',
      address: mockStoredAddress(),
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Company.deleteMany({});
    await Service.deleteMany({});
  });

  test('should return company for edits when company exists', async () => {
    const res = await request(app).get(`/api/company/${company._id}/edits`);

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('CleanCo');

    const serviceSlugs = res.body.servicesOffered.map((service) => service.slug);
    expect(serviceSlugs).toContain('gardening');
  });

  test('should update company fields', async () => {
    const res = await request(app)
      .patch(`/api/company/${company._id}/edits`)
      .send({
        about: 'Updated company about',
        email: 'updated@cleanco.com',
        servicesOffered: [gardening._id, tiling._id],
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.about).toBe('Updated company about');
    expect(res.body.email).toBe('updated@cleanco.com');
    expect(res.body.servicesOffered.length).toBe(2);
  });
});
