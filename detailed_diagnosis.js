// Detailed diagnostic for mosesjohnson706
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');

async function detailedDiagnosis() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Find the employee
        const employee = await User.findOne({ email: 'mosesjohnson706@gmail.com' });

        if (!employee) {
            console.log('ERROR: Employee not found!');
            await mongoose.disconnect();
            return;
        }

        console.log('=== EMPLOYEE INFO ===');
        console.log('Name:', employee.name);
        console.log('Email:', employee.email);
        console.log('Company:', employee.company);
        console.log('Role:', employee.role);
        console.log('_id:', employee._id);
        console.log('_id type:', typeof employee._id);
        console.log('_id toString:', employee._id.toString());
        console.log('');

        // Check tasks with exact match
        console.log('=== TASK QUERIES ===');

        const query1 = { assigned_to: employee._id, company: employee.company };
        const count1 = await Task.countDocuments(query1);
        console.log('Query 1 (ObjectId + company):', count1);
        console.log('  Query:', JSON.stringify({ assigned_to: employee._id.toString(), company: employee.company }));

        const query2 = { assigned_to: employee._id };
        const count2 = await Task.countDocuments(query2);
        console.log('Query 2 (ObjectId only):', count2);

        const query3 = { assigned_to: employee._id.toString(), company: employee.company };
        const count3 = await Task.countDocuments(query3);
        console.log('Query 3 (String ID + company):', count3);

        const query4 = { company: employee.company };
        const count4 = await Task.countDocuments(query4);
        console.log('Query 4 (company only):', count4);
        console.log('');

        // Get all tasks and check assigned_to field
        const allTasks = await Task.find({ company: employee.company });
        console.log('=== ALL TASKS IN COMPANY ===');
        console.log(`Total tasks: ${allTasks.length}\n`);

        allTasks.forEach((task, i) => {
            console.log(`Task ${i + 1}: ${task.title}`);
            console.log('  assigned_to:', task.assigned_to);
            console.log('  assigned_to type:', typeof task.assigned_to);
            console.log('  assigned_to toString:', task.assigned_to?.toString());
            console.log('  Match with employee._id?', task.assigned_to?.toString() === employee._id.toString());
            console.log('  Status:', task.status);
            console.log('  Company:', task.company);
            console.log('');
        });

        // Simulate getEmployees function
        console.log('=== SIMULATING getEmployees API ===');
        const tasksAssigned = await Task.countDocuments({ assigned_to: employee._id, company: employee.company });
        const tasksCompleted = await Task.countDocuments({ assigned_to: employee._id, status: 'completed', company: employee.company });
        console.log('tasks_assigned:', tasksAssigned);
        console.log('tasks_completed:', tasksCompleted);
        console.log('Result:', `${tasksCompleted}/${tasksAssigned}`);

        await mongoose.disconnect();
        console.log('\nDone');
    } catch (error) {
        console.error('Error:', error);
        await mongoose.disconnect();
    }
}

detailedDiagnosis();
