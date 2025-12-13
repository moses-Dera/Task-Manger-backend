const mongoose = require('mongoose');
const Task = require('./models/Task');
const User = require('./models/User');
require('dotenv').config();

async function createTestTasks() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ 'companies.role': 'employee' });
        if (!user) {
            console.log('No employee found');
            return;
        }

        console.log('Creating tasks for user:', user.email);

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextMonth = new Date(today);
        nextMonth.setDate(nextMonth.getDate() + 30);

        const tasks = [
            {
                title: 'DEBUG: Task Due Today',
                description: 'Created by script',
                assigned_to: user._id,
                created_by: user._id,
                company: user.companies[0].company,
                status: 'pending',
                priority: 'high',
                due_date: today
            },
            {
                title: 'DEBUG: Task Due Tomorrow',
                description: 'Created by script',
                assigned_to: user._id,
                created_by: user._id,
                company: user.companies[0].company,
                status: 'pending',
                priority: 'medium',
                due_date: tomorrow
            },
            {
                title: 'DEBUG: Task Due Next Month',
                description: 'Created by script',
                assigned_to: user._id,
                created_by: user._id,
                company: user.companies[0].company,
                status: 'pending',
                priority: 'low',
                due_date: nextMonth
            }
        ];

        await Task.insertMany(tasks);
        console.log('Test tasks created successfully');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

createTestTasks();
