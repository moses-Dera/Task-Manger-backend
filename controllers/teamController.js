const { validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const Task = require('../models/Task');

const Notification = require('../models/Notification');
const { sendWelcomeEmail, sendMeetingNotification } = require('../utils/emailService');

const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({
      'companies.company': req.user.company,
      'companies.role': 'employee'
    })
      .select('name email companies phone department profilePicture')
      .lean();

    const employeesWithStats = await Promise.all(employees.map(async (employee) => {
      const tasksAssigned = await Task.countDocuments({ assigned_to: employee._id, company: req.user.company });
      const tasksCompleted = await Task.countDocuments({ assigned_to: employee._id, status: 'completed', company: req.user.company });

      let performanceScore = 'N/A';
      if (tasksAssigned > 0) {
        const completionRate = (tasksCompleted / tasksAssigned) * 100;
        performanceScore = completionRate >= 90 ? 'A+' : completionRate >= 80 ? 'A' : completionRate >= 70 ? 'B' : 'C';
      }

      // Calculate Streak
      // Get all completed tasks sorted by date
      const completedTasksList = await Task.find({
        assigned_to: employee._id,
        status: 'completed',
        company: req.user.company
      }).sort({ updatedAt: -1 }).select('updatedAt');

      let currentStreak = 0;
      let streakActive = false;

      if (completedTasksList.length > 0) {
        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        // Check if a task was completed today or yesterday to keep streak alive
        const lastTaskDate = new Date(completedTasksList[0].updatedAt);
        lastTaskDate.setHours(0, 0, 0, 0);

        if (lastTaskDate.getTime() === today.getTime() || lastTaskDate.getTime() === yesterday.getTime()) {
          streakActive = true;
          currentStreak = 1;

          // Check previous days
          let checkDate = new Date(lastTaskDate);
          checkDate.setDate(checkDate.getDate() - 1);

          for (let i = 1; i < completedTasksList.length; i++) {
            const taskDate = new Date(completedTasksList[i].updatedAt);
            taskDate.setHours(0, 0, 0, 0);

            if (taskDate.getTime() === checkDate.getTime()) {
              currentStreak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else if (taskDate.getTime() > checkDate.getTime()) {
              // Multiple tasks on same day, continue
              continue;
            } else {
              // Streak broken
              break;
            }
          }
        }
      }

      // Find the role for this specific company
      const companyInfo = employee.companies.find(c => c.company.toString() === req.user.company.toString());
      const role = companyInfo ? companyInfo.role : 'employee';

      return {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        profilePicture: employee.profilePicture,
        role: role,
        tasks_assigned: tasksAssigned,
        tasks_completed: tasksCompleted,
        performance_score: performanceScore,
        currentStreak,
        streakActive,
        phone: employee.phone || 'N/A',
        department: employee.department || 'N/A'
      };
    }));

    res.json({ success: true, data: employeesWithStats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const getPerformance = async (req, res) => {
  try {
    const now = new Date();

    // Get all tasks for the company
    const allTasks = await Task.find({ company: req.user.company }).lean();
    console.log(`Found ${allTasks.length} tasks for company: ${req.user.company}`);

    // Calculate stats
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(task => task.status === 'completed').length;
    const pendingTasks = allTasks.filter(task => task.status === 'pending').length;
    const inProgressTasks = allTasks.filter(task => task.status === 'in-progress').length;

    // Calculate overdue tasks (past due date and not completed)
    const overdueTasks = allTasks.filter(task =>
      task.due_date &&
      new Date(task.due_date) < now &&
      task.status !== 'completed'
    ).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    console.log(`Performance stats: ${completedTasks}/${totalTasks} = ${completionRate}%`);

    // Generate daily performance trend (last 14 days)
    const weeklyData = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const dayTasks = allTasks.filter(task => {
        const taskDate = new Date(task.updatedAt || task.createdAt);
        return taskDate >= startOfDay && taskDate <= endOfDay && task.status === 'completed';
      }).length;

      // Format name as "Mon 14" or similar
      const dayName = startOfDay.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

      weeklyData.push({
        name: dayName,
        value: dayTasks,
        fullDate: dateStr
      });
    }

    const data = {
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      pending_tasks: pendingTasks,
      in_progress_tasks: inProgressTasks,
      overdue_tasks: overdueTasks,
      completion_rate: completionRate,
      weekly_performance: weeklyData
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('Performance calculation error:', error);
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

    console.log(`Task created: ${task.title} for company: ${req.user.company}`);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const inviteUser = async (req, res) => {
  try {
    const { email, role = 'employee' } = req.body;
    const { sendExistingUserInvite } = require('../utils/emailService');

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }
    
    // Check if user exists globally
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // User exists. Check if they are already in THIS company.
      const alreadyInCompany = existingUser.companies.some(
        c => c.company.toString() === req.user.company.toString()
      );

      if (alreadyInCompany) {
        return res.status(400).json({ success: false, error: 'User is already in your team' });
      }

      // Add user to this new company
      existingUser.companies.push({
        company: req.user.company,
        role: role,
        isActive: true,
        joinedAt: new Date()
      });

      // Update current company context to the new one (optional, but good for onboarding)
      // existingUser.currentCompany = req.user.company; 
      
      await existingUser.save();

      console.log(`Added existing user ${email} to company ${req.user.company}`);

      // Send "Existing User Invite" email
      const companyName = "your team"; // Ideally fetch actual company name if available in req
      sendExistingUserInvite(existingUser, req.user.name, companyName)
        .then(() => console.log('Invite email sent to existing user'))
        .catch(err => console.error('Failed to send invite email:', err));

      return res.json({
        success: true,
        message: 'Existing user added to your team successfully',
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: role
        }
      });
    }

    // --- NEW USER CREATION FLOW (Legacy Logic) ---
    const tempPassword = crypto.randomBytes(6).toString('hex');

    // Create user with correct schema structure (multi-tenant)
    const user = await User.create({
      name: email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim(),
      email: email.toLowerCase().trim(),
      password: tempPassword,
      companies: [{
        company: req.user.company,
        role: role,
        isActive: true,
        joinedAt: new Date()
      }],
      currentCompany: req.user.company
    });

    console.log('User created with email:', user.email);

    // Prepare user object for email
    const userForEmail = {
      ...user.toObject(),
      role: role,
      company: req.user.company
    };

    // Send welcome email with temporary password
    console.log('Sending welcome email to invited user:', user.email);
    sendWelcomeEmail(userForEmail, tempPassword).then(() => {
      console.log('Welcome email sent successfully to invited user:', user.email);
    }).catch(error => {
      console.error('Welcome email failed for invited user:', user.email, error.message);
    });

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
    console.error('Invite user error:', error);
    if (error.code === 11000) {
      // Fallback for race conditions
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: 'Invalid user data provided' });
    }
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

    const belongsToCompany = targetUser.companies.some(c => c.company.toString() === req.user.company.toString());
    if (!belongsToCompany && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role; // Note: This should probably update the role inside the companies array
    if (phone !== undefined) updateData.phone = phone;
    if (department !== undefined) updateData.department = department;

    // Update role within the specific company if provided
    if (role) {
      await User.updateOne(
        { _id: userId, 'companies.company': req.user.company },
        { $set: { 'companies.$.role': role } }
      );
      delete updateData.role; // Don't update top-level role if it doesn't exist or is handled differently
    }

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

    const belongsToCompany = targetUser.companies.some(c => c.company.toString() === req.user.company.toString());
    if (!belongsToCompany && req.user.role !== 'admin') {
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

const notifyTeamMeeting = async (req, res) => {
  try {
    const { title, description, meeting_url } = req.body;

    if (!title || !meeting_url) {
      return res.status(400).json({ success: false, error: 'Title and meeting URL required' });
    }

    // Get all employees in company
    const employees = await User.find({
      'companies.company': req.user.company,
      'companies.role': 'employee'
    }).select('email name _id').lean();

    console.log('Found employees for meeting notification:', employees.map(e => ({ name: e.name, email: e.email })));

    // Create notification for each employee
    const notifications = employees.map(employee => ({
      user_id: employee._id,
      title: title,
      message: description || `Meeting started by ${req.user.name}`,
      type: 'reminder', // Using 'reminder' as 'meeting' is not in enum
      read: false
    }));

    // Save notifications to DB
    const savedNotifications = await Notification.insertMany(notifications);

    // Emit real-time notifications via Socket.io
    const io = req.app.get('io');
    if (io && io.emitNotification) {
      savedNotifications.forEach(notification => {
        io.emitNotification(notification.user_id, {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          timestamp: notification.createdAt
        });
      });
    }

    // Send emails to all employees
    if (employees.length > 0) {
      const emailPromises = employees.map(employee => {
        console.log(`Sending meeting notification to: ${employee.email}`);
        return sendMeetingNotification(employee, { title, description, meeting_url, manager: req.user.name })
          .catch(error => {
            console.error(`Email failed for ${employee.email}:`, error.message);
            return { failed: true, email: employee.email, error: error.message };
          });
      });

      // Send emails asynchronously
      Promise.all(emailPromises).then(results => {
        const failed = results.filter(r => r && r.failed);
        if (failed.length > 0) {
          console.log('Some emails failed:', failed);
        }
      });
    } else {
      console.log('No employees found to notify');
    }

    res.json({
      success: true,
      message: `Meeting notification sent to ${employees.length} team members`,
      notified_count: employees.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const testEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const { testEmail: sendTestEmail } = require('../utils/emailService');
    await sendTestEmail(email);

    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getEmployees,
  getPerformance,
  assignTask,
  inviteUser,
  updateUser,
  deleteUser,
  notifyTeamMeeting,
  testEmail
};