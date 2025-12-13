const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function reproduceUploadError() {
    try {
        // Check server connectivity first
        try {
            await axios.get('http://localhost:5000/');
            console.log('Server is reachable.');
        } catch (err) {
            console.error('Server connectivity check failed:', err.message);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Get a valid user and token
        const user = await User.findOne({ 'companies.role': 'employee' });
        if (!user) {
            console.error('No employee found');
            return;
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('Got token for user:', user.email);

        // 2. Get a valid task
        const task = await Task.findOne({ assigned_to: user._id });
        if (!task) {
            console.error('No task found for user');
            return;
        }
        console.log('Found task:', task._id);

        // 3. Create a dummy file
        const filePath = path.join(__dirname, 'test_upload.txt');
        fs.writeFileSync(filePath, 'This is a test file content for debugging 500 error.');

        // 4. Prepare FormData
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));

        // 5. Send Request
        const url = `http://localhost:5000/api/tasks/${task._id}/files`;
        console.log('Sending POST request to:', url);

        try {
            const response = await axios.post(url, form, {
                headers: {
                    ...form.getHeaders(),
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('Upload Success:', response.data);
        } catch (error) {
            console.error('Upload Failed Message:', error.message);
            if (error.response) {
                console.error('Upload Failed Status:', error.response.status);
                console.error('Upload Failed Data:', JSON.stringify(error.response.data, null, 2));
            } else if (error.request) {
                console.error('No response received. Request sent.');
            } else {
                console.error('Error setting up request:', error.message);
            }
        }

        // Cleanup
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

    } catch (error) {
        console.error('Script Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

reproduceUploadError();
