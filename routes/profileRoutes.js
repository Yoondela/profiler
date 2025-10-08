const express = require('express');
const router = express.Router();
const {
  createProfile,
  getAllProfiles,
  getProfileByUserId,
  getProfileByEmail,
  getProfileById,
  updateProfile,
  updateProfileByEmail,
  deleteProfile,
} = require('../controllers/profileController');

router.post('/', createProfile);
router.get('/', getAllProfiles);
router.get('/me/:userId', getProfileByUserId);
router.get('/me/mail/:email', getProfileByEmail);
router.get('/:id', getProfileById);
router.patch('/:id', updateProfile);
router.patch('/update-by-mail/:email', updateProfileByEmail);
router.delete('/:id', deleteProfile);

module.exports = router;
