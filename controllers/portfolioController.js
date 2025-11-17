const User = require('../models/User');
const Portfolio = require('../models/Portfolio');

const getPortfolio = async (req, res) => {
  console.log('Getting Portfolio');
  try {
    const providerId = req.params.providerId;

    const portfolio = await Portfolio.findOne({user: providerId})
      .populate({
        path: 'user',
        populate: {
          path: 'profile',
          model: 'Profile',
        },
      });

    if (!portfolio) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    console.log('Successfull!');
    return res.status(200).json(portfolio);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updatePortfolio = async (req, res) => {
  console.log('Updating Portfolio');
  try {
    const { providerId } = req.params;
    console.log('params', req.params);
    const updates = req.body;

    console.log(updates);

    // get user
    const portfolio = await Portfolio.findOne({user: providerId});
    if (!portfolio) return res.status(404).json({ message: 'Provider not found' });

    // iterate only keys sent -> update nested providerProfile
    Object.keys(updates).forEach((key) => {
      portfolio[key] = updates[key];
    });

    await portfolio.save();

    console.log('Successful!');

    return res.status(200).json(portfolio);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getPortfolio, updatePortfolio };
