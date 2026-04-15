const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Company = require('../models/Company');
const { geocodeAddress } = require('../helper/geocodeAddress');
const { parseGoogleAddress } = require('../helper/parseGoogleAddress');

const createCompany = async (req, res) => {
  console.log('Listing as company');
  try {
    const { id } = req.params;
    const { name, address } = req.body;

    console.log('Received data:', { id, name, address });

    if (!name || !address || !address.formatted || !address.addressComponents) {
      return res.status(400).json({
        message: 'Company name and address are required',
      });
    }

    const parsed = parseGoogleAddress({
      formatted_address: address.formatted,
      place_id: address.placeId,
      address_components: address.addressComponents,
    });

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

    console.log("Final address:", finalAddress);

    const user = await User.findById(id);
    if (!user || !user.roles.includes('provider')) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const portfolio = await Portfolio.findOne({ user: user._id });
    if (!portfolio) {
      return res.status(400).json({ message: 'Portfolio not found' });
    }

    let company = await Company.findOne({ owner: user._id });
    let createdNow = false;

    if (!company) {
      company = await Company.create({
        name,
        owner: user._id,
        members: [portfolio._id],
        address: finalAddress,
      });
      createdNow = true;
    }

    // Link portfolio once
    if (!portfolio.company) {
      portfolio.company = company._id;
      await portfolio.save();
    }

    console.log('Company created or retrieved: ', portfolio);
    console.log('Successful!');


    return res.status(createdNow ? 201 : 200).json({
      portfolio,
      company,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getCompany = async (req, res) => {
  console.log('Getting Company');
  try {
    const ownerId = req.params.ownerId;

    const company = await Company.findOne({ owner: ownerId })
      .populate('owner') // User
      .populate({
        path: 'members',
        populate: {
          path: 'user',
          model: 'User',
        },
      });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    console.log('Successful!');
    return res.status(200).json({ company: company });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getCompanyMembers = async (req, res) => {
  console.log('Getting Company Members..');
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId).lean();
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (!company.members || company.members.length === 0) {
      return res.json([]);
    }

    const members = await Portfolio.aggregate([
      {
        $match: {
          _id: { $in: company.members },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'profiles',
          localField: 'user._id',
          foreignField: 'user',
          as: 'profile',
        },
      },
      {
        $unwind: {
          path: '$profile',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          portfolioId: '$_id',
          name: '$user.name',
          avatarUrl: '$profile.avatarUrl',
        },
      },
    ]);

    res.json(members);
    console.log('Successful!');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



module.exports = { createCompany, getCompany, getCompanyMembers };
