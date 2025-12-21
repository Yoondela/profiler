const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const { geocodeAddress } = require('../services/geocodeAddress');

const becomeProvider = async (req, res) => {
  console.log('Upgrading user to provider..');
  try {
    const { id } = req.params;
    const { company, address } = req.body;

    // Validate required fields
    if (!company || !address || !address.formatted) {
      return res.status(400).json({ message: 'Company and address are required to become a provider' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Role upgrade (idempotent)
    if (!user.roles.includes('provider')) {
      user.roles.push('provider');
      await user.save();
    }

    let portfolio = await Portfolio.findOne({ user: user._id });

    // Create portfolio once
    if (!portfolio) {
      portfolio = await Portfolio.create({
        user: user._id,
        company,
        address,
        servicesOffered: [],
        bio: '',
        phone: '',
        becameProviderAt: new Date(),
      });
    }

    // Geocode once if address exists and location not yet set
    if (portfolio.address?.formatted && !portfolio.location.coordinates) {
      console.log('Geocoding provider address for the first time...', portfolio.address.formatted);
      const { lng, lat } = await geocodeAddress(
        portfolio.address.formatted,
      );


      portfolio.location = {
        type: 'Point',
        coordinates: [lng, lat],
      };

      await portfolio.save();
    }

    res.status(200).json({
      message: 'User upgraded to provider successfully',
      userRoles: user.roles,
      portfolio,
    });
    console.log('Successful!');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { becomeProvider };
