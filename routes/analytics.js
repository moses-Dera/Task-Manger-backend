const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
    getAverageCompletionTime,
    getTaskVelocity,
    getWorkloadDistribution,
    getProductivityTrends,
    exportAnalytics
} = require('../controllers/analyticsController');

// All analytics routes require authentication and manager/admin role
router.get('/completion-time', auth, authorize(['manager', 'admin']), getAverageCompletionTime);
router.get('/velocity', auth, authorize(['manager', 'admin']), getTaskVelocity);
router.get('/workload', auth, authorize(['manager', 'admin']), getWorkloadDistribution);
router.get('/trends', auth, authorize(['manager', 'admin']), getProductivityTrends);
router.get('/export', auth, authorize(['manager', 'admin']), exportAnalytics);

module.exports = router;
