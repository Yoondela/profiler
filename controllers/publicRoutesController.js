// controllers/providerPublicController.js
const User = require('../models/User');
const Profile = require('../models/Profile');
const Portfolio = require('../models/Portfolio');

exports.getPublicProvider = async (req, res) => {
  console.log('Getting public provider profile..');
  try {
    const { id } = req.params;

    // Load user with provider role
    const user = await User.findById(id);
    if (!user || !user.roles.includes('provider')) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Load related profile & portfolio
    const profile = await Profile.findOne({ user: id });
    const portfolio = await Portfolio.findOne({ user: id });

    if (!profile || !portfolio) {
      return res.status(404).json({ message: 'Provider profile incomplete' });
    }

    return res.status(200).json({
      user: {
        email: user.email,
        name: user.name,
      },
      profile : {
        phone: profile.phone,
        address: profile.address,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
      },
      portfolio : {
        company: portfolio.company,
        servicesOffered: portfolio.servicesOffered,
        otherSkills: portfolio.otherSkills,
        logoUrl: portfolio.logoUrl,
        bannerUrl: portfolio.bannerUrl,
        galleryPhotos: portfolio.galleryPhotos,
        email: portfolio.email,
        phone: portfolio.phone,
        address: portfolio.address,
        location: portfolio.location,
        about: portfolio.about,
        rating: portfolio.rating,
        completedJobs: portfolio.completedJobs,
        becameProviderAt: portfolio.becameProviderAt,
      },
    });

    console.log('Successful!');
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
