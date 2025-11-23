const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// Test endpoint
router.post('/test', auth, async (req, res) => {
  try {
    console.log('TEST ENDPOINT - User:', req.user);
    console.log('TEST ENDPOINT - Body:', req.body);
    
    const testTask = {
      title: 'Test Task',
      description: 'Test Description',
      priority: 'medium',
      assigned_to: req.user._id,
      created_by: req.user._id,
      company: req.user.company
    };
    
    const task = await Task.create(testTask);
    res.json({ success: true, message: 'Test task created', data: task });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get tasks
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = { company: req.user.company };

    if (req.user.role === 'employee') {
      query.assigned_to = req.user._id;
    }
    if (status) query.status = status;

    const tasks = await Task.find(query)
      .populate('assigned_to', 'name')
      .populate('created_by', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Create task
router.post('/', auth, async (req, res) => {
  try {
    let assigned_to = req.user._id;
    
    if (req.body.assigned_to) {
      const assignedUser = await User.findOne({ username: req.body.assigned_to, company: req.user.company });
      if (assignedUser) {
        assigned_to = assignedUser._id;
      }
    }
    
    const task = await Task.create({
      title: req.body.title || 'Default Task',
      description: req.body.description || '',
      priority: req.body.priority || 'medium',
      assigned_to,
      created_by: req.user._id,
      company: req.user.company
    });
    
    // Get updated task count for the assigned user
    const taskCount = await Task.countDocuments({ assigned_to, company: req.user.company });
    
    res.json({ 
      success: true, 
      data: task,
      updatedTaskCount: taskCount,
      assignedUserId: assigned_to
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Get single task
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, company: req.user.company })
      .populate('assigned_to', 'name')
      .populate('created_by', 'name')
      .lean();
    
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      req.body,
      { new: true }
    ).lean();

    if (!updatedTask) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({ success: true, data: updatedTask });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Upload file to task (mock implementation)
router.post('/:id/files', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, company: req.user.company });
    
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Mock file upload - in a real app, you'd use multer and cloud storage
    const mockFile = {
      id: Date.now().toString(),
      name: 'uploaded-file.pdf',
      size: '2.5 MB',
      uploadedBy: req.user.name,
      uploadedAt: new Date().toISOString()
    };

    res.json({ success: true, data: mockFile });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get task files (mock implementation)
router.get('/:id/files', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, company: req.user.company });
    
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Mock files - in a real app, you'd fetch from database
    const mockFiles = [
      {
        id: '1',
        name: 'requirements.pdf',
        size: '1.2 MB',
        uploadedBy: 'John Doe',
        uploadedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '2',
        name: 'design-mockup.png',
        size: '3.4 MB',
        uploadedBy: 'Jane Smith',
        uploadedAt: new Date(Date.now() - 172800000).toISOString()
      }
    ];

    res.json({ success: true, data: mockFiles });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get employee performance stats
router.get('/performance/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    
    // Get all tasks for the employee
    const allTasks = await Task.find({ assigned_to: userId, company: req.user.company }).lean();
    
    // Calculate stats
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(task => task.status === 'completed').length;
    const onTimeCompleted = allTasks.filter(task => 
      task.status === 'completed' && 
      task.due_date && 
      task.updatedAt <= new Date(task.due_date)
    ).length;
    
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const onTimeRate = completedTasks > 0 ? Math.round((onTimeCompleted / completedTasks) * 100) : 0;
    
    // Calculate performance score (A+, A, B, C)
    let performanceScore = 'N/A';
    if (totalTasks > 0) {
      const score = (completionRate * 0.7) + (onTimeRate * 0.3);
      performanceScore = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : 'C';
    }
    
    // Calculate streak (consecutive days with completed tasks)
    const completedByDate = {};
    allTasks.filter(task => task.status === 'completed' && task.updatedAt).forEach(task => {
      const date = new Date(task.updatedAt).toDateString();
      completedByDate[date] = true;
    });
    
    let streak = 0;
    const currentDate = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(currentDate);
      checkDate.setDate(checkDate.getDate() - i);
      if (completedByDate[checkDate.toDateString()]) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    // Generate weekly performance trend (last 4 weeks)
    const weeklyData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7) - 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const weekTasks = allTasks.filter(task => {
        const taskDate = new Date(task.updatedAt);
        return taskDate >= weekStart && taskDate < weekEnd && task.status === 'completed';
      }).length;
      
      weeklyData.push({
        name: `Week ${4 - i}`,
        value: weekTasks
      });
    }
    
    const data = {
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      completion_rate: completionRate,
      on_time_completion: onTimeRate,
      performance_score: performanceScore,
      streak_days: streak,
      weekly_performance: weeklyData
    };
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Performance stats error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;