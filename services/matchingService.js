const User = require('../models/User');

async function findTopProviders(currentProviderId, options = {}) {
  const limit = options.limit || 10;

  const query = { roles: 'provider' };

  if (currentProviderId) {
    query._id = { $ne: currentProviderId };
  }

  const providers = await User.find(query)
    .limit(limit)
    .select('user');

  console.log('Found: ', providers);

  return providers.map((p) => ({
    providerId: p._id,
  }));
}

module.exports = {
  findTopProviders,
};
