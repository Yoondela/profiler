const request = require('supertest');
const app = require('../app');

const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const ServiceReview = require('../models/ServiceReview');
const ProviderReview = require('../models/ProviderReview');
const Company = require('../models/Company');
const Portfolio = require('../models/Portfolio');
const Service = require('../models/Service');
const Profile = require('../models/Profile');

const auth = (user) => `Bearer ${user.auth0Id}`;

let client, providerUser, company, portfolio, profile, completedRequest;

// Stored (DB shape)
const mockStoredAddress = () => ({
  formatted: 'Test Address',
  placeId: 'test-id',
  addressComponents: {
    street: '123 Test St',
    suburb: 'Test Suburb',
    city: 'Test City',
    province: 'Test Province',
    postalCode: '0000',
    country: 'South Africa',
  },
  location: {
    type: 'Point',
    coordinates: [31.0, -29.0],
  },
});

describe('Provider Review Routes', () => {

  beforeEach(async () => {
    await ServiceReview.deleteMany({});
    await User.deleteMany({});
    await Company.deleteMany({});
    await Portfolio.deleteMany({});
    await Profile.deleteMany({});
    await ProviderReview.deleteMany({});

    client = await User.create({
      name: 'Client',
      email: `client-${Date.now()}@test.com`,
      auth0Id: `auth0|client-${Date.now()}`,
    });

    providerUser = await User.create({
      name: 'Provider',
      email: `provider-${Date.now()}@test.com`,
      auth0Id: `auth0|provider-${Date.now()}`,
    });

    // BOTH exist → company should win
    company = await Company.create({
      owner: providerUser._id,
      address: mockStoredAddress(),
      name: 'CleanCo',
    });

    portfolio = await Portfolio.create({
      user: providerUser._id,
      address: mockStoredAddress(),
    });
  });

  test('should create a provider review', async () => {
    const res = await request(app)
      .post('/api/reviews/provider')
      .set('Authorization', auth(providerUser))
      .send({
        comment: 'Amazing service overall',
        rating: 5,
      });

    console.log('res:', res.body);


    expect(res.statusCode).toBe(201);
  });

  test('should not allow more than 3 featured reviews', async () => {
    await ProviderReview.create([
      {
        provider: company._id,
        isFeatured: true,
        reviewer: client._id,
        providerModel: 'Company',
        comment: 'Top tier',
        rating: 5,
      },
      {
        provider: company._id,
        reviewer: client._id,
        providerModel: 'Company',
        isFeatured: true,
        comment: 'Excellent every time',
        rating: 5,
      },
      {
        provider: company._id,
        isFeatured: true,
        providerModel: 'Portfolio',
        comment: 'Highly recommend',
        reviewer: client._id,
        rating: 5,
      },
    ]);

    const lastReview = await ProviderReview.create({
      provider: company._id,
      providerModel: 'Company',
      comment: 'Will use again',
      rating: 5,
      reviewer: client._id,
      isFeatured: false,
    });

    const res = await request(app)
      .patch(`/api/reviews/provider/${lastReview._id}/feature`)
      .set('Authorization', auth(providerUser))
      .send({ isFeatured: true });

    console.log('res:', res.body);
    expect(res.statusCode).toBe(400);
  });

  test('should return provider reviews for public page', async () => {
    await ProviderReview.create([
      {
        provider: company._id,
        providerModel: 'Company',
        comment: 'Top tier',
        rating: 5,
        reviewer: client._id,
        isFeatured: true,
      },
    ]);

    const res = await request(app)
      .get(`/api/reviews/provider/p/${company._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });
});
