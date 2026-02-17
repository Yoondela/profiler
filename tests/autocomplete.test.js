const request = require('supertest');
const app = require('../app');

const Category = require('../models/Category');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Portfolio = require('../models/Portfolio');

describe('GET /api/search/autocomplete', () => {
  beforeAll(async () => {
    await Category.create({
      name: 'Cleaning',
      slug: 'cleaning',
    });

    const user = await User.create({
      name: 'Sam Scholes',
      email: 'sam@test.com',
      roles: ['provider'],
    });

    await Profile.create({
      user: user._id,
    });

    await Portfolio.create({
      user: user._id,
      address: {
        formatted: 'Cape Town, South Africa',
      },
      servicesOffered: ['Photoshoot', 'Editing'],
    });
  });

  afterAll(async () => {
    await Category.deleteMany();
    await Portfolio.deleteMany();
    await Profile.deleteMany();
    await User.deleteMany();
  });

  test('returns autocomplete suggestions for categories, providers, and services', async () => {
    const res = await request(app)
      .get('/api/search/autocomplete?q=cle')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);

    const labels = res.body.map((i) => i.label);

    expect(labels).toContain('Cleaning');
  });

  test('returns empty array for short or missing query', async () => {
    const res = await request(app)
      .get('/api/search/autocomplete?q=c')
      .expect(200);

    expect(res.body).toEqual([]);
  });
});
