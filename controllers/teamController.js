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
    console.error('Get employees error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch employees' });
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
    console.error('Get performance error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch performance data' });
  }
};

const assignTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Team assign validation errors:', errors.array());
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    console.log('=== TEAM ASSIGN TASK DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Manager info:', {
      id: req.user._id,
      role: req.user.role,
      company: req.user.company
    });

    // Verify assigned_to user exists and is in same company
    const assignedUser = await User.findById(req.body.assigned_to);
    if (!assignedUser) {
      console.log('Team assign - user not found:', req.body.assigned_to);
      return res.status(400).json({ success: false, error: 'Employee not found' });
    }
    
    if (assignedUser.company !== req.user.company) {
      console.log('Team assign - company mismatch');
      return res.status(400).json({ success: false, error: 'Cannot assign task to employee from different company' });
    }

    const taskData = {
      title: req.body.title,
      description: req.body.description || '',
      priority: req.body.priority || 'medium',
      due_date: req.body.due_date,
      assigned_to: req.body.assigned_to,
      created_by: req.user._id,
      company: req.user.company,
      status: 'pending'
    };

    console.log('Team task data:', JSON.stringify(taskData, null, 2));

    const task = new Task(taskData);
    await task.save();
    
    const populatedTask = await Task.findById(task._id)
      .populate('assigned_to', 'name email')
      .populate('created_by', 'name email');
    
    console.log('Team task created:', populatedTask._id);
    
    res.status(201).json({ success: true, data: populatedTask });
  } catch (error) {
    console.error('=== TEAM ASSIGN ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ success: false, error: 'Failed to assign task: ' + error.message });
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

    const tempPassword = crypto.randomBytes(8).toString('hex'); // Shorter password for better UX
    const user = new User({
      name: email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' '), // Clean up name
      email,
      password: tempPassword,
      role,
      company: req.user.company
    });
    
    await user.save();

    console.log(`\n[TEAM] 📧 Inviting user: ${email} with role: ${role}`);
    console.log(`[TEAM] 🔑 Temporary password: ${tempPassword}`);
    console.log(`[TEAM] 🏢 Company: ${req.user.company}`);
    
    // Send invite email asynchronously (non-blocking)
    sendWelcomeEmail(user).catch(error => 
      console.error('Invitation email failed for:', user.email, error.message)
    );
    
    res.json({ 
      success: true, 
      message: 'User invited successfully! Invitation email sent.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tempPassword: tempPassword
      }
    });
    
  } catch (error) {
    console.error('[TEAM] Invite error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
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