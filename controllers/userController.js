const { validationResult } = require('express-validator');
const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { name, email, phone, department } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (department !== undefined) updateData.department = department;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true }).select('-password');
    res.json({ success: true, user: user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const getSettings = async (req, res) => {
  try {
    // Return default settings or user-specific settings
    const defaultSettings = {
      language: 'english',
      emailNotifications: true,
      pushNotifications: true,
      meetingReminders: true,
      profileVisibility: true,
      activityStatus: true,
      theme: 'light'
    };
    
    res.json({ success: true, data: defaultSettings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const updateSettings = async (req, res) => {
  try {
    // In a real app, you'd save settings to database
    // For now, just return success
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getSettings,
  updateSettings,
  changePassword
};