const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const { geocodeAddress } = require('../helper/geocodeAddress');
const { parseGoogleAddress } = require('../helper/parseGoogleAddress');

const becomeProvider = async (req, res) => {
  console.log('Upgrading user to provider..');
  try {
    const { id } = req.params;
    const { company, address } = req.body;

    console.log(req.body);

    // Validate required fields
    if (!address || !address.formatted || !address.addressComponents) {
      return res.status(400).json({
        message: 'Company name and address are required',
      });
    }

    console.log("parsing")
    
    const parsed = parseGoogleAddress({
      formatted_address: address.formatted,
      place_id: address.placeId,
      address_components: address.addressComponents,
    });

    console.log("geocoding")

    const { lng, lat } = await geocodeAddress(address?.formatted);

    const finalAddress = {
      formatted: parsed.formatted, // ✅ STRING
      placeId: parsed.placeId,
      addressComponents: parsed.addressComponents,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
    };
  

    console.log('Final address:', finalAddress);


    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log("user found", user)
    
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
        address: finalAddress,
        becameProviderAt: new Date(),
      });
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
