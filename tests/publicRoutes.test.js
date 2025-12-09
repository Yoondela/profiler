// tests/publicProvider.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Portfolio = require('../models/Portfolio');

describe('GET /api/providers/:id/public', () => {
  let providerUser;
  let profile;
  let portfolio;

  beforeAll(async () => {

    providerUser = await User.create({
      name: 'John Doe',
      email: 'john@test.com',
      roles: ['provider'],
    });

    profile = await Profile.create({
      user: providerUser._id,
      phone: '+27812345678',
      address: '123 Street',
      bio: 'Experienced cleaner',
      avatarUrl: 'https://avatar.com/a.jpg',
    });

    portfolio = await Portfolio.create({
      user: providerUser._id,
      company: 'CleanCo',
      servicesOffered: ['cleaning', 'deep cleaning'],
      otherSkills: ['ironing'],
      logoUrl: 'https://logo.com/logo.png',
      bannerUrl: 'https://banner.com/banner.jpg',
      galleryPhotos: [
        { url: 'https://test.com/1.jpg' },
        { url: 'https://test.com/2.jpg' },
      ],
      email: 'provider@test.com',
      phone: '0812345678',
      address: '456 Main Road',
      bio: 'Professional cleaner with 5 years experience',
      rating: 4.5,
      completedJobs: 27,
    });
  });

  afterAll(async () => {
    await Portfolio.deleteMany();
    await Profile.deleteMany();
    await User.deleteMany();
  });

  test('should return provider public profile with portfolio + profile', async () => {
    const res = await request(app)
      .get(`/api/providers/${providerUser._id}/public`)
      .expect(200);

    // structure
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('profile');
    expect(res.body).toHaveProperty('portfolio');

    // user
    expect(res.body.user.name).toBe('John Doe');
    expect(res.body.user.roles).toContain('provider');

    // profile
    expect(res.body.profile.bio).toBe('Experienced cleaner');
    expect(res.body.profile.phone).toBe('+27812345678');
    expect(res.body.profile.avatarUrl).toBe('https://avatar.com/a.jpg');

    // portfolio
    expect(Array.isArray(res.body.portfolio.galleryPhotos)).toBe(true);
    expect(res.body.portfolio.galleryPhotos.length).toBe(2);
    expect(res.body.portfolio.galleryPhotos[0]).toHaveProperty('url');
  });

  test('should return 404 for non-existing provider', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    await request(app)
      .get(`/api/providers/${fakeId}/public`)
      .expect(404);
  });
});
