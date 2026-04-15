const request = require('supertest');
const app = require('../app');

const User = require('../models/User');
const Service = require('../models/Service');
const ServiceRequest = require('../models/ServiceRequest');

// ---------------------------
// MOCKS
// ---------------------------
jest.mock('../helper/geocodeAddress', () => ({
  geocodeAddress: jest.fn(),
}));

const { geocodeAddress } = require('../helper/geocodeAddress');

// ---------------------------
// HELPERS
// ---------------------------
const mockGoogleAddressInput = () => ({
  address: '56 Hendry Rd, Morningside, Berea, 4001, South Africa',
  placeId: 'test-place-id',
  addressComponents: [
    { long_name: '56', types: ['street_number'] },
    { long_name: 'Hendry Road', types: ['route'] },
    { long_name: 'Morningside', types: ['sublocality'] },
    { long_name: 'Berea', types: ['locality'] },
    { long_name: 'KwaZulu-Natal', types: ['administrative_area_level_1'] },
    { long_name: '4001', types: ['postal_code'] },
    { long_name: 'South Africa', types: ['country'] },
  ],
});

const auth = (user) => `Bearer ${user.auth0Id}`;

// ---------------------------
// TEST SUITE
// ---------------------------
describe('ServiceRequest API (with structured address)', () => {
  let client;
  let provider;
  let plumbingService;

  beforeEach(async () => {
    await ServiceRequest.deleteMany({});
    await User.deleteMany({});
    await Service.deleteMany({});
    await ServiceRequest.collection.dropIndexes().catch(() => {});

    // Mock geocode result
    geocodeAddress.mockResolvedValue({
      lng: 31.0218,
      lat: -29.8587,
    });

    client = await User.create({
      name: 'Client User',
      email: `client-${Date.now()}@test.com`,
      auth0Id: `auth0|client-${Date.now()}`,
    });

    provider = await User.create({
      name: 'Provider User',
      email: `provider-${Date.now()}@test.com`,
      roles: ['provider'],
      auth0Id: `test-user-provider-${Date.now()}`,
    });

    plumbingService = await Service.create({
      name: 'Plumbing',
      slug: `plumbing-${Date.now()}`,
    });
  });

  // ---------------------------
  // CREATE
  // ---------------------------
  test('should create a service request with parsed + geocoded address', async () => {
    const res = await request(app)
      .post('/api/service-requests')
      .set('Authorization', auth(client))
      .send({
        client: client._id,
        service: plumbingService.name, // matches your slugify logic
        description: 'Fix leaking pipe',
        forAddress: mockGoogleAddressInput(),
        note: 'Urgent',
      });

    expect(res.statusCode).toBe(201);

    expect(res.body).toHaveProperty('_id');

    // 🔥 Address assertions (this is the important part)
    expect(res.body.forAddress).toHaveProperty('formatted');
    expect(res.body.forAddress).toHaveProperty('placeId');

    expect(res.body.forAddress.addressComponents).toMatchObject({
      street: '56 Hendry Road',
      suburb: 'Morningside',
      city: 'Berea',
      province: 'KwaZulu-Natal',
      postalCode: '4001',
      country: 'South Africa',
    });

    expect(res.body.forAddress.location).toEqual({
      type: 'Point',
      coordinates: [31.0218, -29.8587],
    });
  });

  // ---------------------------
  // GET ALL
  // ---------------------------
  test('should return all service requests', async () => {
    await ServiceRequest.create({
      client: client._id,
      service: plumbingService._id,
      forAddress: {
        formatted: 'Test Address',
        placeId: 'x',
        addressComponents: {
          street: 'Test',
          suburb: 'Test',
          city: 'Test',
          province: 'Test',
          postalCode: '0000',
          country: 'South Africa',
        },
        location: {
          type: 'Point',
          coordinates: [31.0, -29.0],
        },
      },
    });

    const res = await request(app)
      .get('/api/service-requests')
      .set('Authorization', auth(client));

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ---------------------------
  // GET BY ID
  // ---------------------------
  test('should get service request by id', async () => {
    const sr = await ServiceRequest.create({
      client: client._id,
      service: plumbingService._id,
      forAddress: {
        formatted: 'Test Address',
        placeId: 'x',
        addressComponents: {},
        location: {
          type: 'Point',
          coordinates: [31.0, -29.0],
        },
      },
    });

    const res = await request(app)
      .get(`/api/service-requests/${sr._id}`)
      .set('Authorization', auth(client));

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(sr._id.toString());
  });

  // ---------------------------
  // GET BY USER
  // ---------------------------
  test('should return service requests for user', async () => {
    await ServiceRequest.create([
      {
        client: client._id,
        service: plumbingService._id,
        forAddress: {
          formatted: 'A',
          placeId: 'a',
          addressComponents: {},
          location: {
            type: 'Point',
            coordinates: [31.0, -29.0],
          },
        },
      },
      {
        client: provider._id,
        provider: client._id,
        service: plumbingService._id,
        forAddress: {
          formatted: 'B',
          placeId: 'b',
          addressComponents: {},
          location: {
            type: 'Point',
            coordinates: [31.1, -29.1],
          },
        },
      },
    ]);

    const res = await request(app)
      .get(`/api/service-requests/user/${client._id}`)
      .set('Authorization', auth(client));

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });

  // ---------------------------
  // UPDATE STATUS
  // ---------------------------
  test('should update service request status', async () => {
    const sr = await ServiceRequest.create({
      client: client._id,
      service: plumbingService._id,
      status: 'searching',
      forAddress: {
        formatted: 'Test Address',
        placeId: 'x',
        addressComponents: {},
        location: {
          type: 'Point',
          coordinates: [31.0, -29.0],
        },
      },
    });

    const res = await request(app)
      .patch(`/api/service-requests/status/${sr._id}`)
      .set('Authorization', auth(provider));

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('accepted');
  });
});
