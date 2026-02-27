const express = require('express');
const router = express.Router();

const { memberSearch } = require('../controllers/inviteSearchController');

const {
  inviteMember,
  getProviderInvites,
  respondToInvite,
} = require('../controllers/inviteController');

router.post('/:companyId/invite', inviteMember);
router.get('/:providerId', getProviderInvites);
router.patch('/:inviteId/respond', respondToInvite);
router.get('/:companyId/search', memberSearch);

module.exports = router;
