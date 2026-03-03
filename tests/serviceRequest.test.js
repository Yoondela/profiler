const request = require('supertest');
const app = require('../app');

const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');

describe('ServiceRequest API', () => {
  let client;
  let provider;
  const geoPoint = (lng, lat) => ({
    type: 'Point',
    coordinates: [lng, lat],
  });

  const auth = (user) => `Bearer test-user-${user._id}`;

  beforeEach(async () => {
    await ServiceRequest.deleteMany({});
    await User.deleteMany({});

    client = await User.create({
      name: 'Client User',
      email: `client-${Date.now()}@test.com`,
    });

    provider = await User.create({
      name: 'Provider User',
      email: `provider-${Date.now()}@test.com`,
      roles: ['provider'],
    });
  });

  test('should create a service request', async () => {
    const res = await request(app)
      .post('/api/service-requests')
      .set('Authorization', auth(client))
      .send({
        client: client._id,
        provider: provider._id,
        serviceType: 'Plumbing',
        forAddress: geoPoint(18.4241, -33.9249),
        note: 'Please come with tools',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.status).toBe('pending');
    expect(res.body.serviceType).toBe('Plumbing');
    expect(res.body.forAddress).toEqual(geoPoint(18.4241, -33.9249));
  });

  test('should return all service requests', async () => {
    await ServiceRequest.create([
      {
        client: client._id,
        provider: provider._id,
        serviceType: 'Plumbing',
        forAddress: geoPoint(18.4241, -33.9249),
      },
      {
        client: client._id,
        provider: provider._id,
        serviceType: 'Cleaning',
        forAddress: geoPoint(28.0473, -26.2041),
      },
    ]);

    const res = await request(app)
      .get('/api/service-requests')
      .set('Authorization', auth(client));

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  test('should get service request by id', async () => {
    const serviceRequest = await ServiceRequest.create({
      client: client._id,
      provider: provider._id,
      serviceType: 'Gardening',
      forAddress: geoPoint(31.0218, -29.8587),
    });

    const res = await request(app)
      .get(`/api/service-requests/${serviceRequest._id}`)
      .set('Authorization', auth(client));

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(serviceRequest._id.toString());
  });

  test('should return service requests for user', async () => {
    await ServiceRequest.create([
      {
        client: client._id,
        provider: provider._id,
        serviceType: 'Cleaning',
        forAddress: geoPoint(31.0218, -29.8587),
      },
      {
        client: provider._id,
        provider: client._id,
        serviceType: 'Plumbing',
        forAddress: geoPoint(18.4241, -33.9249),
      },
    ]);

    const res = await request(app)
      .get(`/api/service-requests/user/${client._id}`)
      .set('Authorization', auth(client));

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test('should update service request status', async () => {
    const serviceRequest = await ServiceRequest.create({
      client: client._id,
      provider: provider._id,
      serviceType: 'Tiling',
      forAddress: geoPoint(28.0473, -26.2041),
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/service-requests/status/${serviceRequest._id}`)
      .set('Authorization', auth(provider))
      .send({ status: 'accepted' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('accepted');
  });
});
