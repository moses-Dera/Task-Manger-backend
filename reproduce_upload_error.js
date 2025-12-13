const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');
const Company = require('./models/Company');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Mock Cloudinary upload to avoid actual network calls and credentials dependency for this test
// We need to mock the middleware *before* requiring the routes
jest.mock('./config/cloudinary', () => ({
    upload: {
        single: (fieldName) => (req, res, next) => {
            req.file = {
                originalname: 'test-file.txt',
                path: 'https://res.cloudinary.com/demo/image/upload/v1234567890/test-file.txt',
                size: 1024
            };
            next();
        }
    }
}));

// We need to setup a minimal express app to test the route
const app = express();
app.use(express.json());

// Import routes after mocking
const tasksRouter = require('./routes/tasks');
app.use('/api/tasks', tasksRouter);

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Setup Data
        const company = await Company.create({ name: `Upload Corp ${Date.now()}`, email: `upload${Date.now()}@test.com` });
        const employee = await User.create({
            name: 'Upload Employee',
            email: `employee_upload_${Date.now()}@example.com`,
            password: 'password',
            companies: [{ company: company._id, role: 'employee', isActive: true }],
            currentCompany: company._id
        });

        // Generate Token
        const token = jwt.sign({ userId: employee._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Create Task
        const task = await Task.create({
            title: 'Upload Task',
            description: 'Upload a file here',
            assigned_to: employee._id,
            created_by: employee._id, // Self-assigned for simplicity
            company: company._id.toString(),
            status: 'pending'
        });

        console.log(`\n--- Setup ---`);
        console.log(`Task Created: ${task._id}`);
        console.log(`Employee Token Generated`);

        // 2. Test Upload WITH Token
        console.log(`\n--- Test 1: Upload WITH Token ---`);
        // We can't easily use supertest with the mocked app structure in this standalone script without more setup.
        // Instead, let's simulate the request flow manually or use a simplified approach.
        // Actually, since we want to test the *middleware* interaction, we should use supertest if possible.
        // But requiring the whole app might be complex.

        // Let's rely on the fact that we can call the route handler if we mock the request/response?
        // No, that skips middleware.

        // Let's try to use supertest on the app we defined above.
        // We need to mock the auth middleware too? No, we want to test it.
        // But auth middleware uses User model, which we have connected.

        const res = await request(app)
            .post(`/api/tasks/${task._id}/files`)
            .set('Authorization', `Bearer ${token}`)
            .attach('file', Buffer.from('test content'), 'test.txt');

        console.log(`Status: ${res.status}`);
        console.log(`Response:`, res.body);

        if (res.status === 201 && res.body.success) {
            console.log('✅ PASS: Upload with token succeeded.');
        } else {
            console.error('❌ FAIL: Upload with token failed.');
        }

        // 3. Test Upload WITHOUT Token
        console.log(`\n--- Test 2: Upload WITHOUT Token ---`);
        const resNoToken = await request(app)
            .post(`/api/tasks/${task._id}/files`)
            .attach('file', Buffer.from('test content'), 'test.txt');

        console.log(`Status: ${resNoToken.status}`);
        console.log(`Response:`, resNoToken.body);

        if (resNoToken.status === 401 && resNoToken.body.error === 'Access denied') {
            console.log('✅ PASS: Upload without token returned "Access denied".');
        } else {
            console.error('❌ FAIL: Upload without token did not return expected error.');
        }

        // Cleanup
        await Task.deleteOne({ _id: task._id });
        await User.deleteOne({ _id: employee._id });
        await Company.deleteOne({ _id: company._id });
        console.log('\nTest data cleaned up.');

    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();
