const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/userController');

const router = express.Router();

router.get('/profile', auth, getProfile);

router.put('/profile', auth, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required')
], updateProfile);

module.exports = router;