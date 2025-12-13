const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { loginLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { signup, login, getCurrentUser, forgotPassword, resetPassword, verifyMagicLink } = require('../controllers/authController');
const { sendWelcomeEmail } = require('../utils/emailService');

const router = express.Router();

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - company
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [admin, manager, employee]
 *                 example: employee
 *               company:
 *                 type: string
 *                 example: mycompany
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: User already exists or validation error
 */
router.post('/signup', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                   description: JWT token to use for authentication
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid credentials
 */
router.post('/login', loginLimiter, [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 */
router.get('/me', auth, getCurrentUser);

router.post('/forgot-password', passwordResetLimiter, [
  body('email').isEmail().withMessage('Valid email is required')
], forgotPassword);

router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], resetPassword);

router.post('/verify-magic-link', [
  body('token').notEmpty().withMessage('Token is required')
], verifyMagicLink);

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