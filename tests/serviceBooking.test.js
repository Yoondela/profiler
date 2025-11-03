const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');
const ServiceBooking = require('../models/ServiceBooking');
const { it } = require('@faker-js/faker');
const Test = require('supertest/lib/test');

jest.setTimeout(20000);

describe('ServiceBooking API', () => {

  beforeAll(async () => {
    // create test client
    clientUser = await User.create({
      name: 'Test Client',
      email: 'client@example.com',
    });

    // create test provider
    providerUser = await User.create({
      name: 'Test Provider',
      email: 'provider@example.com',
      providerProfile: {
        servicesOffered: ['Plumbing'],
        bio: 'Pro Plumber',
        phone: '0712345678',
        address: '123 Main St',
        becameProviderAt: new Date(),
      },
    });
  });

  beforeEach(async () => {
    await ServiceBooking.deleteMany({});
  });

  afterAll(async () => {
    await ServiceBooking.deleteMany({});
    await User.deleteMany({});
  });

  test('should create a new service booking', async () => {
    const bookingPayload = {
      client: clientUser._id.toString(),
      provider: providerUser._id.toString(),
      serviceType: 'Plumbing',
      description: 'Fix leaking kitchen sink',
      forDate: new Date(),
      forTime: '10:00 AM',
      forAddress: '456 Test Lane',
      note: 'Please bring your own tools',
    };

    const res = await request(app)
      .post('/api/bookings')
      .send(bookingPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.serviceType).toBe(bookingPayload.serviceType);
    expect(res.body.description).toBe(bookingPayload.description);
    expect(res.body.status).toBe('pending'); // default
    expect(res.body.client).toBe(clientUser._id.toString());
    expect(res.body.provider).toBe(providerUser._id.toString());

    const saved = await ServiceBooking.findById(res.body._id).lean();
    expect(saved).not.toBeNull();
    expect(saved.description).toBe(bookingPayload.description);
  });

  test('should return all bookings', async () => {
    await ServiceBooking.create([
      {
        client: new mongoose.Types.ObjectId(),
        provider: new mongoose.Types.ObjectId(),
        serviceType: 'Plumbing',
        status: 'pending',
        forDate: new Date(),
        forTime: '10:00 AM',
        forAddress: '123 Main St',
        description: 'Fix sink',
      },
      {
        client: new mongoose.Types.ObjectId(),
        provider: new mongoose.Types.ObjectId(),
        serviceType: 'Cleaning',
        status: 'confirmed',
        forDate: new Date(),
        forTime: '10:00 AM',
        forAddress: '456 Test Ave',
        description: 'Clean kitchen',
      },
    ]);

    const res = await request(app).get('/api/bookings');

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toHaveProperty('serviceType');
  });

  test('should get a booking by id', async () => {
    const booking = await ServiceBooking.create({
      client: new mongoose.Types.ObjectId(),
      provider: new mongoose.Types.ObjectId(),
      serviceType: 'Gardening',
      status: 'pending',
      forDate: new Date(),
      forTime: '10:00 AM',
      forAddress: '123 Main St',
      description: 'Fix sink',
    });

    const res = await request(app).get(`/api/bookings/${booking._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', booking._id.toString());
  });

  test('should return 404 if booking not found', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/bookings/${fakeId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Booking not found');
  });

  test('should return all bookings for a given userId as client or provider', async () => {

    clientUser = await User.create({ name: 'Client', email: 'client@test.com' });
    providerUser = await User.create({ name: 'Provider', email: 'provider@test.com' });

    booking1 = await ServiceBooking.create({
      client: clientUser._id,
      provider: providerUser._id,
      serviceType: 'Plumbing',
      description: 'Fix sink in kitchen',
      forDate: new Date(),
      forTime: '10:00 AM',
      forAddress: '123 Street',
    });

    booking2 = await ServiceBooking.create({
      client: providerUser._id, // swapped roles
      provider: clientUser._id,
      serviceType: 'Cleaning',
      description: 'Clean living room',
      forDate: new Date(),
      forTime: '10:00 AM',
      forAddress: '456 Avenue',
    });

    const res = await request(app)
      .get(`/api/bookings/user/${clientUser._id}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    expect(res.body.length).toBe(2);
    const serviceTypes = res.body.map(b => b.serviceType);
    expect(serviceTypes).toContain('Plumbing');
    expect(serviceTypes).toContain('Cleaning');
  });
});

describe('ServiceBooking API - Get bookings by user', () => {

  let client, provider, pastBooking, upcomingBooking;

  beforeAll(async () => {
    await ServiceBooking.deleteMany({});
    await User.deleteMany({});

    // Create client and provider
    client = await new User({ name: 'Client', email: `client${Date.now()}@test.com` }).save();
    provider = await new User({ name: 'Provider', email: `provider${Date.now()}@test.com` }).save();

    // Create past booking
    pastBooking = await new ServiceBooking({
      client: client._id,
      provider: provider._id,
      serviceType: 'Cleaning',
      description: 'Past booking',
      requestedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      forDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      forTime: '10:00 AM',
      forAddress: '123 Past St',
    }).save();

    // Create upcoming booking
    upcomingBooking = await new ServiceBooking({
      client: client._id,
      provider: provider._id,
      serviceType: 'Plumbing',
      description: 'Upcoming booking',
      requestedAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      forDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      forTime: '10:00 AM',
      forAddress: '456 Future Ave',
    }).save();
  });

  test('should get all bookings for a user', async () => {
    const res = await request(app)
      .get(`/api/bookings/user/${client._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test('should get upcoming bookings for a user', async () => {
    const res = await request(app).get(`/api/bookings/user/${client._id}/upcoming`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].description).toBe('Upcoming booking');
  });

  test('should get past bookings for a user', async () => {
    const res = await request(app).get(`/api/bookings/user/${client._id}/past`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].description).toBe('Past booking');
  });

  test('should get pending bookings', async () => {
    const pendingBooking = await new ServiceBooking({
      client: client._id,
      provider: provider._id,
      serviceType: 'Tiling',
      description: 'Pending booking',
      forDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      forTime: '10:00 AM',
      forAddress: '789 Pending Rd',
      status: 'pending',
    }).save();

    const res = await request(app).get('/api/bookings/pending');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    const descriptions = res.body.map(b => b.description);
    expect(descriptions).toContain('Pending booking');
  });

  test('should return 404 if no bookings found for user', async () => {
    const newUser = await new User({ name: 'NoBookingUser', email: `nobooking${Date.now()}@test.com` }).save();

    const res = await request(app).get(`/api/bookings/user/${newUser._id}`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'No bookings found for this user');
  });
});

describe('GET /bookings/client/:userId filter by status', () => {

  beforeAll(async () => {

    client = await new User({ name: 'Client', email: `client${Date.now()}@test.com` }).save();
    provider = await new User({ name: 'Provider', email: `provider${Date.now()}@test.com` }).save();

    acceptedBooking = await ServiceBooking.create({
      client: client._id,
      provider: provider._id,
      serviceType: 'Plumbing',
      description: 'Fix sink',
      forDate: new Date(),
      forTime: '09:00',
      forAddress: '123 Main St',
      status: 'accepted',
    });

    pendingBooking = await ServiceBooking.create({
      client: client._id,
      provider: provider._id,
      serviceType: 'Cleaning',
      description: 'Clean room',
      forDate: new Date(),
      forTime: '11:00',
      forAddress: '456 High St',
      status: 'pending',
    });
  });

  test('should only return accepted bookings for that client', async () => {

    const res = await request(app)
      .get(`/api/bookings/client/${client._id}?status=accepted`)
      .set('Authorization', `Bearer ${global.testToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].status).toBe('accepted');
    // expect(res.body[0].client).toBe(clientId);
  });
});

describe('GET /bookings/provider/:providerId filter by status', () => {
  let provider, client, acceptedBooking, pendingBooking;

  beforeAll(async () => {
    client = await new User({ name: 'Client', email: `client${Date.now()}@test.com` }).save();
    provider = await new User({ name: 'Provider', email: `provider${Date.now()}@test.com` }).save();

    acceptedBooking = await ServiceBooking.create({
      client: client._id,
      provider: provider._id,
      serviceType: 'Plumbing',
      description: 'Fix sink',
      forDate: new Date(),
      forTime: '09:00',
      forAddress: '123 Main St',
      status: 'accepted',
    });

    pendingBooking = await ServiceBooking.create({
      client: client._id,
      provider: provider._id,
      serviceType: 'Cleaning',
      description: 'Clean room',
      forDate: new Date(),
      forTime: '11:00',
      forAddress: '456 High St',
      status: 'pending',
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await ServiceBooking.deleteMany({});
    await mongoose.connection.close();
  });

  test('should return only accepted bookings for this provider', async () => {
    const res = await request(app)
      .get(`/api/bookings/provider/${provider._id}?status=accepted`)
      .set('Authorization', `Bearer ${global.testToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].status).toBe('accepted');
    expect(res.body[0].provider._id).toBe(provider._id.toString());
  });

  test('should return all bookings for this provider if no status provided', async () => {
    const res = await request(app)
      .get(`/api/bookings/provider/${provider._id}`)
      .set('Authorization', `Bearer ${global.testToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });
});
