const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

const User = require('../models/User');
const Profile = require('../models/Profile');
const Portfolio = require('../models/Portfolio');
const Service = require('../models/Service');
const Company = require('../models/Company');

describe('GET /api/providers/search (paginated + city ranking)', () => {
  let providerUser;
  let otherUser;
  let service1;
  let service2;
  let company1;
  let company2;

  beforeAll(async () => {
    // ---------------------------
    // USERS
    // ---------------------------
    providerUser = await User.create({
      name: 'Sam Scholes',
      email: 'sam@test.com',
      roles: ['provider'],
    });

    otherUser = await User.create({
      name: 'John Durban',
      email: 'john@test.com',
      roles: ['provider'],
    });

    // ---------------------------
    // SERVICES
    // ---------------------------
    service1 = await Service.create({
      name: 'Photoshoot',
      slug: 'photoshoot',
    });

    service2 = await Service.create({
      name: 'Editing',
      slug: 'editing',
    });

    // ---------------------------
    // PROFILE
    // ---------------------------
    await Profile.create({
      user: providerUser._id,
      avatarUrl: 'https://test.com/avatar.jpg',
    });

    // ---------------------------
    // COMPANY
    // ---------------------------
    company1 = await Company.create({
      name: 'PhotoCorp',
      owner: providerUser._id,
      address: {
        formatted: 'Cape Town',
        addressComponents: {
          city: 'Cape Town',
        },
        location: {
          type: 'Point',
          coordinates: [18.4241, -33.9249],
        },
      },
    });

    company2 = await Company.create({
      owner: otherUser._id,
      name: 'LSET',
      servicesOffered: [service1._id],
      address: {
        formatted:'Durban, KZN',
        addressComponents: {
          city: 'Durban',
        },
        location: {
          type: 'Point',
          coordinates: [31.0218, -29.8587],
        },
      },
    });

    // ---------------------------
    // PORTFOLIOS
    // ---------------------------
    await Portfolio.create({
      user: providerUser._id,
      company: company1._id,
      servicesOffered: [service1._id, service2._id],
      address: {
        formatted:'Cape Town, Western Cape',
        addressComponents: {
          city: 'Cape Town',
        },
        location: {
          type: 'Point',
          coordinates: [18.4241, -33.9249],
        },
      },
    });

    // lower-ranked (different city)
    await Portfolio.create({
      user: otherUser._id,
      company: company2._id,
      servicesOffered: [service1._id],
      address: {
        formatted:'Durban, KZN',
        addressComponents: {
          city: 'Durban',
        },
        location: {
          type: 'Point',
          coordinates: [31.0218, -29.8587],
        },
      },
    });
  });

  afterAll(async () => {
    await Portfolio.deleteMany();
    await Profile.deleteMany();
    await User.deleteMany();
    await Service.deleteMany();
    await Company.deleteMany();
    await mongoose.connection.close();
  });

  // ---------------------------
  // MAIN TEST
  // ---------------------------
  test('returns paginated providers and ranks by city', async () => {
    const res = await request(app)
      .get('/api/providers/search')
      .query({ q: 'photo', city: 'cape town', page: 1, limit: 10 })
      .expect(200);

    console.log(res.body);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('totalPages');

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBe(2);

    const first = res.body.data[0];
    const second = res.body.data[1];

    // ---------------------------
    // CITY RANKING ASSERTION
    // ---------------------------
    expect(first.name).toBe('PhotoCorp'); // Cape Town first
    expect(second.name).toBe('LSET'); // Durban second

    // ---------------------------
    // SHAPE ASSERTIONS
    // ---------------------------
    expect(first).toHaveProperty('_id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('bannerUrl');
    expect(first).toHaveProperty('servicesOffered');
    expect(first).toHaveProperty('avatarUrl');
    expect(first).toHaveProperty('location');

    // ---------------------------
    // COMPANY LINKING
    // ---------------------------
    expect(first.name).toBe('PhotoCorp');

    // ---------------------------
    // PROFILE DATA
    // ---------------------------
    expect(first.avatarUrl).toBe('https://test.com/avatar.jpg');
  });

  // ---------------------------
  // EMPTY CASE
  // ---------------------------
  test('returns empty data when no matches found', async () => {
    const res = await request(app)
      .get('/api/providers/search')
      .query({ q: 'banana', page: 1, limit: 6 })
      .expect(200);

    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(0);
    expect(res.body.totalPages).toBe(0);
  });
});
