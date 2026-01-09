const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

const User = require('../models/User');
const Profile = require('../models/Profile');
const Portfolio = require('../models/Portfolio');

describe('GET /api/providers/search (paginated)', () => {
  let providerUser;

  beforeAll(async () => {
    providerUser = await User.create({
      name: 'Sam Scholes',
      email: 'sam@test.com',
      roles: ['provider'],
    });

    await Profile.create({
      user: providerUser._id,
      avatarUrl: 'https://test.com/avatar.jpg',
    });

    await Portfolio.create({
      user: providerUser._id,
      company: 'Kodak Studio',
      servicesOffered: ['photoshoot', 'editing'],
    });
  });

  afterAll(async () => {
    await Portfolio.deleteMany();
    await Profile.deleteMany();
    await User.deleteMany();
    await mongoose.connection.close();
  });

  test('returns paginated providers matching query', async () => {
    const res = await request(app)
      .get('/api/providers/search')
      .query({ q: 'photo', page: 1, limit: 6 })
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('totalPages');

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.total).toBe(1);
    expect(res.body.page).toBe(1);

    const provider = res.body.data[0];

    expect(provider._id.toString()).toBe(providerUser._id.toString());
    expect(provider.name).toBe('Sam Scholes');
    expect(provider.company).toBe('Kodak Studio');
    expect(provider.servicesOffered).toContain('photoshoot');
    expect(provider.avatarUrl).toBe('https://test.com/avatar.jpg');
  });

  test('returns empty data array when no matches found', async () => {
    const res = await request(app)
      .get('/api/providers/search')
      .query({ q: 'banana', page: 1, limit: 6 })
      .expect(200);

    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(0);
    expect(res.body.totalPages).toBe(0);
  });
});
