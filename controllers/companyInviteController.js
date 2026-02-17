const Company = require('../models/Company');
const Portfolio = require('../models/Portfolio');
const CompanyInvite = require('../models/CompanyInvite');

const inviteMember = async (req, res) => {
  console.log('Inviting Member..');
  try {
    const companyId = req.params.companyId;
    const { portfolioId, invitedBy } = req.body;

    if (!portfolioId) {
      return res.status(400).json({ message: 'Provider is required' });
    }

    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (!invitedBy) {
      return res.status(400).json({ message: 'Inviter is required' });
    }

    const isOwner = company.owner.toString() === invitedBy;

    if (!isOwner) {
      return res.status(403).json({ message: 'Only company owner can invite providers' });
    }

    const portfolio = await Portfolio.findById(portfolioId);

    if (!portfolio) {
      return res.status(404).json({ message: 'Provider not found'});
    }

    if (company.members.includes(portfolio._id)) {
      return res.status(400).json({ message: 'Provider already a member' });
    }


    const invite = await CompanyInvite.create({
      company: company._id,
      portfolio: portfolio._id,
      invitedBy: invitedBy,
    });

    console.log('Succesful!');

    return res.status(201).json({ invite });
  } catch (err) {

    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: 'Invite already exists' });
    }

    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getProviderInvites = async (req, res) => {
  try {
    const { providerId } = req.params;
    const portfolio = await Portfolio.findOne({ user: providerId });

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    const invites = await CompanyInvite.find({
      portfolio: portfolio._id,
      status: 'pending',
    })
      .populate('company')
      .populate('invitedBy', 'name email')
      .lean();

    return res.status(200).json(invites);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const respondToInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const { action } = req.body;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const invite = await CompanyInvite.findById(inviteId);
    if (!invite) {
      return res.status(404).json({ message: 'Invite not found' });
    }

    if (invite.status !== 'pending') {
      return res
        .status(400)
        .json({ message: 'Invite already handled' });
    }

    if (action === 'accept') {
      // 1️⃣ Add portfolio to company members
      await Company.findByIdAndUpdate(invite.company, {
        $addToSet: { members: invite.portfolio },
      });

      invite.status = 'accepted';
    }

    if (action === 'reject') {
      invite.status = 'rejected';
    }

    await invite.save();

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { inviteMember, getProviderInvites, respondToInvite };

