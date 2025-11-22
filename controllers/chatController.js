const { validationResult } = require('express-validator');
const Message = require('../models/Message');

const getMessages = async (req, res) => {
  try {
    const { recipient_id } = req.query;
    let query = {};

    if (recipient_id) {
      query = {
        $or: [
          { sender_id: req.user._id, recipient_id },
          { sender_id: recipient_id, recipient_id: req.user._id }
        ]
      };
    } else {
      query = {
        $or: [
          { sender_id: req.user._id },
          { recipient_id: req.user._id }
        ]
      };
    }

    const messages = await Message.find(query)
      .populate('sender_id', 'name')
      .populate('recipient_id', 'name')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const message = new Message({
      sender_id: req.user._id,
      recipient_id: req.body.recipient_id,
      message: req.body.message
    });

    await message.save();
    await message.populate(['sender_id', 'recipient_id'], 'name');

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  getMessages,
  sendMessage
};