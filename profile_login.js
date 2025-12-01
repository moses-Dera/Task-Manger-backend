const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api/auth/login';

async function profileLogin() {
    try {
        // 1. Setup: Ensure a test user exists
        await mongoose.connect(process.env.MONGODB_URI);
        const testEmail = 'profile_test@example.com';
        const testPassword = 'password123';

        let user = await User.findOne({ email: testEmail });
        if (!user) {
            user = new User({
                name: 'Profile Test',
                email: testEmail,
                password: testPassword, // Will be hashed by pre-save hook
                company: 'Test Co',
                role: 'employee'
            });
            await user.save();
            console.log('Created test user');
        }
        await mongoose.disconnect();

        // 2. Profile Login
        console.log('Profiling login request...');
        const start = performance.now();

        try {
            const response = await axios.post(API_URL, {
                email: testEmail,
                password: testPassword
            });

            const end = performance.now();
            const duration = end - start;

            console.log(`Login successful!`);
            console.log(`Status: ${response.status}`);
            console.log(`Duration: ${duration.toFixed(2)} ms`);

            if (duration > 1000) {
                console.log('WARNING: Login took longer than 1 second.');
            } else {
                console.log('Performance looks good (< 1s).');
            }

        } catch (error) {
            console.error('Login failed:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
            }
        }

    } catch (error) {
        console.error('Setup error:', error);
    }
}

profileLogin();
