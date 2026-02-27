const Company = require('../models/Company');
const Portfolio = require('../models/Portfolio');
const Invite = require('../models/Invite');
const Notification = require('../models/Notification');
const { sendNotification } = require('../services/sockeClient');

const reshapeData = (invite) => {
  return {
    id: invite._id,
    user: invite.user,
    type: invite.type,
    title: invite.title,
    message: invite.message,
    entityType: invite.entityType,
    entityId: invite.entityId,
    actions: invite.actions,
    status: invite.status,
    resolved: invite.resolved,
    createdAt: invite.createdAt,
  };
};

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


    const invite = await Invite.create({
      company: company._id,
      portfolio: portfolio._id,
      invitedBy: invitedBy,
    });

    const notificationData = await Notification.create({
      user: portfolio.user,
      type: 'company_invite',
      title: `Invite to join ${company.name}`,
      message: `You have been invited to join ${company.name}.`,
      entityType: 'CompanyInvite',
      entityId: invite._id,
      actions: ['accept', 'reject'],
    });

    console.log('notification data to go to socket:', notificationData);

    await sendNotification(reshapeData(notificationData));

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

    const invites = await Invite.find({
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

    const invite = await Invite.findById(inviteId)
      .populate('company')
      .populate('portfolio');

    if (!invite) {
      return res.status(404).json({ message: 'Invite not found' });
    }

    if (invite.status !== 'pending') {
      return res.status(400).json({ message: 'Invite already handled' });
    }

    const session = await Invite.startSession();
    session.startTransaction();

    try {
      if (action === 'accept') {
        await Company.findByIdAndUpdate(
          invite.company._id,
          { $addToSet: { members: invite.portfolio._id } },
          { session },
        );

        invite.status = 'accepted';
      } else {
        invite.status = 'rejected';
      }

      await invite.save({ session });

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

    if (action === 'accept') {
      const actionPast = 'accepted';

      const notificationData = await Notification.create({
        user: invite.invitedBy,
        type: 'company_invite_response',
        title: `Invite ${actionPast}`,
        message: `${invite.portfolio.name} has ${actionPast} and joined ${invite.company.name}.`,
        entityType: 'CompanyInvite',
        entityId: invite._id,
      });

      await sendNotification(reshapeData(notificationData));
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


module.exports = { inviteMember, getProviderInvites, respondToInvite };

