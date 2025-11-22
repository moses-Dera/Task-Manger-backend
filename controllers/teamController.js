const { validationResult } = require('express-validator');
const User = require('../models/User');
const Task = require('../models/Task');

const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('-password');
    
    const employeesWithStats = await Promise.all(employees.map(async (employee) => {
      const tasksAssigned = await Task.countDocuments({ assigned_to: employee._id });
      const tasksCompleted = await Task.countDocuments({ assigned_to: employee._id, status: 'completed' });
      
      return {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        tasks_assigned: tasksAssigned,
        tasks_completed: tasksCompleted,
        performance_score: tasksAssigned > 0 ? (tasksCompleted / tasksAssigned > 0.8 ? 'A' : 'B') : 'N/A'
      };
    }));

    res.json({ success: true, data: employeesWithStats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const getPerformance = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ status: 'in-progress' });
    const overdueTasks = await Task.countDocuments({ status: 'overdue' });

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
      created_by: req.user._id
    });
    
    await task.save();
    await task.populate(['assigned_to', 'created_by'], 'name');
    
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  getEmployees,
  getPerformance,
  assignTask
};