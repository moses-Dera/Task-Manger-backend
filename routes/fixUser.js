const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Fix user by adding company field
router.post('/fix-user', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { 
      company: req.body.company || 'default' 
    });
    
    res.json({ success: true, message: 'User updated with company' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;