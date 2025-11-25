const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { loginLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { signup, login, getCurrentUser, forgotPassword, resetPassword } = require('../controllers/authController');
const { sendWelcomeEmail } = require('../utils/emailService');

const router = express.Router();

router.post('/signup', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], signup);

router.post('/login', loginLimiter, [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], login);

router.get('/me', auth, getCurrentUser);

router.post('/forgot-password', passwordResetLimiter, [
  body('email').isEmail().withMessage('Valid email is required')
], forgotPassword);

router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], resetPassword);

// Test email endpoint (for development/debugging)
router.post('/test-email', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const { email } = req.body;
    const testUser = {
      name: 'Test User',
      email: email,
      role: 'employee'
    };

    console.log('Testing email send to:', email);
    await sendWelcomeEmail(testUser);

    res.json({
      success: true,
      message: 'Test email sent successfully',
      details: `Email was sent to ${email}. Check your inbox and spam folder.`
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      details: error.message
    });
  }
});

// Direct welcome email test
router.post('/test-welcome', async (req, res) => {
  try {
    const { sendSimpleEmail } = require('../utils/emailService');
    await sendSimpleEmail('mosesjohnson706@gmail.com');

    res.json({
      success: true,
      message: 'Simple test email sent'
    });
  } catch (error) {
    console.error('Simple email test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;