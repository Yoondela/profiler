const express = require('express');
const router = express.Router();


const {
  inviteMember,
  getProviderInvites,
  respondToInvite,
} = require('../controllers/companyInviteController');

router.post('/:companyId/invite', inviteMember);
router.get('/:providerId', getProviderInvites);
router.post('/:inviteId/respond', respondToInvite);

module.exports = router;
