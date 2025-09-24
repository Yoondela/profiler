const request = require('supertest');
const app = require('../index');
const mongoose = require('mongoose');
const User = require('../models/User');
const ServiceBooking = require('../models/ServiceBooking');

jest.setTimeout(20000);

describe('ServiceBooking API', () => {
    
  beforeAll(async () => {
    // create test client
    clientUser = await User.create({
      name: 'Test Client',
      email: 'client@example.com'
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
        becameProviderAt: new Date()
      }
    });
  });

  beforeEach(async () => {
    await mongoose.connection.collection('servicebookings').deleteMany({});
  })

  afterAll(async () => {
    await mongoose.connection.collection('servicebookings').deleteMany({});
    await mongoose.connection.collection('users').deleteMany({});
  });

  it('should create a new service booking', async () => {
    const bookingPayload = {
        client: clientUser._id.toString(),
        provider: providerUser._id.toString(),
        serviceType: 'Plumbing',
        description: 'Fix leaking kitchen sink',
        forDate: new Date(),
        forAddress: '456 Test Lane',
        note: 'Please bring your own tools'
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
  })

  it('should return all bookings', async () => {
    await ServiceBooking.create([
      {
        client: new mongoose.Types.ObjectId(),
        provider: new mongoose.Types.ObjectId(),
        serviceType: 'Plumbing',
        status: 'pending',
        forDate: new Date(),
        forAddress: '123 Main St',
        description: 'Fix sink'
      },
      {
        client: new mongoose.Types.ObjectId(),
        provider: new mongoose.Types.ObjectId(),
        serviceType: 'Cleaning',
        status: 'confirmed',
        forDate: new Date(),
        forAddress: '456 Test Ave',
        description: 'Clean kitchen'
      },
    ]);
  
    const res = await request(app).get('/api/bookings');

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toHaveProperty('serviceType');
  });
  
  it('should get a booking by id', async () => {
    const booking = await ServiceBooking.create({
      client: new mongoose.Types.ObjectId(),
      provider: new mongoose.Types.ObjectId(),
      serviceType: 'Gardening',
      status: 'pending',
      forDate: new Date(),
      forAddress: '123 Main St',
      description: 'Fix sink',
    })

    const res = await request(app).get(`/api/bookings/${booking._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', booking._id.toString());
  })

  it('should return 404 if booking not found', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/bookings/${fakeId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Booking not found');
  });

  it('should return all bookings for a given userId as client or provider', async () => {

    clientUser = await User.create({ name: 'Client', email: 'client@test.com' });
    providerUser = await User.create({ name: 'Provider', email: 'provider@test.com' });

    booking1 = await ServiceBooking.create({
      client: clientUser._id,
      provider: providerUser._id,
      serviceType: 'Plumbing',
      description: 'Fix sink in kitchen',
      forDate: new Date(),
      forAddress: '123 Street',
    });

    booking2 = await ServiceBooking.create({
      client: providerUser._id, // swapped roles
      provider: clientUser._id,
      serviceType: 'Cleaning',
      description: 'Clean living room',
      forDate: new Date(),
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
  })
})

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
      forAddress: '123 Past St'
    }).save();

    // Create upcoming booking
    upcomingBooking = await new ServiceBooking({
      client: client._id,
      provider: provider._id,
      serviceType: 'Plumbing',
      description: 'Upcoming booking',
      requestedAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      forDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      forAddress: '456 Future Ave'
    }).save();
  });

  afterAll(async () => {
    await ServiceBooking.deleteMany({});
    await User.deleteMany({});
  });

  it('should get all bookings for a user', async () => {
    const res = await request(app)
      .get(`/api/bookings/user/${client._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('should get upcoming bookings for a user', async () => {
    const res = await request(app).get(`/api/bookings/user/${client._id}/upcoming`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].description).toBe('Upcoming booking');
  });

  it('should get past bookings for a user', async () => {
    const res = await request(app).get(`/api/bookings/user/${client._id}/past`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].description).toBe('Past booking');
  });
});

describe('ServiceBooking API - Update a booking', () => {

  let client, provider, booking;

  beforeAll(async () => {
    await ServiceBooking.deleteMany({});
    await User.deleteMany({});

    // Create client and provider
    client = await new User({ name: 'Client', email: `client${Date.now()}@test.com` }).save();
    provider = await new User({ name: 'Provider', email: `provider${Date.now()}@test.com` }).save();

    booking = await ServiceBooking.create({
      client: client,
      provider: provider,
      serviceType: 'Plumbing',
      description: 'Fix kitchen sink leaking',
      forDate: new Date(),
      forAddress: '123 Main St',
    });

  });
  afterAll(async () => {
    await ServiceBooking.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  it('should update a booking status', async () => {
    const res = await request(app)
    .patch(`/api/bookings/status/${booking._id}`)
      .send({ status: 'accepted' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', booking._id.toString());
    expect(res.body.status).toBe('accepted');
  });

  it('should update editable booking fields', async () => {
    const booking = await ServiceBooking.create({
      client: new mongoose.Types.ObjectId(),
      provider: new mongoose.Types.ObjectId(),
      serviceType: 'Plumbing',
      description: 'Fix leaking sink',
      forDate: new Date(),
      forAddress: '123 Main St',
    });
 
    const res = await request(app)
      .patch(`/api/bookings/${booking._id}`)
      .send({
        description: 'Fix leaking bathroom tap',
        note: 'Bring extra washers',
        forDate: new Date('2025-10-01'),
        forAddress: '456 Elm St',
        serviceType: 'Cleaning',
      });
  
    expect(res.statusCode).toBe(200);
    expect(res.body.description).toBe('Fix leaking bathroom tap');
    expect(res.body.note).toBe('Bring extra washers');
    expect(new Date(res.body.forDate)).toEqual(new Date('2025-10-01'));
    expect(res.body.forAddress).toBe('456 Elm St');
    expect(res.body.serviceType).toBe('Cleaning');
  });
});