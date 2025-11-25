const Task = require('../models/Task');
const User = require('../models/User');

/**
 * Get average task completion time
 */
const getAverageCompletionTime = async (req, res) => {
    try {
        const company = req.user.company;

        // Get completed tasks with completion time
        const completedTasks = await Task.find({
            company,
            status: 'completed',
            createdAt: { $exists: true },
            updatedAt: { $exists: true }
        }).select('createdAt updatedAt title').lean();

        if (completedTasks.length === 0) {
            return res.json({
                success: true,
                data: {
                    averageHours: 0,
                    averageDays: 0,
                    totalCompleted: 0,
                    breakdown: []
                }
            });
        }

        // Calculate completion times
        const completionTimes = completedTasks.map(task => {
            const created = new Date(task.createdAt);
            const completed = new Date(task.updatedAt);
            const hours = (completed - created) / (1000 * 60 * 60);
            return { title: task.title, hours, days: hours / 24 };
        });

        const totalHours = completionTimes.reduce((sum, t) => sum + t.hours, 0);
        const averageHours = totalHours / completionTimes.length;

        res.json({
            success: true,
            data: {
                averageHours: Math.round(averageHours * 10) / 10,
                averageDays: Math.round((averageHours / 24) * 10) / 10,
                totalCompleted: completedTasks.length,
                breakdown: completionTimes.slice(0, 10) // Last 10 tasks
            }
        });
    } catch (error) {
        console.error('Get average completion time error:', error);
        res.status(500).json({ success: false, error: 'Failed to calculate completion time' });
    }
};

/**
 * Get task velocity (tasks completed per week)
 */
const getTaskVelocity = async (req, res) => {
    try {
        const company = req.user.company;
        const weeks = parseInt(req.query.weeks) || 4;

        const velocityData = [];
        const now = new Date();

        for (let i = weeks - 1; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - (i * 7 + 7));
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);

            const completedCount = await Task.countDocuments({
                company,
                status: 'completed',
                updatedAt: { $gte: weekStart, $lt: weekEnd }
            });

            const createdCount = await Task.countDocuments({
                company,
                createdAt: { $gte: weekStart, $lt: weekEnd }
            });

            velocityData.push({
                week: `Week ${weeks - i}`,
                weekStart: weekStart.toISOString().split('T')[0],
                completed: completedCount,
                created: createdCount,
                velocity: completedCount
            });
        }

        const avgVelocity = velocityData.reduce((sum, w) => sum + w.velocity, 0) / weeks;

        res.json({
            success: true,
            data: {
                velocityData,
                averageVelocity: Math.round(avgVelocity * 10) / 10,
                weeks
            }
        });
    } catch (error) {
        console.error('Get task velocity error:', error);
        res.status(500).json({ success: false, error: 'Failed to calculate velocity' });
    }
};

/**
 * Get workload distribution across team members
 */
const getWorkloadDistribution = async (req, res) => {
    try {
        const company = req.user.company;

        // Get all employees
        const employees = await User.find({ company, role: 'employee' }).select('name email').lean();

        const workloadData = await Promise.all(employees.map(async (employee) => {
            const [totalTasks, completedTasks, pendingTasks, inProgressTasks] = await Promise.all([
                Task.countDocuments({ company, assigned_to: employee._id }),
                Task.countDocuments({ company, assigned_to: employee._id, status: 'completed' }),
                Task.countDocuments({ company, assigned_to: employee._id, status: 'pending' }),
                Task.countDocuments({ company, assigned_to: employee._id, status: 'in-progress' })
            ]);

            return {
                employeeName: employee.name,
                employeeEmail: employee.email,
                totalTasks,
                completedTasks,
                pendingTasks,
                inProgressTasks,
                completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
            };
        }));

        // Sort by total tasks descending
        workloadData.sort((a, b) => b.totalTasks - a.totalTasks);

        res.json({
            success: true,
            data: workloadData
        });
    } catch (error) {
        console.error('Get workload distribution error:', error);
        res.status(500).json({ success: false, error: 'Failed to calculate workload distribution' });
    }
};

/**
 * Get productivity trends over time
 */
const getProductivityTrends = async (req, res) => {
    try {
        const company = req.user.company;
        const months = parseInt(req.query.months) || 3;

        const trendsData = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            const [totalTasks, completedTasks, createdTasks] = await Promise.all([
                Task.countDocuments({
                    company,
                    createdAt: { $lte: monthEnd }
                }),
                Task.countDocuments({
                    company,
                    status: 'completed',
                    updatedAt: { $gte: monthStart, $lte: monthEnd }
                }),
                Task.countDocuments({
                    company,
                    createdAt: { $gte: monthStart, $lte: monthEnd }
                })
            ]);

            const monthName = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

            trendsData.push({
                month: monthName,
                completed: completedTasks,
                created: createdTasks,
                completionRate: createdTasks > 0 ? Math.round((completedTasks / createdTasks) * 100) : 0
            });
        }

        res.json({
            success: true,
            data: trendsData
        });
    } catch (error) {
        console.error('Get productivity trends error:', error);
        res.status(500).json({ success: false, error: 'Failed to calculate productivity trends' });
    }
};

/**
 * Export analytics data to CSV
 */
const exportAnalytics = async (req, res) => {
    try {
        const company = req.user.company;
        const type = req.query.type || 'tasks'; // tasks, users, performance

        let csvData = '';

        if (type === 'tasks') {
            const tasks = await Task.find({ company })
                .populate('assigned_to', 'name')
                .populate('created_by', 'name')
                .lean();

            csvData = 'Title,Status,Priority,Assigned To,Created By,Due Date,Created At\n';
            tasks.forEach(task => {
                csvData += `"${task.title}","${task.status}","${task.priority}","${task.assigned_to?.name || 'Unassigned'}","${task.created_by?.name || 'Unknown'}","${task.due_date || ''}","${task.createdAt}"\n`;
            });
        } else if (type === 'users') {
            const users = await User.find({ company }).lean();

            csvData = 'Name,Email,Role,Created At\n';
            users.forEach(user => {
                csvData += `"${user.name}","${user.email}","${user.role}","${user.createdAt}"\n`;
            });
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-export-${Date.now()}.csv"`);
        res.send(csvData);
    } catch (error) {
        console.error('Export analytics error:', error);
        res.status(500).json({ success: false, error: 'Failed to export data' });
    }
};

module.exports = {
    getAverageCompletionTime,
    getTaskVelocity,
    getWorkloadDistribution,
    getProductivityTrends,
    exportAnalytics
};
