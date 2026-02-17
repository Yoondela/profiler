const express = require('express');
const router = express.Router();

const { createCompany, getCompany, getCompanyMembers } = require('../controllers/companyController');

router.post('/create/:id', createCompany);
router.get('/:ownerId', getCompany);
router.get('/:companyId/members', getCompanyMembers);

module.exports = router;
