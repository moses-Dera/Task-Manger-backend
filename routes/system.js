const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Task = require('../models/Task');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

// Get system metrics (Admin only)
router.get('/metrics', auth, authorize('admin'), async (req, res) => {
  try {
    const company = req.user.company;

    // Get real task statistics
    const [totalTasks, completedTasks, pendingTasks, overdueTasks] = await Promise.all([
      Task.countDocuments({ company }),
      Task.countDocuments({ company, status: 'completed' }),
      Task.countDocuments({ company, status: 'pending' }),
      Task.countDocuments({ company, status: 'overdue' })
    ]);

    // Get user statistics
    const [totalUsers, activeUsers] = await Promise.all([
      User.countDocuments({ company }),
      User.countDocuments({ company, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } })
    ]);

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Get task distribution
    const taskDistribution = {
      completed: completedTasks,
      pending: pendingTasks,
      overdue: overdueTasks,
      'in-progress': totalTasks - completedTasks - pendingTasks - overdueTasks
    };

    res.json({
      success: true,
      data: {
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        pending_tasks: pendingTasks,
        overdue_tasks: overdueTasks,
        completion_rate: completionRate,
        total_users: totalUsers,
        active_users: activeUsers,
        task_distribution: taskDistribution,
        // Note: Resource metrics (CPU, memory, DB) would require system monitoring tools
        // For now, we'll omit these or use placeholder values
        db_storage: 0, // Requires MongoDB stats
        cpu_load: 0,   // Requires system monitoring
        memory_usage: 0 // Requires system monitoring
      }
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch metrics' });
  }
});

// Get activity logs (Admin only)
router.get('/activity-logs', auth, authorize('admin'), async (req, res) => {
  try {
    const company = req.user.company;
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    const logs = await ActivityLog.find({ company })
      .populate('user_id', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Format logs for frontend
    const formattedLogs = logs.map(log => ({
      time: new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: `${log.user_id?.name || 'Unknown'} ${log.action}`,
      details: log.details,
      timestamp: log.createdAt
    }));

    res.json({
      success: true,
      data: formattedLogs,
      total: await ActivityLog.countDocuments({ company })
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activity logs' });
  }
});

module.exports = router;