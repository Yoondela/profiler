const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Company = require('../models/Company');

const getPortfolio = async (req, res) => {
  console.log('Getting Portfolio');

  try {
    const providerId = req.params.providerId;

    const portfolio = await Portfolio.findOne({ user: providerId })
      .populate({
        path: 'user',
        populate: {
          path: 'profile',
          model: 'Profile',
        },
      })
      .populate('company')
      .populate('servicesOffered');

    if (!portfolio) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    console.log(portfolio);

    console.log('Successfull!');
    return res.status(200).json(portfolio);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updatePortfolio = async (req, res) => {
  console.log('Updating Provider');

  try {
    const { providerId } = req.params;
    const updates = req.body;

    const portfolio = await Portfolio.findOne({ user: providerId });
    if (!portfolio) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const company = await Company.findOne({ owner: providerId });

    // 🔑 company takes precedence
    const target = company || portfolio;

    const allowedFields = [
      'displayName',
      'name',
      'servicesOffered',
      'otherSkills',
      'logoUrl',
      'bannerUrl',
      'about',
      'bio',
      'phone',
      'email',
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        target[field] = updates[field];
      }
    });

    await target.save();

    return res.status(200).json({
      type: company ? 'company' : 'portfolio',
      data: target,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


module.exports = { getPortfolio, updatePortfolio };
