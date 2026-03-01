const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

const User = require('../models/User');
const Service = require('../models/Service');
const ServiceBooking = require('../models/ServiceBooking');

jest.setTimeout(20000);

describe('ServiceBooking API', () => {
  let client;
  let provider;
  let plumbingService;
  let cleaningService;

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

  test('should create a new booking', async () => {
    const payload = {
      client: client._id,
      provider: provider._id,
      service: plumbingService._id,
      description: 'Fix leaking kitchen sink',
      forDate: new Date(),
      forTime: '10:00 AM',
      forAddress: '456 Test Lane',
      note: 'Bring tools',
    };

    const res = await request(app)
      .post('/api/bookings')
      .send(payload);

    console.log('Create booking response:', res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.service).toBe(plumbingService._id.toString());
    expect(res.body.description).toBe(payload.description);
    expect(res.body.status).toBe('pending');
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
        forAddress: '123 Main St',
      },
      {
        client: client._id,
        provider: provider._id,
        service: cleaningService._id,
        description: 'Clean kitchen',
        forDate: new Date(),
        forTime: '11:00 AM',
        forAddress: '456 Ave',
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
      forAddress: '123 Street',
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
        forAddress: '123 Street',
      },
      {
        client: provider._id,
        provider: client._id,
        service: cleaningService._id,
        description: 'Clean room',
        forDate: new Date(),
        forTime: '11:00 AM',
        forAddress: '456 Ave',
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
        forAddress: 'Past St',
      },
      {
        client: client._id,
        provider: provider._id,
        service: cleaningService._id,
        description: 'Upcoming booking',
        forDate: new Date(Date.now() + 86400000),
        forTime: '10:00 AM',
        forAddress: 'Future Ave',
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
      forAddress: '789 Road',
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
        forAddress: '123 Main',
        status: 'accepted',
      },
      {
        client: client._id,
        provider: provider._id,
        service: cleaningService._id,
        description: 'Pending job',
        forDate: new Date(),
        forTime: '11:00',
        forAddress: '456 High',
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
      forAddress: '456 High St',
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
