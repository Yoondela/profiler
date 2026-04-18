// controllers/providerPublicController.js
const User = require('../models/User');
const Profile = require('../models/Profile');
const Portfolio = require('../models/Portfolio');
const Company = require('../models/Company');
const GalleryPhoto = require('../models/GalleryPhoto');

exports.getPublicProvider = async (req, res) => {
  console.log('Getting public provider profile..');

  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user || !user.roles.includes('provider')) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const profile = await Profile.findOne({ user: id });

    const portfolio = await Portfolio.findOne({ user: id })
      .populate('servicesOffered');

    console.log(portfolio)

    const company = await Company.findOne({ owner: id })
      .populate('members')
      .populate('servicesOffered');

    console.log(company)
    

    if (!profile || !portfolio) {
      return res.status(404).json({ message: 'Provider profile incomplete' });
    }

    // company takes precedence
    const source = company || portfolio;
    const ownerType = company ? 'Company' : 'Portfolio';

    // ✅ Fetch real gallery
    const galleryPhotos = await GalleryPhoto.find({
      ownerId: source._id,
      ownerType,
    })
      .sort('order')
      .select('url order isPrimary')
      .lean();

    return res.status(200).json({
      user: {
        email: user.email,
        name: user.name,
      },
    
      profile: {
        phone: profile.phone,
        address: profile.address,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
      },
    
      provider: {
        type: company ? 'company' : 'individual',
      
        name: source.name || source.displayName,
      
        servicesOffered: source.servicesOffered,
        otherSkills: source.otherSkills,
      
        logoUrl: source.logoUrl,
        bannerUrl: source.bannerUrl,
      
        // ✅ FIXED
        galleryPhotos,
      
        address: {
          city: source?.address?.addressComponents?.city,
          suburb: source?.address?.addressComponents?.suburb,
        },
      
        about: source.about || source.bio,
      
        rating: source.rating,
        completedJobs: source.completedJobs,
        becameProviderAt: source.createdAt,
      },
    
      ...(company && {
        company: {
          name: company.name,
          members: company.members,
        },
      }),
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
