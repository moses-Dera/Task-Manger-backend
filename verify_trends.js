const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function verifyTrends() {
    try {
        // 1. Register/Login a Manager
        const managerEmail = `manager_${Date.now()}@test.com`;
        const managerPassword = 'password123';

        console.log('Registering Manager...');
        let managerToken;
        try {
            const res = await axios.post(`${API_URL}/auth/signup`, {
                name: 'Test Manager',
                email: managerEmail,
                password: managerPassword,
                role: 'manager',
                company: 'Test Corp'
            });
            managerToken = res.data.token;
        } catch (e) {
            console.log('Manager signup failed, trying login...');
            const res = await axios.post(`${API_URL}/auth/login`, {
                email: managerEmail,
                password: managerPassword
            });
            managerToken = res.data.token;
        }

        // 2. Register/Login an Employee
        const employeeEmail = `employee_${Date.now()}@test.com`;
        const employeePassword = 'password123';

        console.log('Registering Employee...');
        let employeeToken;
        let employeeId;
        try {
            const res = await axios.post(`${API_URL}/auth/signup`, {
                name: 'Test Employee',
                email: employeeEmail,
                password: employeePassword,
                role: 'employee',
                company: 'Test Corp' // Same company
            });
            employeeToken = res.data.token;
            employeeId = res.data.user._id;
        } catch (e) {
            console.log('Employee signup failed, trying login...');
            const res = await axios.post(`${API_URL}/auth/login`, {
                email: employeeEmail,
                password: employeePassword
            });
            employeeToken = res.data.token;
            employeeId = res.data.user._id;
        }

        // 3. Create a Task for the Employee
        console.log('Creating Task...');
        const taskRes = await axios.post(`${API_URL}/tasks`, {
            title: 'Trend Verification Task',
            description: 'Testing trends',
            priority: 'high',
            assigned_to: employeeId
        }, {
            headers: { Authorization: `Bearer ${managerToken}` }
        });

        if (!taskRes.data.success) {
            throw new Error('Task creation failed: ' + JSON.stringify(taskRes.data));
        }

        const taskId = taskRes.data.data._id;
        console.log('Task Created with ID:', taskId);

        // 4. Complete the Task (as Employee)
        console.log('Completing Task...');
        await axios.put(`${API_URL}/tasks/${taskId}`, {
            status: 'completed'
        }, {
            headers: { Authorization: `Bearer ${employeeToken}` }
        });

        // 5. Check Employee Trends
        console.log('Checking Employee Trends...');
        const empStatsRes = await axios.get(`${API_URL}/tasks/performance/stats`, {
            headers: { Authorization: `Bearer ${employeeToken}` }
        });
        console.log('Employee Weekly Performance:', JSON.stringify(empStatsRes.data.data.weekly_performance, null, 2));

        // 6. Check Manager Trends
        console.log('Checking Manager Trends...');
        const mgrStatsRes = await axios.get(`${API_URL}/team/performance`, {
            headers: { Authorization: `Bearer ${managerToken}` }
        });
        console.log('Manager Weekly Performance:', JSON.stringify(mgrStatsRes.data.data.weekly_performance, null, 2));

    } catch (error) {
        console.error('Verification Failed:', error.response ? error.response.data : error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        }
    }
}

verifyTrends();
