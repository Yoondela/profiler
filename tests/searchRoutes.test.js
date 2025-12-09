const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

const User = require('../models/User');
const Profile = require('../models/Profile');
const Portfolio = require('../models/Portfolio');

describe('GET /api/providers/search', () => {
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
  });

  test('should return providers matching name, company, or service', async () => {
    const res = await request(app)
      .get('/api/providers/search?q=photo')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);

    const provider = res.body[0];

    expect(provider._id.toString()).toBe(providerUser._id.toString());
    expect(provider.name).toBe('Sam Scholes');
    expect(provider.company).toBe('Kodak Studio');
    expect(provider.servicesOffered).toContain('photoshoot');
    expect(provider.avatarUrl).toBe('https://test.com/avatar.jpg');
  });

  test('should return empty array for no matches', async () => {
    const res = await request(app)
      .get('/api/providers/search?q=banana')
      .expect(200);

    expect(res.body).toEqual([]);
  });
});
