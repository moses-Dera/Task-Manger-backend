const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { getMessages, sendMessage } = require('../controllers/chatController');

const router = express.Router();

// Get messages
router.get('/messages', auth, getMessages);

// Send message
router.post('/messages', auth, [
  body('message').notEmpty().withMessage('Message is required')
], sendMessage);

module.exports = router;