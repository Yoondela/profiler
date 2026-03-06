const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

const User = require('../models/User');
const Service = require('../models/Service');
const ServiceBooking = require('../models/ServiceBooking');
const { geocodeAddress } = require('../helper/geocodeAddress');

jest.mock('../helper/geocodeAddress', () => ({
  geocodeAddress: jest.fn(),
}));

jest.setTimeout(20000);

describe('ServiceBooking API', () => {
  let client;
  let provider;
  let plumbingService;
  let cleaningService;
  const geoPoint = (lng, lat) => ({
    type: 'Point',
    coordinates: [lng, lat],
  });

  beforeAll(async () => {
    await ServiceBooking.deleteMany({});
    await User.deleteMany({});
    await Service.deleteMany({});

    client = await User.create({
      name: 'Client',
      email: 'client@test.com',
    });

    provider = await User.create({
      name: 'Provider',
      email: 'provider@test.com',
      providerProfile: {
        servicesOffered: [],
        bio: 'Professional',
        phone: '0712345678',
        address: '123 Main St',
        becameProviderAt: new Date(),
      },
    });

    plumbingService = await Service.create({
      name: 'Plumbing',
      slug: 'plumbing',
    });

    cleaningService = await Service.create({
      name: 'Cleaning',
      slug: 'cleaning',
    });
  });

  beforeEach(async () => {
    await ServiceBooking.deleteMany({});
  });

  afterAll(async () => {
    await ServiceBooking.deleteMany({});
    await User.deleteMany({});
    await Service.deleteMany({});
    await mongoose.connection.close();
  });

  it('should create booking and geocode address (East London)', async () => {
    geocodeAddress.mockResolvedValue({
      lng: 27.9116,
      lat: -33.0153,
    });

    const payload = {
      client: client._id,
      provider: provider._id,
      service: 'Plumbing',
      description: 'Fix leaking kitchen sink',
      forDate: new Date(),
      forTime: '10:00 AM',
      forAddress: {
        address: {
          formatted: 'East London, South Africa',
          placeId: 'east-london-place-id',
        },
      },
      note: 'Bring tools',
    };

    const res = await request(app)
      .post('/api/bookings')
      .send(payload);

    expect(res.statusCode).toBe(201);

    expect(geocodeAddress).toHaveBeenCalledWith(
      'East London, South Africa',
    );

    expect(res.body).toHaveProperty('_id');
    expect(res.body.description).toBe(payload.description);
    expect(res.body.status).toBe('pending');

    expect(res.body.forAddress.type).toBe('Point');
    expect(res.body.forAddress.coordinates).toEqual([
      27.9116,
      -33.0153,
    ]);

    const savedBooking = await ServiceBooking.findById(res.body._id);

    expect(savedBooking.forAddress.coordinates).toEqual([
      27.9116,
      -33.0153,
    ]);
  });

  test('should return all bookings', async () => {
    await ServiceBooking.create([
      {
        client: client._id,
        provider: provider._id,
        service: plumbingService._id,
        description: 'Fix sink',
        forDate: new Date(),
        forTime: '10:00 AM',
        forAddress: geoPoint(27.9116, -33.0153),
      },
      {
        client: client._id,
        provider: provider._id,
        service: cleaningService._id,
        description: 'Clean kitchen',
        forDate: new Date(),
        forTime: '11:00 AM',
        forAddress: geoPoint(28.0473, -26.2041),
      },
    ]);

    const res = await request(app).get('/api/bookings');

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toHaveProperty('service');
  });

  test('should get booking by id', async () => {
    const booking = await ServiceBooking.create({
      client: client._id,
      provider: provider._id,
      service: plumbingService._id,
      description: 'Fix sink',
      forDate: new Date(),
      forTime: '10:00 AM',
      forAddress: geoPoint(18.4241, -33.9249),
    });

    const res = await request(app).get(`/api/bookings/${booking._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(booking._id.toString());
  });

  test('should return 404 if booking not found', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app).get(`/api/bookings/${fakeId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Booking not found');
  });

  test('should return bookings for a user', async () => {
    await ServiceBooking.create([
      {
        client: client._id,
        provider: provider._id,
        service: plumbingService._id,
        description: 'Fix sink',
        forDate: new Date(),
        forTime: '10:00 AM',
        forAddress: geoPoint(18.4241, -33.9249),
      },
      {
        client: provider._id,
        provider: client._id,
        service: cleaningService._id,
        description: 'Clean room',
        forDate: new Date(),
        forTime: '11:00 AM',
        forAddress: geoPoint(31.0218, -29.8587),
      },
    ]);

    const res = await request(app).get(`/api/bookings/user/${client._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test('should return upcoming bookings', async () => {
    await ServiceBooking.create([
      {
        client: client._id,
        provider: provider._id,
        service: plumbingService._id,
        description: 'Past booking',
        forDate: new Date(Date.now() - 86400000),
        forTime: '10:00 AM',
        forAddress: geoPoint(18.4241, -33.9249),
      },
      {
        client: client._id,
        provider: provider._id,
        service: cleaningService._id,
        description: 'Upcoming booking',
        forDate: new Date(Date.now() + 86400000),
        forTime: '10:00 AM',
        forAddress: geoPoint(27.9116, -33.0153),
      },
    ]);

    const res = await request(app).get(
      `/api/bookings/user/${client._id}/upcoming`,
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].description).toBe('Upcoming booking');
  });

  test('should return pending bookings', async () => {
    await ServiceBooking.create({
      client: client._id,
      provider: provider._id,
      service: plumbingService._id,
      description: 'Pending booking',
      forDate: new Date(),
      forTime: '10:00 AM',
      forAddress: geoPoint(30.5595, -22.9375),
      status: 'pending',
    });

    const res = await request(app).get('/api/bookings/pending');

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('should filter bookings by client status', async () => {
    await ServiceBooking.create([
      {
        client: client._id,
        provider: provider._id,
        service: plumbingService._id,
        description: 'Accepted job',
        forDate: new Date(),
        forTime: '09:00',
        forAddress: geoPoint(31.0218, -29.8587),
        status: 'accepted',
      },
      {
        client: client._id,
        provider: provider._id,
        service: cleaningService._id,
        description: 'Pending job',
        forDate: new Date(),
        forTime: '11:00',
        forAddress: geoPoint(28.0473, -26.2041),
        status: 'pending',
      },
    ]);

    const res = await request(app)
      .get(`/api/bookings/client/${client._id}?status=accepted`)
      .set('Authorization', `Bearer ${global.testToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].status).toBe('accepted');
  });

  test('should update booking status', async () => {
    const booking = await ServiceBooking.create({
      client: client._id,
      provider: provider._id,
      service: cleaningService._id,
      description: 'Clean room',
      forDate: new Date(),
      forTime: '11:00',
      forAddress: geoPoint(28.0473, -26.2041),
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/bookings/status/${booking._id}`)
      .send({ status: 'accepted' })
      .set('Authorization', `Bearer ${global.testToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('accepted');
  });
});
