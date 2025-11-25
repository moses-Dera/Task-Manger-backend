const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('../../routes/auth');
const User = require('../../models/User');

// Mock the User model and activity logger
jest.mock('../../models/User');
jest.mock('../../middleware/activityLogger', () => ({
    createActivityLog: jest.fn().mockResolvedValue(null)
}));
jest.mock('../../utils/emailService', () => ({
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetConfirmation: jest.fn().mockResolvedValue(true)
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/signup', () => {
        it('should create a new user successfully', async () => {
            const userId = new mongoose.Types.ObjectId();
            const mockUser = {
                _id: userId,
                name: 'Test User',
                email: 'test@example.com',
                role: 'employee',
                company: 'testcompany',
                save: jest.fn().mockResolvedValue(true)
            };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.mockImplementation(() => mockUser);

            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                    company: 'testcompany'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
        });

        it('should return error if user already exists', async () => {
            User.findOne = jest.fn().mockResolvedValue({ email: 'test@example.com' });

            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                    company: 'testcompany'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login user with valid credentials', async () => {
            const userId = new mongoose.Types.ObjectId();
            const mockUser = {
                _id: userId,
                email: 'test@example.com',
                name: 'Test User',
                role: 'employee',
                company: 'testcompany',
                comparePassword: jest.fn().mockResolvedValue(true)
            };

            User.findOne = jest.fn().mockResolvedValue(mockUser);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
        });

        it('should return error with invalid credentials', async () => {
            User.findOne = jest.fn().mockResolvedValue(null);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});
