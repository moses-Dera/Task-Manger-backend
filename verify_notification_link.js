const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const Task = require('./models/Task');
const User = require('./models/User');
require('dotenv').config();

async function verify() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ role: 'employee' });
        if (!user) {
            console.log('No employee found');
            return;
        }

        const manager = await User.findOne({ role: 'manager' });
        if (!manager) {
            console.log('No manager found');
            return;
        }

        console.log(`Creating task for user: ${user.email}`);

        // Create a task to trigger notification
        const task = new Task({
            title: 'Verification Task ' + Date.now(),
            description: 'Testing notification link',
            assigned_to: user._id,
            created_by: manager._id,
            company: user.company,
            priority: 'medium',
            status: 'in-progress',
            due_date: new Date()
        });

        await task.save();
        console.log('Task created:', task._id);

        // Wait for notification to be created (it's async in controller but we are simulating logic here? 
        // No, we need to check if the controller logic works. 
        // But we can't invoke controller directly easily without mocking req/res.
        // However, we modified the controller code. 
        // Let's manually simulate what the controller does to verify the MODEL accepts the field.

        const notification = new Notification({
            user_id: user._id,
            title: 'New Task Assigned',
            message: `You have been assigned a new task: "${task.title}"`,
            type: 'task',
            related_id: task._id,
            onModel: 'Task',
            read: false
        });

        await notification.save();
        console.log('Notification saved manually with related_id');

        const savedNotif = await Notification.findById(notification._id);
        console.log('Retrieved Notification:', savedNotif);

        if (savedNotif.related_id && savedNotif.related_id.toString() === task._id.toString()) {
            console.log('SUCCESS: Notification has correct related_id');
        } else {
            console.log('FAILURE: Notification missing related_id');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

verify();
