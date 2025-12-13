const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Task = require('../models/Task');
const Company = require('../models/Company');
require('dotenv').config({ path: '../.env' });

// Mock Cloudinary
jest.mock('../config/cloudinary', () => ({
    upload: {
        single: (fieldName) => (req, res, next) => {
            req.file = {
                originalname: 'test-file.txt',
                path: 'https://mock-cloudinary-url.com/test-file.txt',
                size: 1024
            };
            next();
        }
    }
}));

const tasksRouter = require('../routes/tasks');

const app = express();
app.use(express.json());
app.use('/api/tasks', tasksRouter);

describe('Task File Upload', () => {
    let connection;
    let company;
    let employee;
    let task;
    let token;

    beforeAll(async () => {
        connection = await mongoose.connect(process.env.MONGODB_URI);

        // Setup Data
        company = await Company.create({ name: `Upload Test Corp ${Date.now()}`, email: `uploadtest${Date.now()}@test.com` });
        employee = await User.create({
            name: 'Upload Test Employee',
            email: `employee_upload_test_${Date.now()}@example.com`,
            password: 'password',
            companies: [{ company: company._id, role: 'employee', isActive: true }],
            currentCompany: company._id
        });

        token = jwt.sign({ userId: employee._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        task = await Task.create({
            title: 'Upload Test Task',
            description: 'Upload a file here',
            assigned_to: employee._id,
            created_by: employee._id,
            company: company._id.toString(),
            status: 'pending'
        });
    });

    afterAll(async () => {
        if (company) {
            await Task.deleteMany({ company: company._id.toString() });
            await User.deleteMany({ currentCompany: company._id });
            await Company.deleteOne({ _id: company._id });
        }
        await mongoose.disconnect();
    });

    it('should upload file successfully with valid token', async () => {
        const res = await request(app)
            .post(`/api/tasks/${task._id}/files`)
            .set('Authorization', `Bearer ${token}`)
            .attach('file', Buffer.from('test content'), 'test.txt');

        console.log('With Token Response:', res.body);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('should return 401 Access denied without token', async () => {
        const res = await request(app)
            .post(`/api/tasks/${task._id}/files`)
            .attach('file', Buffer.from('test content'), 'test.txt');

        console.log('No Token Response:', res.body);
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Access denied');
    });
});
