// routes/user.js
const express = require('express');
const router = express.Router();

const { createUser, getAllUsers, deleteUser } = require('../controllers/userController');

const authMiddleware = require('../middleware/auth');

router.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'This route is protected', user: req.user });
});

router.post('/', createUser);
router.get('/', getAllUsers);
router.delete('/:id', deleteUser);

module.exports = router;
