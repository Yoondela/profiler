// controllers/providerSearchController.js

const User = require('../models/User');
const Profile = require('../models/Profile');
const Portfolio = require('../models/Portfolio');
const Category = require('../models/Category');
const Company = require('../models/Company');
const Service = require('../models/Service');
const SearchDocument = require('../models/SearchDocument');

exports.searchServices = async (req, res) => {
  console.log('Searching for searvices..');

  // IMPORTANT: instead of reg exp use Mongo text index or Atlas Search.

  try {

    const q = (req.query.q || '').trim();

    if (!q) {
      return res.json([]);
    }

    const results = await SearchDocument.find({
      type: 'service',
      label: { $regex: q, $options: 'i' },
    })
      .limit(10)
      .select('label refId');

    console.log(results);

    res.json(results);

    console.log('Successful!');

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.searchProviders = async (req, res) => {
  console.log('Searching for providers..');

  try {
    const q = (req.query.q || '').trim();
    const city = (req.query.city || '').toLowerCase();

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 12, 20);

    if (!q) {
      return res.status(200).json({
        data: [],
        page,
        limit,
        total: 0,
        totalPages: 0,
      });
    }

    const regex = new RegExp(q, 'i');

    // ---------------------------
    // MATCHING
    // ---------------------------
    const matchedServices = await Service.find({ name: regex }).select('_id');

    const matchedPortfolios = await Portfolio.find({
      servicesOffered: { $in: matchedServices.map((s) => s._id) },
    }).select('user');

    const searchCompanies = await Company.find({ name: regex }).select('_id');

    const matchedCompany = await Portfolio.find({
      company: { $in: searchCompanies.map((c) => c._id) },
    }).select('user');

    const matchedUsers = await User.find({
      roles: 'provider',
      name: regex,
    }).select('_id');

    const providerIds = [
      ...matchedUsers.map((u) => u._id.toString()),
      ...matchedPortfolios.map((p) => p.user.toString()),
      ...matchedCompany.map((c) => c.user.toString()),
    ];

    const uniqueIds = [...new Set(providerIds)];

    // ---------------------------
    // FETCH PORTFOLIOS (for ranking)
    // ---------------------------
    const portfolios = await Portfolio.find({
      user: { $in: uniqueIds },
    })
      .populate('company', 'name logoUrl')
      .lean();

    // ---------------------------
    // MAP FOR FAST LOOKUPS (O(1))
    // ---------------------------
    const portfolioMap = new Map(
      portfolios.map((p) => [p.user.toString(), p])
    );

    // ---------------------------
    // NORMALIZE CITY
    // ---------------------------
    const normalizeCity = (str = '') =>
      str.toLowerCase().replace(/-/g, ' ').trim();

    const queryCity = normalizeCity(city);

    // ---------------------------
    // RANK BY CITY
    // ---------------------------
    const rankedIds = uniqueIds
      .map((id) => {
        const portfolio = portfolioMap.get(id);

        const portfolioCity = normalizeCity(
          portfolio?.address?.addressComponents?.city
        );

        return {
          id,
          score: portfolioCity === queryCity ? 100 : 1,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.id);

    // ---------------------------
    // PAGINATION
    // ---------------------------
    const total = rankedIds.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const paginatedIds = rankedIds.slice(skip, skip + limit);

    // ---------------------------
    // FETCH USERS + PROFILES
    // ---------------------------
    const usersRaw = await User.find({
      _id: { $in: paginatedIds },
    }).lean();

    const profilesRaw = await Profile.find({
      user: { $in: paginatedIds },
    }).lean();

    // ---------------------------
    // MAPS (O(1) lookups)
    // ---------------------------
    const userMap = new Map(
      usersRaw.map((u) => [u._id.toString(), u])
    );

    const profileMap = new Map(
      profilesRaw.map((p) => [p.user.toString(), p])
    );

    // ---------------------------
    // BUILD RESPONSE (ORDER PRESERVED)
    // ---------------------------
    const data = paginatedIds.map((id) => {
      const user = userMap.get(id);
      const profile = profileMap.get(id);
      const portfolio = portfolioMap.get(id);

      let location = null;

      if (portfolio?.address?.location?.coordinates?.length === 2) {
        location = {
          lat: portfolio.address.location.coordinates[1],
          lng: portfolio.address.location.coordinates[0],
        };
      }

      return {
        _id: user?._id,
        name: user?.name || '',
        company: portfolio?.company?.name || '',
        servicesOffered: portfolio?.servicesOffered || [],
        avatarUrl: profile?.avatarUrl || null,
        logoUrl: portfolio?.company?.logoUrl || null,
        location,
      };
    });

    return res.status(200).json({
      data,
      page,
      limit,
      total,
      totalPages,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};



exports.autocomplete = async (req, res) => {

  console.log('new autocomplete...');

  try {

    const q = (req.query.q || '').trim();

    if (q.length < 2) {
      return res.json([]);
    }

    if (process.env.NODE_ENV === 'test') {

      const regex = new RegExp(q, 'i');

      console.log('Autocomplete query (test mode):', q);

      const results = await SearchDocument
        .find({ label: regex })
        .limit(10);

      console.log('Autocomplete results (test mode):', results);

      return res.json(results);

    }

    const results = await SearchDocument.aggregate([

      {
        $search: {
          index: 'autocomplete',
          compound: {
            should: [
              {
                autocomplete: {
                  query: q,
                  path: 'label',
                  fuzzy: {
                    maxEdits: 2,
                  },
                  tokenOrder: 'sequential',
                  score: { boost: { value: 5 } },
                },
              },
              // {
              //   autocomplete: {
              //     query: q,
              //     path: 'label',
              //     tokenOrder: 'any',
              //     score: { boost: { value: 2 } },
              //   },
              // },
            ],
          },
        },
      },

      {
        $project: {
          label: 1,
          type: 1,
          refId: 1,
          score: { $meta: 'searchScore' },
        },
      },

      { $sort: { score: -1 } },

      { $limit: 10 },

    ]);

    console.log('Autocomplete results:', results);

    res.json(results);

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: 'Server error' });

  }

};
exports.searchAll = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const city = (req.query.city || '').toLowerCase();

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 12, 20);

    if (!q) {
      return res.status(200).json({
        data: [],
        page,
        limit,
        total: 0,
        totalPages: 0,
      });
    }

    const regex = new RegExp(q, 'i');

    // ---------------------------
    // SERVICES
    // ---------------------------
    const services = await Service.find({ name: regex }).lean();

    // ---------------------------
    // PROVIDERS
    // ---------------------------
    const matchedServices = await Service.find({ name: regex }).select('_id');

    const portfolios = await Portfolio.find({
      servicesOffered: { $in: matchedServices.map((s) => s._id) },
    }).lean();

    const providerUsers = await User.find({
      roles: 'provider',
    }).lean();

    const providerIds = portfolios.map((p) => p.user.toString());

    const providers = providerUsers.filter((u) =>
      providerIds.includes(u._id.toString())
    );

    // ---------------------------
    // COMPANIES
    // ---------------------------
    const companies = await Company.find({ name: regex }).lean();

    // ---------------------------
    // PROFILES (for providers)
    // ---------------------------
    const profiles = await Profile.find({
      user: { $in: providers.map((p) => p._id) },
    }).lean();

    // ---------------------------
    // RANKING (ONLY providers + companies)
    // ---------------------------
    const rankedProviders = providers.map((user) => {
      const portfolio = portfolios.find(
        (p) => p.user.toString() === user._id.toString()
      );

      const providerCity =
        portfolio?.address?.addressComponents?.city?.toLowerCase() || '';

      return {
        type: 'provider',
        score: providerCity === city ? 2 : 1,
        user,
        portfolio,
      };
    });

    const rankedCompanies = companies.map((company) => {
      const companyCity =
        company?.address?.addressComponents?.city?.toLowerCase() || '';

      return {
        type: 'company',
        score: companyCity === city ? 2 : 1,
        company,
      };
    });

    // ---------------------------
    // MERGE + SORT
    // ---------------------------
    const combined = [
      ...services.map((s) => ({
        type: 'service',
        score: 0,
        service: s,
      })),
      ...rankedProviders,
      ...rankedCompanies,
    ].sort((a, b) => b.score - a.score);

    // ---------------------------
    // PAGINATION
    // ---------------------------
    const total = combined.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;

    const paginated = combined.slice(start, start + limit);

    // ---------------------------
    // FORMAT RESPONSE
    // ---------------------------
    const data = paginated.map((item) => {
      if (item.type === 'service') {
        return {
          type: 'service',
          _id: item.service._id,
          name: item.service.name,
        };
      }

      if (item.type === 'company') {
        return {
          type: 'company',
          _id: item.company._id,
          name: item.company.name,
          logoUrl: item.company.logoUrl,
        };
      }

      if (item.type === 'provider') {
        const profile = profiles.find(
          (p) => p.user.toString() === item.user._id.toString()
        );

        let location = null;

        if (
          item.portfolio?.address?.location?.coordinates?.length === 2
        ) {
          location = {
            lat: item.portfolio.address.location.coordinates[1],
            lng: item.portfolio.address.location.coordinates[0],
          };
        }

        return {
          type: 'provider',
          _id: item.user._id,
          name: item.user.name,
          avatarUrl: profile?.avatarUrl || null,
          location,
        };
      }
    });

    return res.status(200).json({
      data,
      page,
      limit,
      total,
      totalPages,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


