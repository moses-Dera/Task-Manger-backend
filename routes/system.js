const express = require('express');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get system metrics (Admin only)
router.get('/metrics', auth, authorize('admin'), async (req, res) => {
  try {
    // Mock system metrics - in a real app, you'd get actual system stats
    const metrics = {
      cpu_usage: Math.floor(Math.random() * 30) + 20, // 20-50%
      memory_usage: Math.floor(Math.random() * 40) + 40, // 40-80%
      disk_usage: Math.floor(Math.random() * 20) + 60, // 60-80%
      db_storage: Math.floor(Math.random() * 30) + 45, // 45-75 GB
      active_users: Math.floor(Math.random() * 50) + 100,
      requests_per_minute: Math.floor(Math.random() * 200) + 300,
      uptime: '15 days, 4 hours, 23 minutes',
      last_backup: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      server_status: 'healthy'
    };

    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get activity logs (Admin only)
router.get('/activity-logs', auth, authorize('admin'), async (req, res) => {
  try {
    // Mock activity logs
    const activityLogs = [
      {
        time: new Date().toLocaleTimeString(),
        action: 'User john.doe@company.com logged in'
      },
      {
        time: new Date(Date.now() - 300000).toLocaleTimeString(),
        action: 'Task "Complete project documentation" was created'
      },
      {
        time: new Date(Date.now() - 600000).toLocaleTimeString(),
        action: 'User jane.smith@company.com updated profile'
      },
      {
        time: new Date(Date.now() - 900000).toLocaleTimeString(),
        action: 'System backup completed successfully'
      },
      {
        time: new Date(Date.now() - 1200000).toLocaleTimeString(),
        action: 'New employee invited: newuser@company.com'
      }
    ];

    res.json({ success: true, data: activityLogs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;