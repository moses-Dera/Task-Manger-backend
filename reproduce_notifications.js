const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const User = require('./models/User');
require('dotenv').config();

async function reproduce() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne();
        if (!user) {
            console.log('No users found in database');
            return;
        }

        console.log(`Testing with user: ${user.email} (${user._id})`);

        // Check existing notifications
        const existing = await Notification.find({ user_id: user._id });
        console.log(`Found ${existing.length} existing notifications`);

        if (existing.length === 0) {
            console.log('Creating a test notification...');
            const notif = new Notification({
                user_id: user._id,
                title: 'Test Notification',
                message: 'This is a test notification created by the reproduction script',
                type: 'system'
            });
            await notif.save();
            console.log('Notification created');

            const newCount = await Notification.countDocuments({ user_id: user._id });
            console.log(`New notification count: ${newCount}`);
        } else {
            console.log('First notification:', existing[0]);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

reproduce();
