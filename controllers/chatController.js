const { validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');

const getMessages = async (req, res) => {
  try {
    const company = req.user.company || 'default';
    const { recipient_id } = req.query;

    let query = { company };

    if (recipient_id) {
      // Get direct messages between current user and recipient
      query = {
        company,
        $or: [
          { sender_id: req.user._id, recipient_id: recipient_id },
          { sender_id: recipient_id, recipient_id: req.user._id }
        ]
      };
    } else {
      // Get group messages (messages with no recipient)
      query.recipient_id = null;
    }

    const messages = await Message.find(query)
      .populate('sender_id', 'name email role')
      .populate('recipient_id', 'name email role')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Get messages error:', error);
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
    const { recipient_id } = req.body;
    console.log('Using company:', company);

    const message = new Message({
      sender_id: req.user._id,
      recipient_id: recipient_id || null, // null for group messages
      message: req.body.message,
      company
    });

    console.log('Message to save:', message);
    await message.save();
    await message.populate('sender_id', 'name email role');
    if (recipient_id) {
      await message.populate('recipient_id', 'name email role');
    }

    // Emit real-time message event via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emitNotification(recipient_id || socket.userCompany, {
        type: 'new_message',
        message: message,
        senderId: req.user._id,
        senderName: req.user.name
      });
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Chat send message error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

const getTeamMembers = async (req, res) => {
  try {
    const company = req.user.company || 'default';

    // Get all users in the same company except current user
    const teamMembers = await User.find({
      company: company,
      _id: { $ne: req.user._id } // Exclude current user
    }).select('name email role createdAt').sort({ name: 1 });

    res.json({ success: true, data: teamMembers });
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  getTeamMembers
};