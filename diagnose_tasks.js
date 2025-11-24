// Diagnostic script to check employee task assignments
// Run this with: node diagnose_tasks.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');

async function diagnoseTaskAssignments() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find the specific employee
        const employee = await User.findOne({ email: 'mosesjohnson706@gmail.com' });

        if (!employee) {
            console.log('❌ Employee not found with email: mosesjohnson706@gmail.com');
            console.log('\nSearching for similar users...');
            const users = await User.find({
                $or: [
                    { email: /moses/i },
                    { name: /moses/i }
                ]
            }).select('name email company role _id');
            console.log('Found users:', users);
            await mongoose.disconnect();
            return;
        }

        console.log('📋 Employee Details:');
        console.log('  Name:', employee.name);
        console.log('  Email:', employee.email);
        console.log('  Company:', employee.company);
        console.log('  Role:', employee.role);
        console.log('  ID:', employee._id);
        console.log('');

        // Find tasks assigned to this employee
        const tasksAssigned = await Task.find({ assigned_to: employee._id });
        console.log(`📊 Tasks assigned to employee (by ID): ${tasksAssigned.length}`);

        if (tasksAssigned.length > 0) {
            console.log('\nTask Details:');
            tasksAssigned.forEach((task, index) => {
                console.log(`\n  Task ${index + 1}:`);
                console.log('    Title:', task.title);
                console.log('    Status:', task.status);
                console.log('    Company:', task.company);
                console.log('    Assigned To:', task.assigned_to);
                console.log('    Created:', task.createdAt);
            });
        }

        // Check with company filter
        const tasksWithCompany = await Task.find({
            assigned_to: employee._id,
            company: employee.company
        });
        console.log(`\n📊 Tasks with company filter: ${tasksWithCompany.length}`);

        // Check completed tasks
        const tasksCompleted = await Task.find({
            assigned_to: employee._id,
            status: 'completed',
            company: employee.company
        });
        console.log(`✅ Completed tasks: ${tasksCompleted.length}`);

        // Check all tasks in the company
        const allCompanyTasks = await Task.find({ company: employee.company });
        console.log(`\n📦 Total tasks in company "${employee.company}": ${allCompanyTasks.length}`);

        // Check if there are tasks with different assigned_to format
        const tasksWithStringId = await Task.find({ assigned_to: employee._id.toString() });
        console.log(`\n🔍 Tasks with string ID: ${tasksWithStringId.length}`);

        // Show what getEmployees would return
        console.log('\n📈 What getEmployees API would return:');
        const tasksAssignedCount = await Task.countDocuments({
            assigned_to: employee._id,
            company: employee.company
        });
        const tasksCompletedCount = await Task.countDocuments({
            assigned_to: employee._id,
            status: 'completed',
            company: employee.company
        });
        console.log(`  tasks_assigned: ${tasksAssignedCount}`);
        console.log(`  tasks_completed: ${tasksCompletedCount}`);

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
    }
}

diagnoseTaskAssignments();
