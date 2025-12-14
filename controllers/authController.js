const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
const { sendWelcomeEmail, sendPasswordResetEmail, sendPasswordResetConfirmation } = require('../utils/emailService');
const { createActivityLog } = require('../middleware/activityLogger');

const signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { name, email, password, role, company } = req.body;

    if (!company) {
      return res.status(400).json({ success: false, error: 'Company is required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    let companyId;
    let companyName;

    // Check if company input is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(company)) {
      const existingCompany = await Company.findById(company);
      if (!existingCompany) {
        return res.status(400).json({ success: false, error: 'Invalid company ID' });
      }
      companyId = existingCompany._id;
      companyName = existingCompany.name;
    } else {
      // Treat as new company name
      const newCompany = await Company.create({
        name: company,
        email: `contact@${company.replace(/\s+/g, '').toLowerCase()}.com` // Placeholder email
      });
      companyId = newCompany._id;
      companyName = newCompany.name;
    }

    // Create user with correct schema structure (multi-tenant)
    const user = new User({
      name,
      email,
      password,
      companies: [{
        company: companyId,
        role: role || 'employee',
        isActive: true,
        joinedAt: new Date()
      }],
      currentCompany: companyId
    });
    await user.save();

    console.log('=== SIGNUP WELCOME EMAIL ===');
    console.log('User created:', { id: user._id, name: user.name, email: user.email });
    console.log('Attempting to send welcome email...');

    const token = jwt.sign({ userId: user._id, email: user.email, role: role || 'employee', company: companyId },
      process.env.JWT_SECRET, { expiresIn: '24h' });

    // Generate Magic Token (expires in 1 hour)
    const magicToken = jwt.sign(
      { userId: user._id, type: 'magic-link' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Prepare user object for email
    const userForEmail = {
      ...user.toObject(),
      role: role || 'employee',
      company: companyName,
      magicToken // Pass token to email service
    };

    // Send welcome email asynchronously (non-blocking)
    sendWelcomeEmail(userForEmail).then(() => {
      console.log('✅ Signup welcome email sent successfully to:', user.email);
    }).catch(error => {
      console.error('❌ Signup welcome email failed for:', user.email);
      console.error('Error details:', error.message);
    });

    // Log signup activity
    createActivityLog(user, 'signed up', `New ${role || 'employee'} account created`);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: role || 'employee', company: companyName }
    });
  } catch (error) {
    console.error('[Auth] Signup error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ success: false, error: 'Invalid credentials' });
    }

    // Find the active company details
    const activeCompany = user.companies.find(c =>
      c.company.toString() === user.currentCompany.toString()
    );

    if (!activeCompany) {
      return res.status(400).json({ success: false, error: 'User has no active company' });
    }

    // Fetch company details to get the name
    const companyDetails = await Company.findById(activeCompany.company);
    const companyName = companyDetails ? companyDetails.name : 'Unknown Company';

    const role = activeCompany.role;
    const company = activeCompany.company;

    const token = jwt.sign({ userId: user._id, email: user.email, role, company },
      process.env.JWT_SECRET, { expiresIn: '24h' });

    // Log login activity
    createActivityLog(user, 'logged in', 'User authentication successful');

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role, company: companyName }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Find active company to get role and company ID
    const activeCompany = user.companies.find(c =>
      c.company.toString() === user.currentCompany.toString()
    );

    let companyName = 'Unknown Company';
    if (activeCompany) {
      const companyDetails = await Company.findById(activeCompany.company);
      if (companyDetails) {
        companyName = companyDetails.name;
      }
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: activeCompany ? activeCompany.role : 'employee',
        company: companyName,
        profilePicture: user.profilePicture,
        phone: user.phone,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, error: 'User does not exist' });
    }

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    try {
      await sendPasswordResetEmail(user, resetToken);
      res.json({ success: true, message: 'Reset link sent to your email' });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      res.status(500).json({ success: false, error: 'Failed to send reset link' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { token, password } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.findByIdAndUpdate(decoded.id, { password: hashedPassword }, { new: true });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    try {
      await sendPasswordResetConfirmation(user);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const verifyMagicLink = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }

    // Verify the magic token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's a magic token (optional, if we add a type claim)
    // For now, we just check if the user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Find active company
    const activeCompany = user.companies.find(c =>
      c.company.toString() === user.currentCompany.toString()
    );

    if (!activeCompany) {
      return res.status(400).json({ success: false, error: 'User has no active company' });
    }

    // Fetch company details
    const companyDetails = await Company.findById(activeCompany.company);
    const companyName = companyDetails ? companyDetails.name : 'Unknown Company';

    // Generate session token (standard login token)
    const sessionToken = jwt.sign(
      { userId: user._id, email: user.email, role: activeCompany.role, company: activeCompany.company },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log activity
    createActivityLog(user, 'logged in', 'User logged in via Magic Link');

    res.json({
      success: true,
      token: sessionToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: activeCompany.role,
        company: companyName
      }
    });

  } catch (error) {
    console.error('Magic link verification error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ success: false, error: 'Invalid or expired link' });
    }
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  signup,
  login,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  verifyMagicLink
};