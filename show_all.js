// Show ALL users and ALL tasks with full details
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');

async function showEverything() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected\n');

        const company = 'moze';

        // Get all users
        const users = await User.find({ company }).select('name email role _id');
        console.log(`=== USERS IN COMPANY "${company}" ===`);
        users.forEach(u => {
            console.log(`${u.name} (${u.email})`);
            console.log(`  Role: ${u.role}`);
            console.log(`  ID: ${u._id}`);
            console.log('');
        });

        // Get all tasks
        const tasks = await Task.find({ company });
        console.log(`\n=== TASKS IN COMPANY "${company}" ===`);
        console.log(`Total: ${tasks.length}\n`);

        for (const task of tasks) {
            console.log(`Task: ${task.title}`);
            console.log(`  assigned_to: ${task.assigned_to}`);
            console.log(`  status: ${task.status}`);
            console.log(`  priority: ${task.priority}`);
            console.log(`  created_by: ${task.created_by}`);

            // Find who this is assigned to
            const assignedUser = await User.findById(task.assigned_to);
            if (assignedUser) {
                console.log(`  >>> ASSIGNED TO: ${assignedUser.name} (${assignedUser.email})`);
            } else {
                console.log(`  >>> ASSIGNED TO: USER NOT FOUND!`);
            }
            console.log('');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        await mongoose.disconnect();
    }
}

showEverything();
