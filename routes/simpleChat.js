const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Simple in-memory message store for testing
let messages = [];

// Get messages
router.get('/messages', auth, (req, res) => {
  res.json({ success: true, data: messages });
});

// Send message
router.post('/messages', auth, (req, res) => {
  try {
    const userName = req.user?.name || 'Unknown User';
    const userId = req.user?._id || 'unknown';
    
    const message = {
      _id: Date.now().toString(),
      sender_id: { _id: userId, name: userName },
      message: req.body.message,
      createdAt: new Date().toISOString()
    };
    
    messages.push(message);
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;