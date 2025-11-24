const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { getMessages, sendMessage, getTeamMembers } = require('../controllers/chatController');

const router = express.Router();

// Get team members
router.get('/team-members', auth, getTeamMembers);

// Get messages (supports optional recipient_id query param)
router.get('/messages', auth, getMessages);

// Send message (supports optional recipient_id in body)
router.post('/messages', auth, [
  body('message').notEmpty().withMessage('Message is required')
], sendMessage);

module.exports = router;