const User = require('../models/User');

async function findTopProviders(serviceRequest, options = {}) {
  const limit = options.limit || 10;

  const providers = await User.find({
    roles: 'provider',
    // isOnline: true,
  })
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
