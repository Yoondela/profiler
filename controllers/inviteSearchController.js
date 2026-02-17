const Company = require('../models/Company');
const CompanyInvite = require('../models/CompanyInvite');
const Portfolio = require('../models/Portfolio');

const memberSearch = async (req, res) => {
  console.log('Searching for members to invite..');
  try {
    const { companyId } = req.params;
    const { q = '' } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const company = await Company.findById(companyId).lean();
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const pendingInvites = await CompanyInvite.find({
      company: companyId,
      status: 'pending',
    }).lean();

    const pendingSet = new Set(
      pendingInvites.map(i => i.portfolio.toString()),
    );

    const memberSet = new Set(
      company.members.map(m => m.toString()),
    );

    const providers = await Portfolio.aggregate([
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
        $match: {
          'user.name': { $regex: q, $options: 'i' },
        },
      },
      {
        $project: {
          portfolioId: '$_id',
          userId: '$user._id',
          name: '$user.name',
          avatarUrl: 1,
        },
      },
      { $limit: 10 },
    ]);

    const result = providers.map(p => {
      let inviteStatus = 'invitable';

      if (p.userId.toString() === company.owner.toString()) {
        inviteStatus = 'owner';
      } else if (memberSet.has(p.portfolioId.toString())) {
        inviteStatus = 'already_member';
      } else if (pendingSet.has(p.portfolioId.toString())) {
        inviteStatus = 'pending_invite';
      }

      return { ...p, inviteStatus };
    });
    res.json(result);
    console.log('Succeful!');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { memberSearch };
