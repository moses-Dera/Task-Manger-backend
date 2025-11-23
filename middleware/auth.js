const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Simple in-memory cache for user lookups (clears every 5 minutes)
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedUser = (userId) => {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }
  userCache.delete(userId);
  return null;
};

const setCachedUser = (userId, user) => {
  userCache.set(userId, { user, timestamp: Date.now() });
  // Auto-cleanup old entries
  if (userCache.size > 1000) {
    const oldestKey = userCache.keys().next().value;
    userCache.delete(oldestKey);
  }
};

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Try to get user from cache first
    let user = getCachedUser(decoded.userId);
    
    // If not in cache, fetch from database and cache it
    if (!user) {
      user = await User.findById(decoded.userId).lean(); // Use .lean() for faster queries
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
      }
      setCachedUser(decoded.userId, user);
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access forbidden' });
    }
    next();
  };
};

module.exports = { auth, authorize };