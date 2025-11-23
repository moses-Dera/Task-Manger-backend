const express = require('express');
const { auth } = require('../middleware/auth');
const Message = require('../models/Message');

const router = express.Router();

// Get messages for user's company
router.get('/messages', auth, async (req, res) => {
  try {
    const company = req.user.company || 'default';
    const messages = await Message.find({ company })
      .populate('sender_id', 'name')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Send message to user's company
router.post('/messages', auth, async (req, res) => {
  try {
    if (!req.body.message || !req.body.message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const company = req.user.company || 'default';
    const message = new Message({
      sender_id: req.user._id,
      message: req.body.message.trim(),
      company
    });

    await message.save();
    await message.populate('sender_id', 'name');

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;