const express = require('express');
const { body, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Create system notification (Admin only)
router.post('/', auth, authorize('admin'), [
  body('user_id').notEmpty().withMessage('User ID is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').isIn(['task', 'message', 'reminder', 'system']).withMessage('Invalid type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const notification = new Notification(req.body);
    await notification.save();

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;