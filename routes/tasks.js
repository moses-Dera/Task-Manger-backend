const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const mongoose = require('mongoose');
const TaskFile = require('../models/TaskFile');
const { upload } = require('../config/cloudinary');

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
    const { status, assigned_to, start_date, end_date } = req.query;
    let query = { company: req.user.company };

    console.log('=== TASK FETCH ===');
    console.log('User:', { id: req.user._id, role: req.user.role, company: req.user.company });

    if (req.user.role === 'employee') {
      query.assigned_to = req.user._id;
      console.log('Employee query:', query);
    } else {
      // For managers/admins, allow filtering by assigned_to
      if (assigned_to) {
        query.assigned_to = assigned_to;
      }
    }

    if (status && status !== 'all') query.status = status;

    // Date Range Filtering (createdAt)
    if (start_date || end_date) {
      query.createdAt = {};
      if (start_date) {
        query.createdAt.$gte = new Date(start_date);
      }
      if (end_date) {
        // Set to end of the day
        const end = new Date(end_date);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const tasks = await Task.find(query)
      .populate('assigned_to', 'name')
      .populate('created_by', 'name')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${tasks.length} tasks for user`);
    console.log('Tasks:', tasks.map(t => ({ id: t._id, title: t.title, assigned_to: t.assigned_to })));

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Task fetch error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Create task
router.post('/', auth, async (req, res) => {
  try {
    let assigned_to = req.user._id;

    console.log('=== TASK CREATION ===');
    console.log('Request body:', req.body);
    console.log('Creator:', { id: req.user._id, role: req.user.role, company: req.user.company });

    if (req.body.assigned_to) {
      // Check if it's a valid ObjectId (from manager dashboard)
      if (mongoose.Types.ObjectId.isValid(req.body.assigned_to)) {
        console.log('Using ObjectId for assignment:', req.body.assigned_to);
        assigned_to = req.body.assigned_to;
      } else {
        // Fallback: search by username or name
        console.log('Searching for user by username/name:', req.body.assigned_to);
        const assignedUser = await User.findOne({
          $or: [
            { username: req.body.assigned_to },
            { name: { $regex: new RegExp(req.body.assigned_to, 'i') } },
            { email: req.body.assigned_to }
          ],
          company: req.user.company
        });
        if (assignedUser) {
          console.log('Found user:', { id: assignedUser._id, name: assignedUser.name });
          assigned_to = assignedUser._id;
        } else {
          console.log('User not found, using creator ID');
        }
      }
    }

    // Validate and sanitize input
    const title = req.body.title ? req.body.title.trim().substring(0, 200) : 'Default Task';
    const description = req.body.description ? req.body.description.trim().substring(0, 1000) : '';
    const priority = ['low', 'medium', 'high'].includes(req.body.priority) ? req.body.priority : 'medium';

    const task = await Task.create({
      title,
      description,
      priority,
      assigned_to,
      created_by: req.user._id,
      company: req.user.company,
      due_date: req.body.due_date || null
    });

    console.log('Task created:', { id: task._id, title: task.title, assigned_to: task.assigned_to });

    // Get updated task count for the assigned user
    const taskCount = await Task.countDocuments({ assigned_to, company: req.user.company });

    res.json({
      success: true,
      data: task,
      updatedTaskCount: taskCount,
      assignedUserId: assigned_to
    });
  } catch (error) {
    console.error('Task creation error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: 'Invalid task data provided' });
    }
    res.status(500).json({ success: false, error: error.message });
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

    const io = req.app.get('io');
    if (io) {
      // Notify the assigned user
      io.emitTaskUpdate(updatedTask.assigned_to, {
        taskId: updatedTask._id,
        action: 'updated',
        status: updatedTask.status
      });

      // If reassigned, notify the new user too (optional, but good practice)
      // For now focusing on performance trend which relies on status updates
    }

    res.json({ success: true, data: updatedTask });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Upload file to task
router.post('/:id/files', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const task = await Task.findOne({ _id: req.params.id, company: req.user.company });

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const taskFile = new TaskFile({
      task_id: task._id,
      filename: req.file.originalname,
      file_path: req.file.path, // Cloudinary URL
      file_size: req.file.size,
      uploaded_by: req.user._id
    });

    await taskFile.save();

    // Update task submission URL if it's a submission
    // (Optional: logic to determine if this is a submission or just an attachment)
    // For now, let's assume if the employee assigned to the task uploads it, it might be a submission
    if (task.assigned_to.toString() === req.user._id.toString()) {
      task.submission_url = req.file.path;
      task.submission_date = new Date();
      task.status = 'completed'; // Auto-complete on submission? Or maybe just update status
      await task.save();

      const io = req.app.get('io');
      if (io) {
        io.emitTaskUpdate(task.assigned_to, {
          taskId: task._id,
          action: 'updated',
          status: 'completed'
        });
      }
    }

    res.status(201).json({ success: true, data: taskFile });
  } catch (error) {
    console.error('Task file upload error:', error);
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

    const files = await TaskFile.find({ task_id: task._id })
      .populate('uploaded_by', 'name')
      .sort({ createdAt: -1 });

    const fileData = files.map(file => ({
      id: file._id,
      name: file.filename,
      size: file.file_size,
      mimeType: file.mime_type || 'application/octet-stream',
      uploaded_by: file.uploaded_by,
      uploadedAt: file.createdAt,
      filename: file.filename,
      url: file.file_path // Return the Cloudinary URL
    }));

    res.json({ success: true, data: fileData });
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