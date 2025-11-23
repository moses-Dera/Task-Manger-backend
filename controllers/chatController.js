const { validationResult } = require('express-validator');
const Message = require('../models/Message');

const getMessages = async (req, res) => {
  try {
    const company = req.user.company || 'default';
    const messages = await Message.find({ company })
      .populate('sender_id', 'name')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const sendMessage = async (req, res) => {
  try {
    console.log('Send message request:', req.body);
    console.log('User:', req.user);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const company = req.user.company || 'default';
    console.log('Using company:', company);
    
    const message = new Message({
      sender_id: req.user._id,
      message: req.body.message,
      company
    });

    console.log('Message to save:', message);
    await message.save();
    await message.populate('sender_id', 'name');

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Chat send message error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

module.exports = {
  getMessages,
  sendMessage
};