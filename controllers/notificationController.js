const { validationResult } = require('express-validator');
const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const markAsRead = async (req, res) => {
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
};

const createNotification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const notification = new Notification(req.body);
    await notification.save();

    // Emit real-time notification via Socket.io
    const io = req.app.get('io');
    if (io && io.emitNotification) {
      io.emitNotification(req.body.user_id, {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        timestamp: notification.createdAt
      });
    }

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  createNotification
};