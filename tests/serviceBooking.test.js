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
    await mongoose.connection.close();
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