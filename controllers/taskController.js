const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const TaskFile = require('../models/TaskFile');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { createActivityLog } = require('../middleware/activityLogger');

const getTasks = async (req, res) => {
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
      .sort({ createdAt: -1 });

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
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
      created_by: req.user._id,
      company: req.user.company
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assigned_to', 'name')
      .populate('created_by', 'name');

    // Create notification for assigned employee
    try {
      const assignedUser = await User.findById(req.body.assigned_to);
      if (assignedUser) {
        const notification = new Notification({
          user_id: assignedUser._id,
          title: 'New Task Assigned',
          message: `You have been assigned a new task: "${task.title}"`,
          type: 'task',
          read: false
        });
        await notification.save();
        console.log('Notification created for user:', assignedUser.name);

        // Emit real-time notification via Socket.io
        const io = req.app.get('io');
        if (io && io.emitNotification) {
          io.emitNotification(assignedUser._id, {
            id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            timestamp: notification.createdAt
          });
        }
      }
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the task creation if notification fails
    }

    // Log task creation activity
    createActivityLog(req.user, 'created task', `Task "${task.title}" assigned to ${populatedTask.assigned_to.name}`);

    res.status(201).json({ success: true, data: populatedTask });
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
};

const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, company: req.user.company })
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
    const task = await Task.findOne({ _id: req.params.id, company: req.user.company });
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    if (req.user.role === 'employee' && task.assigned_to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      req.body,
      { new: true }
    )
      .populate('assigned_to', 'name')
      .populate('created_by', 'name');

    res.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, error: 'Failed to update task' });
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