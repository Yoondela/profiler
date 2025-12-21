const { geocodeAddress } = require('../../services/geocodeAddress');

describe('geocodeAddress', () => {
  it('should return lng and lat for a valid address', async () => {
    const result = await geocodeAddress('Cape Town, South Africa');

    expect(result).toHaveProperty('lng');
    expect(result).toHaveProperty('lat');
    expect(typeof result.lng).toBe('number');
    expect(typeof result.lat).toBe('number');
  });

  it('should throw if address is missing', async () => {
    await expect(geocodeAddress()).rejects.toThrow('Address is required');
  });
});
