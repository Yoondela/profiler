const request = require('supertest');
const app = require('../app');

const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const ServiceReview = require('../models/ServiceReview');
const Company = require('../models/Company');
const Portfolio = require('../models/Portfolio');
const Service = require('../models/Service');

const auth = (user) => `Bearer ${user.auth0Id}`;

let client, providerUser, company, portfolio, service, completedRequest;

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

describe('Service Review Routes', () => {

  beforeEach(async () => {
    await ServiceReview.deleteMany({});
    await ServiceRequest.deleteMany({});
    await User.deleteMany({});
    await Company.deleteMany({});
    await Portfolio.deleteMany({});
    await Service.deleteMany({});

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

    service = await Service.create({
      name: 'Plumbing',
      slug: `plumbing-${Date.now()}`,
    });

    completedRequest = await ServiceRequest.create({
      client: client._id,
      service: service._id,
      provider: providerUser._id,
      forAddress: mockStoredAddress(),
      status: 'completed',
    });
  });


  test('should attach review to company if company exists', async () => {
    const res = await request(app)
      .post('/api/reviews/service')
      .set('Authorization', auth(client))
      .send({
        serviceRequest: completedRequest._id,
        rating: 5,
        review: 'Great job',
      });

    console.log("res:", res.body);


    expect(res.statusCode).toBe(201);

    expect(res.body.provider).toBe(company._id.toString());
    expect(res.body.providerModel).toBe('Company');
  });

  test('should not allow review for incomplete request', async () => {
    const pending = await ServiceRequest.create({
      client: client._id,
      provider: providerUser._id,
      service: service._id,
      forAddress: mockStoredAddress(),
      status: 'pending',
    });

    const res = await request(app)
      .post('/api/reviews/service')
      .set('Authorization', auth(client))
      .send({
        serviceRequest: pending._id,
        rating: 4,
      });

    expect(res.statusCode).toBe(400);
  });

  test('should not allow duplicate review per service request', async () => {
    await ServiceReview.create({
      reviewer: client._id,
      provider: company._id,
      providerModel: 'Company',
      serviceRequest: completedRequest._id,
      rating: 4,
    });

    const res = await request(app)
      .post('/api/reviews/service')
      .set('Authorization', auth(client))
      .send({
        serviceRequest: completedRequest._id,
        rating: 5,
      });

    expect(res.statusCode).toBe(400);
  });

  test('should return average rating for provider', async () => {
    const secondRequest = await ServiceRequest.create({
      client: client._id,
      forAddress: mockStoredAddress(),
      provider: providerUser._id,
      service: service._id,
      status: 'completed',
    });

    await ServiceReview.create([
      {
        reviewer: client._id,
        provider: company._id,
        service: service._id,
        providerModel: 'Company',
        serviceRequest: completedRequest._id,
        rating: 4,
      },
      {
        reviewer: client._id,
        provider: company._id,
        providerModel: 'Company',
        serviceRequest: secondRequest._id,
        rating: 2,
      },
    ]);
  
    const res = await request(app)
      .get(`/api/reviews/service/provider/${company._id}/stats`)
      .set('Authorization', auth(client));
  
    console.log("res:", res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body.avgRating).toBeCloseTo(3);
  });
});