const { validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const Task = require('../models/Task');
const { sendWelcomeEmail } = require('../utils/emailService');

const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee', company: req.user.company }).select('-password');
    
    const employeesWithStats = await Promise.all(employees.map(async (employee) => {
      const tasksAssigned = await Task.countDocuments({ assigned_to: employee._id, company: req.user.company });
      const tasksCompleted = await Task.countDocuments({ assigned_to: employee._id, status: 'completed', company: req.user.company });
      
      let performanceScore = 'N/A';
      let performanceLabel = 'No tasks assigned';
      
      if (tasksAssigned > 0) {
        const completionRate = (tasksCompleted / tasksAssigned) * 100;
        if (completionRate >= 90) {
          performanceScore = 'A+';
          performanceLabel = 'Excellent';
        } else if (completionRate >= 80) {
          performanceScore = 'A';
          performanceLabel = 'Very Good';
        } else if (completionRate >= 70) {
          performanceScore = 'B';
          performanceLabel = 'Good';
        } else if (completionRate >= 60) {
          performanceScore = 'C';
          performanceLabel = 'Satisfactory';
        } else {
          performanceScore = 'D';
          performanceLabel = 'Needs Improvement';
        }
      }
      
      return {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        tasks_assigned: tasksAssigned,
        tasks_completed: tasksCompleted,
        completion_rate: tasksAssigned > 0 ? ((tasksCompleted / tasksAssigned) * 100).toFixed(1) : 0,
        performance_score: performanceScore,
        performance_label: performanceLabel
      };
    }));

    res.json({ success: true, data: employeesWithStats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const getPerformance = async (req, res) => {
  try {
    const companyFilter = { company: req.user.company };
    const totalTasks = await Task.countDocuments(companyFilter);
    const completedTasks = await Task.countDocuments({ ...companyFilter, status: 'completed' });
    const pendingTasks = await Task.countDocuments({ ...companyFilter, status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ ...companyFilter, status: 'in-progress' });
    const overdueTasks = await Task.countDocuments({ ...companyFilter, status: 'overdue' });

    res.json({
      success: true,
      data: {
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        pending_tasks: pendingTasks,
        in_progress_tasks: inProgressTasks,
        overdue_tasks: overdueTasks,
        completion_rate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const assignTask = async (req, res) => {
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
    await task.populate(['assigned_to', 'created_by'], 'name');
    
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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const tempPassword = crypto.randomBytes(12).toString('hex');
    const user = new User({
      name: email.split('@')[0],
      email,
      password: tempPassword,
      role,
      company: req.user.company
    });
    
    await user.save();

    console.log(`[Team] Inviting user: ${email} with role: ${role}`);
    
    // Send invite email asynchronously
    sendWelcomeEmail(user, tempPassword)
      .then(() => {
        console.log('[Team] ✓ Invitation email sent successfully to:', email);
      })
      .catch(emailError => {
        console.error('[Team] ✗ Failed to send invitation email to', email);
        console.error('[Team] Email Error:', emailError.message);
      });
    
    res.json({ success: true, message: 'User invited successfully' });
  } catch (error) {
    console.error('[Team] Invite error:', error);
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