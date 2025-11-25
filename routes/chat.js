const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  getMessages,
  sendMessage,
  markMessageAsRead,
  markAllAsRead,
  addReaction,
  removeReaction,
  searchMessages,
  getUnreadCount,
  editMessage,
  deleteMessage,
  pinMessage,
  getPinnedMessages,
  getTeamMembers,
  upload
} = require('../controllers/chatController');

const router = express.Router();

// Team members
router.get('/team-members', auth, getTeamMembers);

// Get messages (supports optional recipient_id, limit, skip query params)
router.get('/messages', auth, getMessages);

// Send message (supports optional recipient_id, replyTo in body)
router.post('/messages', auth, [
  body('message').notEmpty().withMessage('Message is required')
], sendMessage);

// Mark message as read
router.put('/messages/:id/read', auth, markMessageAsRead);

// Mark all messages as read in a conversation
router.put('/messages/read-all', auth, markAllAsRead);

// Add reaction to message
router.post('/messages/:id/reactions', auth, [
  body('emoji').notEmpty().withMessage('Emoji is required')
], addReaction);

// Remove reaction from message
router.delete('/messages/:id/reactions/:emoji', auth, removeReaction);

// Search messages
router.get('/messages/search', auth, searchMessages);

// Get unread message count
router.get('/messages/unread-count', auth, getUnreadCount);

// Edit message
router.put('/messages/:id', auth, [
  body('message').notEmpty().withMessage('Message content is required')
], editMessage);

// Delete message (soft delete)
router.delete('/messages/:id', auth, deleteMessage);

// Pin/unpin message
router.put('/messages/:id/pin', auth, [
  body('isPinned').isBoolean().withMessage('isPinned must be a boolean')
], pinMessage);

// Get pinned messages
router.get('/messages/pinned', auth, getPinnedMessages);

module.exports = router;