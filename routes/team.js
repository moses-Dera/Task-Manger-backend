const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const { getEmployees, getPerformance, assignTask, inviteUser, updateUser, deleteUser, notifyTeamMeeting } = require('../controllers/teamController');

const router = express.Router();

// Get employees (Manager/Admin only)
router.get('/employees', auth, authorize('admin', 'manager'), getEmployees);

// Get team performance
router.get('/performance', auth, authorize('admin', 'manager'), getPerformance);

// Assign task
router.post('/assign-task', auth, authorize('admin', 'manager'), [
  body('title').notEmpty().withMessage('Title is required'),
  body('assigned_to').notEmpty().withMessage('Employee ID is required')
], assignTask);

// Invite user
router.post('/invite', auth, authorize('admin', 'manager'), [
  body('email').isEmail().withMessage('Valid email is required')
], inviteUser);

// Update user
router.put('/users/:userId', auth, authorize('admin', 'manager'), updateUser);

// Delete user
router.delete('/users/:userId', auth, authorize('admin', 'manager'), deleteUser);

// Notify team meeting
router.post('/notify-meeting', auth, authorize('admin', 'manager'), notifyTeamMeeting);

module.exports = router;