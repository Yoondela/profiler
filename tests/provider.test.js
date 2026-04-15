const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

const User = require('../models/User');
const Portfolio = require('../models/Portfolio');

jest.mock('../helper/geocodeAddress', () => ({
  geocodeAddress: jest.fn(),
}));

const { geocodeAddress } = require('../helper/geocodeAddress');

// ---------------------------
// HELPERS
// ---------------------------
const VALID_ADDRESS = {
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
};

const upgradeToProvider = (userId, address = VALID_ADDRESS) => {
  return request(app)
    .patch(`/api/users/${userId}/upgrade-to-provider`)
    .send({ address });
};

const upgradeWithNoAddress = (userId, address = undefined) => {
  return request(app)
    .patch(`/api/users/${userId}/upgrade-to-provider`)
    .send({ address });
};
// ---------------------------
// TEST SUITE
// ---------------------------
describe('Become Provider API', () => {
  let user;

  beforeEach(async () => {
    await User.deleteMany({});
    await Portfolio.deleteMany({});

    user = await User.create({
      name: 'Test User',
      email: `test${Date.now()}@mail.com`,
      auth0Id: `auth0|${Date.now()}`, // ✅ important if auth is used
    });

    jest.clearAllMocks();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ---------------------------
  // SUCCESS CASES
  // ---------------------------
  describe('Success flow', () => {
    it('creates portfolio and geocodes address', async () => {
      geocodeAddress.mockResolvedValue({
        lng: 18.4241,
        lat: -33.9249,
      });

      const res = await upgradeToProvider(user._id);

      console.log(res.body)
      expect(res.statusCode).toBe(200);

      expect(geocodeAddress).toHaveBeenCalledTimes(1);
      expect(geocodeAddress).toHaveBeenCalledWith(
        VALID_ADDRESS.address,
      );

      expect(res.body.portfolio).toBeDefined();
      expect(res.body.portfolio.address.location.coordinates).toEqual([
        18.4241,
        -33.9249,
      ]);

      expect(res.body.userRoles).toContain('provider');
    });

    it('is idempotent: does not recreate portfolio', async () => {
      geocodeAddress.mockResolvedValue({
        lng: 18.4241,
        lat: -33.9249,
      });

      const firstRes = await upgradeToProvider(user._id);
      const firstDate = firstRes.body.portfolio.becameProviderAt;

      const secondRes = await upgradeToProvider(user._id);
      const secondDate = secondRes.body.portfolio.becameProviderAt;

      expect(secondRes.statusCode).toBe(200);
      expect(secondDate).toBe(firstDate);

      const portfolios = await Portfolio.find({ user: user._id });
      expect(portfolios.length).toBe(1);
    });
  });

  // ---------------------------
  // VALIDATION CASES
  // ---------------------------
  describe('Validation', () => {
    it('rejects request without address', async () => {
      const res = await upgradeWithNoAddress(user._id, undefined);

      console.log(res.body)
      expect(res.statusCode).toBe(400);
    });

    it('rejects request with invalid address format', async () => {
      const res = await upgradeToProvider(user._id, {});

      expect(res.statusCode).toBe(400);
    });
  });

  // ---------------------------
  // EDGE CASES
  // ---------------------------
  describe('Edge cases', () => {
    it('returns 404 if user does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await upgradeToProvider(fakeId);

      expect(res.statusCode).toBe(404);
    });
  });
});
