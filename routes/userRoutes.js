// routes/user.js
const express = require('express');
const router = express.Router();

const { createUser, getAllUsers, deleteUser } = require('../controllers/userController');

const checkJwt = require('../middleware/auth');

router.get('/protected', checkJwt, (req, res) => {
  res.json({ message: 'This route is protected', user: req.auth });
});

router.post('/', createUser);
router.get('/', getAllUsers);
router.delete('/:id', deleteUser);

module.exports = router;
