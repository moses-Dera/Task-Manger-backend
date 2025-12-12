const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { getProfile, updateProfile, getSettings, updateSettings, changePassword, uploadProfilePicture, upload } = require('../controllers/userController');

const router = express.Router();

router.get('/profile', auth, getProfile);

router.put('/profile', auth, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required')
], updateProfile);

router.post('/profile/picture', auth, upload.single('profilePicture'), uploadProfilePicture);

// Settings endpoints
router.get('/settings', auth, getSettings);
router.put('/settings', auth, updateSettings);

// Change password endpoint
router.put('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], changePassword);

module.exports = router;