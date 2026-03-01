const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

const User = require('../models/User');
const Profile = require('../models/Profile');
const Portfolio = require('../models/Portfolio');
const Service = require('../models/Service');

describe('GET /api/providers/search (paginated)', () => {
  let providerUser;
  let service1;
  let service2;

  beforeAll(async () => {
    providerUser = await User.create({
      name: 'Sam Scholes',
      email: 'sam@test.com',
      roles: ['provider'],
    });

    service1 = await Service.create({
      name: 'Photoshoot',
      slug: 'photoshoot',
    });

    service2 = await Service.create({
      name: 'Editing',
      slug: 'editing',
    });

    await Profile.create({
      user: providerUser._id,
      avatarUrl: 'https://test.com/avatar.jpg',
    });

    await Portfolio.create({
      user: providerUser._id,
      servicesOffered: [service1._id, service2._id],
    });
  });

  afterAll(async () => {
    await Portfolio.deleteMany();
    await Profile.deleteMany();
    await User.deleteMany();
    await Service.deleteMany();
  });

  test('returns paginated providers matching query', async () => {
    const res = await request(app)
      .get('/api/providers/search')
      .query({ q: 'photo', page: 1, limit: 6 })
      .expect(200);

    console.log('Search response:', res.body);

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
    // expect()
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
