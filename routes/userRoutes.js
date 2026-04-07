// routes/user.js
const express = require('express');
const router = express.Router();

const { createUser, getCurrentUser, getAllUsers, getUserById, getUserByEmail, deleteUser } = require('../controllers/userController');
const { getFlackUserId } = require('../controllers/flackController');
const { becomeProvider } = require('../controllers/providerConroller');

const checkJwt = require('../middleware/auth');

router.get('/protected', checkJwt, (req, res) => {
  res.json({ message: 'This route is protected', user: req.auth });
});

router.post('/', createUser);
// router.get('/', checkJwt, (req, res, next) => {
//   if (req.query.userId) {
//     return getFlackUserId(req, res, next);
//   }
//   return getAllUsers(req, res, next);
// });
router.get('/me', checkJwt, getCurrentUser);
router.get('/id/:id', checkJwt, getUserById);
router.get('/email/:email', checkJwt, getUserByEmail);
router.patch('/:id/upgrade-to-provider', checkJwt, becomeProvider);
router.delete('/:id', checkJwt, deleteUser);

module.exports = router;
