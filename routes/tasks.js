const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

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
    const { title, description, priority, due_date, assigned_to } = req.body;
    
    if (!title || !assigned_to) {
      return res.status(400).json({ success: false, error: 'Title and assigned user required' });
    }

    // Validate assigned_to user exists and belongs to same company
    const assignedUser = await User.findById(assigned_to);
    if (!assignedUser) {
      return res.status(400).json({ success: false, error: 'Assigned user not found' });
    }
    if (assignedUser.company !== req.user.company) {
      return res.status(400).json({ success: false, error: 'Cannot assign task to user from different company' });
    }

    const task = await Task.create({
      title,
      description: description || '',
      priority: priority || 'medium',
      due_date: due_date || null,
      assigned_to,
      created_by: req.user._id,
      company: req.user.company
    });
    
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error' });
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

module.exports = router;