const { validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const Task = require('../models/Task');
const { sendWelcomeEmail } = require('../utils/emailService');

const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee', company: req.user.company })
      .select('name email role')
      .lean();

    const employeesWithStats = await Promise.all(employees.map(async (employee) => {
      const tasksAssigned = await Task.countDocuments({ assigned_to: employee._id, company: req.user.company });
      const tasksCompleted = await Task.countDocuments({ assigned_to: employee._id, status: 'completed', company: req.user.company });
      
      let performanceScore = 'N/A';
      if (tasksAssigned > 0) {
        const completionRate = (tasksCompleted / tasksAssigned) * 100;
        performanceScore = completionRate >= 90 ? 'A+' : completionRate >= 80 ? 'A' : completionRate >= 70 ? 'B' : 'C';
      }
      
      return {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        tasks_assigned: tasksAssigned,
        tasks_completed: tasksCompleted,
        performance_score: performanceScore
      };
    }));

    res.json({ success: true, data: employeesWithStats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const getPerformance = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments({ company: req.user.company });
    const completedTasks = await Task.countDocuments({ company: req.user.company, status: 'completed' });
    const pendingTasks = await Task.countDocuments({ company: req.user.company, status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ company: req.user.company, status: 'in-progress' });
    const overdueTasks = await Task.countDocuments({ company: req.user.company, status: 'overdue' });

    const data = {
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      pending_tasks: pendingTasks,
      in_progress_tasks: inProgressTasks,
      overdue_tasks: overdueTasks,
      completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const assignTask = async (req, res) => {
  try {
    const { title, description, priority, due_date, assigned_to } = req.body;
    
    if (!title || !assigned_to) {
      return res.status(400).json({ success: false, error: 'Title and assigned user required' });
    }

    const task = await Task.create({
      title,
      description: description || '',
      priority: priority || 'medium',
      due_date,
      assigned_to,
      created_by: req.user._id,
      company: req.user.company
    });
    
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const inviteUser = async (req, res) => {
  try {
    const { email, role = 'employee' } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const tempPassword = crypto.randomBytes(6).toString('hex');
    const user = await User.create({
      name: email.split('@')[0],
      email,
      password: tempPassword,
      role,
      company: req.user.company
    });
    
    // Send email asynchronously
    sendWelcomeEmail(user).catch(() => {});
    
    res.json({ 
      success: true, 
      message: 'User invited successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role, phone, department } = req.body;

    // Verify user has permission (admin or manager can only edit their own company)
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (targetUser.company !== req.user.company && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (department !== undefined) updateData.department = department;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user has permission
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (targetUser.company !== req.user.company && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Prevent deleting own account
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(userId);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  getEmployees,
  getPerformance,
  assignTask,
  inviteUser,
  updateUser,
  deleteUser
};