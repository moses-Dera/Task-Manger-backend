const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');
const TaskFile = require('./models/TaskFile');
const Company = require('./models/Company');
require('dotenv').config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Setup Data
        const company = await Company.create({ name: `Submission Corp ${Date.now()}`, email: `sub${Date.now()}@test.com` });
        const manager = await User.create({
            name: 'Sub Manager',
            email: `manager_sub_${Date.now()}@example.com`,
            password: 'password',
            companies: [{ company: company._id, role: 'manager', isActive: true }],
            currentCompany: company._id
        });
        const employee = await User.create({
            name: 'Sub Employee',
            email: `employee_sub_${Date.now()}@example.com`,
            password: 'password',
            companies: [{ company: company._id, role: 'employee', isActive: true }],
            currentCompany: company._id
        });

        const task = await Task.create({
            title: 'Submission Task',
            description: 'Submit a file',
            assigned_to: employee._id,
            created_by: manager._id,
            company: company._id.toString(),
            status: 'pending'
        });

        console.log(`\n--- Setup ---`);
        console.log(`Task Created: ${task.title} (ID: ${task._id})`);

        // 2. Simulate File Upload (Creating TaskFile document directly as we can't easily mock multer here)
        console.log(`\n--- Test 1: Upload Task File ---`);
        const mockFile = {
            filename: 'test-submission.pdf',
            path: 'uploads/tasks/test-submission.pdf',
            size: 1024
        };

        const taskFile = await TaskFile.create({
            task_id: task._id,
            filename: mockFile.filename,
            file_path: mockFile.path,
            file_size: mockFile.size,
            uploaded_by: employee._id
        });

        console.log(`TaskFile Created: ${taskFile.filename} (ID: ${taskFile._id})`);

        // 3. Verify Linkage
        const filesForTask = await TaskFile.find({ task_id: task._id });
        console.log(`Found ${filesForTask.length} files for task.`);

        if (filesForTask.length === 1 && filesForTask[0].filename === 'test-submission.pdf') {
            console.log('✅ PASS: Task file correctly linked to task.');
        } else {
            console.error('❌ FAIL: Task file linkage failed.');
        }

        // 4. Verify Task Update (Submission URL)
        console.log(`\n--- Test 2: Update Task Submission URL ---`);
        const submissionUrl = 'https://example.com/submission';
        const updatedTask = await Task.findByIdAndUpdate(
            task._id,
            { submission_url: submissionUrl, status: 'completed' },
            { new: true }
        );

        console.log(`Task Status: ${updatedTask.status}`);
        console.log(`Submission URL: ${updatedTask.submission_url}`);

        if (updatedTask.status === 'completed' && updatedTask.submission_url === submissionUrl) {
            console.log('✅ PASS: Task submission URL updated.');
        } else {
            console.error('❌ FAIL: Task submission update failed.');
        }

        // Cleanup
        await TaskFile.deleteMany({ task_id: task._id });
        await Task.deleteOne({ _id: task._id });
        await User.deleteMany({ _id: { $in: [manager._id, employee._id] } });
        await Company.deleteOne({ _id: company._id });
        console.log('\nTest data cleaned up.');

    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();
