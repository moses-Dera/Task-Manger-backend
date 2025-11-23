const express = require('express');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get application logs (Admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    // Mock log data - in a real app, you'd read from log files or database
    const mockLogs = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'User login successful',
        source: 'auth.controller',
        details: 'User authentication completed successfully'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        level: 'warning',
        message: 'High memory usage detected',
        source: 'system.monitor',
        details: 'Memory usage at 85% - consider optimization'
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 600000).toISOString(),
        level: 'error',
        message: 'Database connection timeout',
        source: 'database.connection',
        details: 'Connection to MongoDB timed out after 30 seconds'
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 900000).toISOString(),
        level: 'success',
        message: 'Task completed successfully',
        source: 'task.controller',
        details: 'Task ID 12345 marked as completed by user'
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        level: 'info',
        message: 'New user registration',
        source: 'auth.controller',
        details: 'New employee account created'
      }
    ];

    const { level } = req.query;
    let filteredLogs = mockLogs;
    
    if (level && level !== 'all') {
      filteredLogs = mockLogs.filter(log => log.level === level);
    }

    res.json({ success: true, data: filteredLogs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;