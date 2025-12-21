const axios = require('axios');

const geocodeAddress = async (address) => {
  console.log('Geocoding address:', address);
  if (!address || typeof address !== 'string') {
    throw new Error('Valid address is required for geocoding');
  }

  const response = await axios.get(
    'https://maps.googleapis.com/maps/api/geocode/json',
    {
      params: {
        address,
        key: process.env.GOOGLE_MAPS_GEOCODING_KEY,
      },
    },
  );

  console.log('Geocoding response received');

  const result = response.data.results?.[0];

  if (!result) {
    throw new Error('Address could not be geocoded');
  }

  const { lat, lng } = result.geometry.location;

  console.log('This is the geocoded location:', { lat, lng });

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Invalid coordinates returned from geocoder');
  }

  return { lat, lng };
};

module.exports = { geocodeAddress };
