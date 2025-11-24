// Quick test to check what getEmployees returns
// Run with: node test_employees_api.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');

async function testEmployeesAPI() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Simulate what getEmployees does
        const company = 'TaskFlow'; // Replace with actual company name

        const employees = await User.find({ role: 'employee', company })
            .select('name email role')
            .lean();

        console.log(`Found ${employees.length} employees in company "${company}"\n`);

        for (const employee of employees) {
            const tasksAssigned = await Task.countDocuments({ assigned_to: employee._id, company });
            const tasksCompleted = await Task.countDocuments({ assigned_to: employee._id, status: 'completed', company });

            console.log(`Employee: ${employee.name}`);
            console.log(`  Email: ${employee.email}`);
            console.log(`  ID: ${employee._id}`);
            console.log(`  ID type: ${typeof employee._id}`);
            console.log(`  Tasks Assigned: ${tasksAssigned}`);
            console.log(`  Tasks Completed: ${tasksCompleted}`);

            // Check if there are tasks with this employee
            const tasks = await Task.find({ assigned_to: employee._id }).limit(3);
            if (tasks.length > 0) {
                console.log(`  Sample tasks:`);
                tasks.forEach(t => {
                    console.log(`    - ${t.title} (assigned_to: ${t.assigned_to}, type: ${typeof t.assigned_to})`);
                });
            }
            console.log('');
        }

        // Check all tasks in the company
        const allTasks = await Task.find({ company }).populate('assigned_to', 'name email');
        console.log(`\nAll tasks in company "${company}": ${allTasks.length}`);
        allTasks.forEach(task => {
            console.log(`  - ${task.title}`);
            console.log(`    Assigned to: ${task.assigned_to?.name || 'Unknown'} (${task.assigned_to?._id})`);
            console.log(`    Status: ${task.status}`);
        });

        await mongoose.disconnect();
        console.log('\n✅ Done');
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
    }
}

testEmployeesAPI();
