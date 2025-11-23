const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const TaskFile = require('../models/TaskFile');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { cacheResponse, invalidateCache } = require('../middleware/cache');

const router = express.Router();

// Test route
router.get('/test', auth, (req, res) => {
  res.json({ success: true, message: 'Tasks API working', user: req.user.name });
});

// File upload configuration
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Get tasks
router.get('/', auth, async (req, res) => {
  try {
    const { status, tab } = req.query;
    let query = { company: req.user.company };

    if (req.user.role === 'employee') {
      query.assigned_to = req.user._id;
    }

    if (status) query.status = status;
    
    if (tab === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.due_date = { $gte: today, $lt: tomorrow };
    }

    const tasks = await Task.find(query)
      .populate('assigned_to', 'name')
      .populate('created_by', 'name')
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for faster queries

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
});

// Create task - simplified
router.post('/', auth, async (req, res) => {
  try {
    console.log('=== SIMPLE TASK CREATION ===');
    console.log('Body:', req.body);
    console.log('User:', req.user.name, req.user.role);

    if (!req.body.title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    
    if (!req.body.assigned_to) {
      return res.status(400).json({ success: false, error: 'Assigned user is required' });
    }

    const task = new Task({
      title: req.body.title,
      description: req.body.description || '',
      priority: req.body.priority || 'medium',
      due_date: req.body.due_date,
      assigned_to: req.body.assigned_to,
      created_by: req.user._id,
      company: req.user.company,
      status: 'pending'
    });
    
    await task.save();
    console.log('Task saved:', task._id);
    
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error('Task creation error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single task
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assigned_to', 'name')
      .populate('created_by', 'name');
    
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    if (req.user.role === 'employee' && task.assigned_to._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    if (req.user.role === 'employee' && task.assigned_to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assigned_to', 'name')
      .populate('created_by', 'name');

    // Invalidate cache when task is updated
    await invalidateCache('/api/tasks*');

    res.json({ success: true, data: updatedTask });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Upload task file
router.post('/:id/files', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const taskFile = new TaskFile({
      task_id: req.params.id,
      filename: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      uploaded_by: req.user._id
    });

    await taskFile.save();
    res.status(201).json({ success: true, data: taskFile });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get task files
router.get('/:id/files', auth, async (req, res) => {
  try {
    const files = await TaskFile.find({ task_id: req.params.id })
      .populate('uploaded_by', 'name');
    res.json({ success: true, data: files });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;