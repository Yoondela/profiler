const express = require('express');
const router = express.Router();

const { createCompany, getCompany } = require('../controllers/companyController');

router.post('/create/:id', createCompany);
router.get('/:ownerId', getCompany);

module.exports = router;
