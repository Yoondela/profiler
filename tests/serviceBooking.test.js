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

// ---------------------------
// HELPERS
// ---------------------------

// Incoming (frontend → API)
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

describe('ServiceBooking API', () => {
  let client;
  let provider;

  beforeAll(async () => {
    await ServiceBooking.deleteMany({});
    await User.deleteMany({});
    await Service.deleteMany({});

    client = await User.create({
      name: 'Client',
      email: 'client@test.com',
      auth0Id: 'auth0|client',
    });

    provider = await User.create({
      name: 'Provider',
      email: 'provider@test.com',
      auth0Id: 'auth0|provider',
      roles: ['provider'],
    });
  });

  beforeEach(async () => {
    await ServiceBooking.deleteMany({});
    geocodeAddress.mockResolvedValue({
      lng: 31.0218,
      lat: -29.8587,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ---------------------------
  // CREATE
  // ---------------------------
  it('should create booking and geocode address', async () => {
    const payload = {
      client: client._id,
      provider: provider._id,
      service: 'Plumbing',
      description: 'Fix leaking kitchen sink',
      forDate: new Date(),
      forTime: '10:00 AM',
      forAddress: mockGoogleAddressInput(),
      note: 'Bring tools',
    };

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${client.auth0Id}`)
      .send(payload);

    expect(res.statusCode).toBe(201);

    expect(geocodeAddress).toHaveBeenCalledWith(
      payload.forAddress.address,
    );

    expect(res.body).toHaveProperty('_id');
    expect(res.body.status).toBe('searching');

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
  test('should return all bookings', async () => {
    await ServiceBooking.create([
      {
        client: client._id,
        provider: provider._id,
        service: new mongoose.Types.ObjectId(),
        description: 'Fix sink',
        forDate: new Date(),
        forTime: '10:00 AM',
        forAddress: mockStoredAddress(),
      },
      {
        client: client._id,
        provider: provider._id,
        service: new mongoose.Types.ObjectId(),
        description: 'Clean kitchen',
        forDate: new Date(),
        forTime: '11:00 AM',
        forAddress: mockStoredAddress(),
      },
    ]);

    const res = await request(app).get('/api/bookings');

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });

  // ---------------------------
  // GET BY ID
  // ---------------------------
  test('should get booking by id', async () => {
    const booking = await ServiceBooking.create({
      client: client._id,
      provider: provider._id,
      service: new mongoose.Types.ObjectId(),
      description: 'Fix sink',
      forDate: new Date(),
      forTime: '10:00 AM',
      forAddress: mockStoredAddress(),
    });

    const res = await request(app).get(`/api/bookings/${booking._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(booking._id.toString());
  });

  test('should return 404 if booking not found', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app).get(`/api/bookings/${fakeId}`);

    expect(res.statusCode).toBe(404);
  });

  // ---------------------------
  // GET BY USER
  // ---------------------------
  test('should return bookings for a user', async () => {
    await ServiceBooking.create([
      {
        client: client._id,
        provider: provider._id,
        service: new mongoose.Types.ObjectId(),
        forDate: new Date(),
        forTime: '10:00 AM',
        forAddress: mockStoredAddress(),
      },
      {
        client: provider._id,
        provider: client._id,
        service: new mongoose.Types.ObjectId(),
        forDate: new Date(),
        forTime: '11:00 AM',
        forAddress: mockStoredAddress(),
      },
    ]);

    const res = await request(app).get(`/api/bookings/user/${client._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });

  // ---------------------------
  // UPCOMING
  // ---------------------------
  test('should return upcoming bookings', async () => {
    await ServiceBooking.create([
      {
        client: client._id,
        service: new mongoose.Types.ObjectId(),
        forDate: new Date(Date.now() - 86400000),
        forTime: '10:00 AM',
        forAddress: mockStoredAddress(),
      },
      {
        client: client._id,
        service: new mongoose.Types.ObjectId(),
        description: 'Upcoming booking',
        forDate: new Date(Date.now() + 86400000),
        forTime: '10:00 AM',
        forAddress: mockStoredAddress(),
      },
    ]);

    const res = await request(app).get(
      `/api/bookings/user/${client._id}/upcoming`,
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });

  // ---------------------------
  // STATUS FILTER
  // ---------------------------
  test('should filter bookings by client status', async () => {
    await ServiceBooking.create([
      {
        client: client._id,
        service: new mongoose.Types.ObjectId(),
        status: 'accepted',
        forDate: new Date(),
        forTime: '09:00',
        forAddress: mockStoredAddress(),
      },
      {
        client: client._id,
        service: new mongoose.Types.ObjectId(),
        status: 'searching',
        forDate: new Date(),
        forTime: '11:00',
        forAddress: mockStoredAddress(),
      },
    ]);

    const res = await request(app)
      .get(`/api/bookings/client/${client._id}?status=accepted`)
      .set('Authorization', `Bearer ${client.auth0Id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });

  // ---------------------------
  // UPDATE STATUS
  // ---------------------------
  test('should update booking status', async () => {
    const booking = await ServiceBooking.create({
      client: client._id,
      service: new mongoose.Types.ObjectId(),
      status: 'searching',
      forDate: new Date(),
      forTime: '11:00',
      forAddress: mockStoredAddress(),
    });

    const res = await request(app)
      .patch(`/api/bookings/status/${booking._id}`)
      .set('Authorization', `Bearer ${provider.auth0Id}`)
      .send({status: 'accepted'});

    console.log(res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('accepted');
  });
});
