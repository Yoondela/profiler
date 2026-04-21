const Company = require('../models/Company');
const Portfolio = require('../models/Portfolio');

const resolveProvider = async (userId) => {
  const company = await Company.findOne({ owner: userId });

  if (company) {
    return {
      provider: company._id,
      providerModel: 'Company',
    };
  }

  const portfolio = await Portfolio.findOne({ user: userId });

  if (!portfolio) {
    throw new Error('Provider profile not found');
  }

  return {
    provider: portfolio._id,
    providerModel: 'Portfolio',
  };
};

module.exports = resolveProvider;
