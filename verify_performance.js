const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5000/api';
let authToken = '';

async function verifyPerformance() {
    try {
        console.log('1. Creating a unique manager user...');
        const uniqueId = Date.now();
        const managerEmail = `manager_${uniqueId}@example.com`;
        const managerPassword = 'password123';

        console.log(`Attempting to register: ${managerEmail}`);

        const registerResponse = await axios.post(`${API_URL}/auth/register`, {
            name: 'Test Manager',
            email: managerEmail,
            password: managerPassword,
            companyName: `Test Company ${uniqueId}`,
            role: 'manager'
        });

        if (registerResponse.data.success) {
            authToken = registerResponse.data.token;
            console.log('Registration successful, token received.');
        } else {
            console.error('Registration failed:', registerResponse.data);
            return;
        }

        console.log('2. Fetching performance data...');
        const perfResponse = await axios.get(`${API_URL}/team/performance`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (perfResponse.data.success) {
            const data = perfResponse.data.data;
            console.log('Performance Data Received:');
            console.log('Total Tasks:', data.total_tasks);
            console.log('Completed Tasks:', data.completed_tasks);
            console.log('Weekly Performance:', JSON.stringify(data.weekly_performance, null, 2));

            if (data.weekly_performance && Array.isArray(data.weekly_performance) && data.weekly_performance.length === 4) {
                console.log('SUCCESS: Weekly performance data is present and has 4 weeks.');
            } else {
                console.error('FAILURE: Weekly performance data is missing or incorrect.');
            }
        } else {
            console.error('Failed to fetch performance data:', perfResponse.data);
        }

    } catch (error) {
        console.error('Verification failed:', error.message);
        if (error.response) {
            console.error('Response data:', JSON.stringify(error.response.data));
        }
    }
}

verifyPerformance();
