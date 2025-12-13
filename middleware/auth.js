const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('name email companies currentCompany').lean();

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // Derive role and company from the companies array based on currentCompany
    if (user.currentCompany && user.companies) {
      const activeCompany = user.companies.find(c => c.company.toString() === user.currentCompany.toString());
      if (activeCompany) {
        user.role = activeCompany.role;
        user.company = activeCompany.company;
        user.department = activeCompany.department;
      }
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