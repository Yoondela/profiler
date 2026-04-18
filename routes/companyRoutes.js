const express = require('express');
const router = express.Router();

const { createCompany, getCompany, getCompanyMembers } = require('../controllers/companyController');
const {
  getCompanyEdits,
  updateCompanyEdits,
} = require('../controllers/companyEditsController');

router.post('/create/:id', createCompany);
router.get('/:ownerId', getCompany);
router.get('/:companyId/members', getCompanyMembers);
router.get('/:companyId/edits', getCompanyEdits);
router.patch('/:companyId/edits', updateCompanyEdits);

module.exports = router;
