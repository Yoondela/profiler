// routes/user.js
const express = require('express');
const router = express.Router();

const { createUser, getAllUsers, deleteUser } = require('../controllers/userController');
const { becomeProvider } = require('../controllers/providerConroller,js');

const checkJwt = require('../middleware/auth');

router.get('/protected', checkJwt, (req, res) => {
  res.json({ message: 'This route is protected', user: req.auth });
});

router.post('/', createUser);
router.get('/', checkJwt, getAllUsers);
router.patch('/:id/upgrade-to-provider', checkJwt, becomeProvider);
router.delete('/:id', checkJwt, deleteUser);

module.exports = router;
