const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  createProfile,
  getAllProfiles,
  getProfileByUserId,
  getProfileByEmail,
  getProfileById,
  updateProfile,
  deleteProfile
} = require('../controllers/profileController');

router.post('/', createProfile);
router.get('/', getAllProfiles);
router.get('/me/:userId', getProfileByUserId);
router.get('/me/mail/:email', getProfileByEmail);
router.get('/:id', getProfileById);
router.put('/:id', updateProfile);
router.delete('/:id', deleteProfile);

module.exports = router;
