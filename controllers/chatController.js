const { validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { upload } = require('../config/cloudinary');

// Upload attachment
const uploadAttachment = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const attachments = req.files.map(file => ({
      filename: file.filename, // Cloudinary filename
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: file.path // Cloudinary URL
    }));

    res.json({ success: true, data: attachments });
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Get messages with enhanced filtering and pagination
const getMessages = async (req, res) => {
  try {
    const company = req.user.company || 'default';
    const { recipient_id, limit = 50, skip = 0, includeDeleted = false } = req.query;

    let query = { company };

    // Filter out deleted messages unless explicitly requested
    if (!includeDeleted) {
      query.isDeleted = false;
    }

    if (recipient_id) {
      // Get direct messages between current user and recipient
      query = {
        ...query,
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
      .populate('replyTo', 'message sender_id')
      .populate('readBy.user', 'name')
      .populate('reactions.users', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    // Reverse to get chronological order
    messages.reverse();

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Send message with optional attachments
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
    const { recipient_id, replyTo } = req.body;
    console.log('Using company:', company);

    const message = new Message({
      sender_id: req.user._id,
      recipient_id: recipient_id || null,
      message: req.body.message,
      company,
      replyTo: replyTo || null,
      attachments: req.body.attachments || []
    });

    console.log('Message to save:', message);
    await message.save();
    await message.populate('sender_id', 'name email role');
    if (recipient_id) {
      await message.populate('recipient_id', 'name email role');
    }
    if (replyTo) {
      await message.populate('replyTo', 'message sender_id');
    }

    // Emit real-time message event via Socket.io
    const io = req.app.get('io');
    if (io) {
      const targetRoom = recipient_id || company;
      io.to(targetRoom).emit('new_message', {
        type: 'new_message',
        message: message,
        senderId: req.user._id,
        senderName: req.user.name
      });

      // Create notification for direct messages
      if (recipient_id) {
        try {
          const notification = new Notification({
            user_id: recipient_id,
            title: `New Message from ${req.user.name}`,
            message: message.message.length > 50 ? message.message.substring(0, 50) + '...' : message.message,
            type: 'message',
            read: false
          });
          await notification.save();

          if (io.emitNotification) {
            io.emitNotification(recipient_id, {
              id: notification._id,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              timestamp: notification.createdAt
            });
          }
        } catch (notifError) {
          console.error('Failed to create chat notification:', notifError);
        }
      }
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Chat send message error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

// Mark message as read
const markMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    await message.markAsReadBy(req.user._id);

    // Emit read receipt via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(message.sender_id.toString()).emit('message_read', {
        messageId: message._id,
        readBy: req.user._id,
        readByName: req.user.name,
        readAt: new Date()
      });
    }

    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Mark all messages as read in a conversation
const markAllAsRead = async (req, res) => {
  try {
    const { recipient_id } = req.body;
    const company = req.user.company || 'default';

    let query = { company, isDeleted: false };

    if (recipient_id) {
      // Direct messages
      query.$or = [
        { sender_id: recipient_id, recipient_id: req.user._id },
        { sender_id: req.user._id, recipient_id: recipient_id }
      ];
    } else {
      // Group messages
      query.recipient_id = null;
    }

    // Find unread messages
    const messages = await Message.find({
      ...query,
      'readBy.user': { $ne: req.user._id }
    });

    // Mark each as read
    for (const message of messages) {
      await message.markAsReadBy(req.user._id);
    }

    res.json({ success: true, count: messages.length });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Add reaction to message
const addReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ success: false, error: 'Emoji is required' });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    await message.addReaction(emoji, req.user._id);
    await message.populate('reactions.users', 'name');

    // Emit reaction via Socket.io
    const io = req.app.get('io');
    if (io) {
      const targetRoom = message.recipient_id || message.company;
      io.to(targetRoom).emit('message_reaction', {
        messageId: message._id,
        emoji,
        userId: req.user._id,
        userName: req.user.name,
        action: 'add'
      });
    }

    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Remove reaction from message
const removeReaction = async (req, res) => {
  try {
    const { id, emoji } = req.params;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    await message.removeReaction(emoji, req.user._id);
    await message.populate('reactions.users', 'name');

    // Emit reaction removal via Socket.io
    const io = req.app.get('io');
    if (io) {
      const targetRoom = message.recipient_id || message.company;
      io.to(targetRoom).emit('message_reaction', {
        messageId: message._id,
        emoji,
        userId: req.user._id,
        userName: req.user.name,
        action: 'remove'
      });
    }

    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Search messages
const searchMessages = async (req, res) => {
  try {
    const { query, recipient_id } = req.query;
    const company = req.user.company || 'default';

    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }

    let searchQuery = {
      company,
      isDeleted: false,
      message: { $regex: query, $options: 'i' }
    };

    if (recipient_id) {
      searchQuery.$or = [
        { sender_id: req.user._id, recipient_id: recipient_id },
        { sender_id: recipient_id, recipient_id: req.user._id }
      ];
    } else {
      searchQuery.recipient_id = null;
    }

    const messages = await Message.find(searchQuery)
      .populate('sender_id', 'name email role')
      .populate('recipient_id', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const company = req.user.company || 'default';

    // Get all conversations
    const conversations = await Message.aggregate([
      {
        $match: {
          company,
          isDeleted: false,
          $or: [
            { recipient_id: req.user._id },
            { recipient_id: null }
          ]
        }
      },
      {
        $group: {
          _id: '$sender_id',
          unreadCount: {
            $sum: {
              $cond: [
                { $not: { $in: [req.user._id, '$readBy.user'] } },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Edit message
const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message: newMessage } = req.body;

    if (!newMessage || !newMessage.trim()) {
      return res.status(400).json({ success: false, error: 'Message content is required' });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'You can only edit your own messages' });
    }

    // Store original message if not already stored
    if (!message.originalMessage) {
      message.originalMessage = message.message;
    }

    message.message = newMessage;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate('sender_id', 'name email role');
    if (message.recipient_id) {
      await message.populate('recipient_id', 'name email role');
    }

    // Emit edit via Socket.io
    const io = req.app.get('io');
    if (io) {
      const targetRoom = message.recipient_id || message.company;
      io.to(targetRoom).emit('message_edited', {
        messageId: message._id,
        newMessage: message.message,
        editedAt: message.editedAt
      });
    }

    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Delete message (soft delete)
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    // Check if user is the sender or has manager/admin role
    const canDelete = message.sender_id.toString() === req.user._id.toString() ||
      req.user.role === 'manager' ||
      req.user.role === 'admin';

    if (!canDelete) {
      return res.status(403).json({ success: false, error: 'You do not have permission to delete this message' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = req.user._id;
    await message.save();

    // Emit deletion via Socket.io
    const io = req.app.get('io');
    if (io) {
      const targetRoom = message.recipient_id || message.company;
      io.to(targetRoom).emit('message_deleted', {
        messageId: message._id,
        deletedBy: req.user._id
      });
    }

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Pin/unpin message
const pinMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPinned } = req.body;

    // Only managers and admins can pin messages
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only managers and admins can pin messages' });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    message.isPinned = isPinned;
    message.pinnedAt = isPinned ? new Date() : null;
    message.pinnedBy = isPinned ? req.user._id : null;
    await message.save();

    await message.populate('sender_id', 'name email role');
    if (message.recipient_id) {
      await message.populate('recipient_id', 'name email role');
    }

    // Emit pin status via Socket.io
    const io = req.app.get('io');
    if (io) {
      const targetRoom = message.recipient_id || message.company;
      io.to(targetRoom).emit('message_pinned', {
        messageId: message._id,
        isPinned,
        pinnedBy: req.user.name
      });
    }

    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Pin message error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Get pinned messages
const getPinnedMessages = async (req, res) => {
  try {
    const company = req.user.company || 'default';
    const { recipient_id } = req.query;

    let query = { company, isPinned: true, isDeleted: false };

    if (recipient_id) {
      query.$or = [
        { sender_id: req.user._id, recipient_id: recipient_id },
        { sender_id: recipient_id, recipient_id: req.user._id }
      ];
    } else {
      query.recipient_id = null;
    }

    const messages = await Message.find(query)
      .populate('sender_id', 'name email role')
      .populate('recipient_id', 'name email role')
      .populate('pinnedBy', 'name')
      .sort({ pinnedAt: -1 });

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Get pinned messages error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Get team members
const getTeamMembers = async (req, res) => {
  try {
    const company = req.user.company || 'default';

    // Get all users in the same company except current user
    const teamMembers = await User.find({
      'companies.company': company,
      _id: { $ne: req.user._id }
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
  uploadAttachment,
  upload
};