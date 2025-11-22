const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const TaskFile = require('../models/TaskFile');

const getTasks = async (req, res) => {
  try {
    const { status, tab } = req.query;
    let query = {};

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
      .sort({ createdAt: -1 });

    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const task = new Task({
      ...req.body,
      created_by: req.user._id
    });
    
    await task.save();
    await task.populate(['assigned_to', 'created_by'], 'name');
    
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const getTask = async (req, res) => {
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
};

const updateTask = async (req, res) => {
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

    res.json({ success: true, data: updatedTask });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const uploadTaskFile = async (req, res) => {
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
};

const getTaskFiles = async (req, res) => {
  try {
    const files = await TaskFile.find({ task_id: req.params.id })
      .populate('uploaded_by', 'name');
    res.json({ success: true, data: files });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  getTasks,
  createTask,
  getTask,
  updateTask,
  uploadTaskFile,
  getTaskFiles
};