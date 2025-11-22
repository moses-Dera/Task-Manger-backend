const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { signup, login, getCurrentUser, forgotPassword, resetPassword } = require('../controllers/authController');

const router = express.Router();

router.post('/signup', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], signup);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], login);

router.get('/me', auth, getCurrentUser);

router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required')
], forgotPassword);

router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], resetPassword);

module.exports = router;