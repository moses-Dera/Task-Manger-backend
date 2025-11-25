const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const taskRoutes = require('../../routes/tasks');
const Task = require('../../models/Task');
const User = require('../../models/User');
const Notification = require('../../models/Notification');

// Mock the models and middleware
jest.mock('../../models/Task');
jest.mock('../../models/User');
jest.mock('../../models/Notification');
jest.mock('../../middleware/activityLogger', () => ({
    createActivityLog: jest.fn().mockResolvedValue(null)
}));

const app = express();
app.use(express.json());

// Mock auth middleware with valid ObjectId
const validUserId = new mongoose.Types.ObjectId();
app.use((req, res, next) => {
    req.user = {
        _id: validUserId,
        name: 'Test User',
        email: 'test@example.com',
        role: 'manager',
        company: 'testcompany'
    };
    req.app = {
        get: jest.fn().mockReturnValue(null) // Mock Socket.io
    };
    next();
});

app.use('/api/tasks', taskRoutes);

describe('Task API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/tasks', () => {
        it('should return all tasks for the company', async () => {
            const mockTasks = [
                {
                    _id: new mongoose.Types.ObjectId(),
                    title: 'Test Task 1',
                    status: 'pending',
                    company: 'testcompany'
                },
                {
                    _id: new mongoose.Types.ObjectId(),
                    title: 'Test Task 2',
                    status: 'completed',
                    company: 'testcompany'
                }
            ];

            Task.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockResolvedValue(mockTasks)
                    })
                })
            });

            const response = await request(app).get('/api/tasks');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
        });

        it('should filter tasks by status', async () => {
            Task.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockResolvedValue([])
                    })
                })
            });

            const response = await request(app).get('/api/tasks?status=completed');

            expect(response.status).toBe(200);
            expect(Task.find).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'completed' })
            );
        });
    });

    describe('POST /api/tasks', () => {
        it('should create a new task', async () => {
            const assignedUserId = new mongoose.Types.ObjectId();
            const newTaskData = {
                title: 'New Task',
                description: 'Task description',
                assigned_to: assignedUserId.toString(),
                priority: 'high',
                due_date: '2025-12-31'
            };

            const mockTask = {
                _id: new mongoose.Types.ObjectId(),
                ...newTaskData,
                created_by: validUserId,
                company: 'testcompany',
                save: jest.fn().mockResolvedValue(true)
            };

            Task.mockImplementation(() => mockTask);
            Task.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue({
                        ...mockTask,
                        assigned_to: { _id: assignedUserId, name: 'Assigned User' },
                        created_by: { _id: validUserId, name: 'Test User' }
                    })
                })
            });

            User.findById = jest.fn().mockResolvedValue({
                _id: assignedUserId,
                name: 'Assigned User'
            });

            Notification.mockImplementation(() => ({
                save: jest.fn().mockResolvedValue(true),
                _id: new mongoose.Types.ObjectId()
            }));

            const response = await request(app)
                .post('/api/tasks')
                .send(newTaskData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('New Task');
        });

        it('should return error for invalid task data', async () => {
            const response = await request(app)
                .post('/api/tasks')
                .send({
                    // Missing required fields
                    description: 'Task without title'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/tasks/:id', () => {
        it('should update a task', async () => {
            const taskId = new mongoose.Types.ObjectId();
            const mockTask = {
                _id: taskId,
                title: 'Original Title',
                assigned_to: validUserId,
                company: 'testcompany',
                toString: () => validUserId.toString()
            };

            const updatedTask = {
                ...mockTask,
                title: 'Updated Title',
                status: 'completed',
                assigned_to: { _id: validUserId, name: 'Test User' },
                created_by: { _id: validUserId, name: 'Test User' }
            };

            Task.findOne = jest.fn().mockResolvedValue(mockTask);
            Task.findOneAndUpdate = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(updatedTask)
                })
            });

            const response = await request(app)
                .put(`/api/tasks/${taskId}`)
                .send({ title: 'Updated Title', status: 'completed' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('Updated Title');
        });
    });
});
