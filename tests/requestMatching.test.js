const User = require('../models/User');
const matchingService = require('../services/matchingService');

describe('matchingService.findTopProviders', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  test('returns at most 10 online providers with correct structure', async () => {
    // 12 online providers
    const onlineProviders = Array.from({ length: 12 }, (_, i) => ({
      name: `Provider ${i}`,
      email: `provider-${i}-${Date.now()}@test.com`,
      roles: ['provider'],
      isOnline: true,
    }));

    // 3 offline providers (should NOT be included)
    const offlineProviders = Array.from({ length: 3 }, (_, i) => ({
      name: `Offline ${i}`,
      email: `offline-${i}-${Date.now()}@test.com`,
      roles: ['provider'],
      isOnline: false,
    }));

    // 3 clients (should NOT be included)
    const clients = Array.from({ length: 3 }, (_, i) => ({
      name: `Client ${i}`,
      email: `client-${i}-${Date.now()}@test.com`,
      roles: ['client'],
      isOnline: true,
    }));

    await User.collection.insertMany([
      ...onlineProviders,
      ...offlineProviders,
      ...clients,
    ]);

    const fakeRequest = { service: 'anything' };

    const results = await matchingService.findTopProviders(fakeRequest);

    expect(results).toHaveLength(10);

    results.forEach((r) => {
      expect(r).toHaveProperty('providerId');
    });
  });
});
