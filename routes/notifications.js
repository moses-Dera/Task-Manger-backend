const express = require('express');
const { body, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get notifications
router.get('/', auth, async (req, res) => {
  try {
    let notifications = await Notification.find({ user_id: req.user._id })
      .sort({ createdAt: -1 });
    
    // If no notifications found, return mock data
    if (notifications.length === 0) {
      notifications = [
        {
          _id: '1',
          title: 'Welcome to TaskFlow',
          message: 'Your account has been set up successfully',
          type: 'system',
          read: false,
          createdAt: new Date(Date.now() - 3600000)
        },
        {
          _id: '2',
          title: 'Getting Started',
          message: 'Check out your dashboard to see assigned tasks',
          type: 'info',
          read: false,
          createdAt: new Date(Date.now() - 7200000)
        }
      ];
    }
    
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Notifications error:', error);
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