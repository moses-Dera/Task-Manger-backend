const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function runTest() {
    try {
        console.log('1. Signing up new user...');
        const email = `profile_test_${Date.now()}@test.com`;
        const signupRes = await axios.post(`${API_URL}/auth/signup`, {
            name: 'Profile Tester',
            email: email,
            password: 'password123',
            role: 'employee',
            company: 'ProfileCorp'
        });
        const token = signupRes.data.token;
        console.log('User created:', email);

        console.log('2. Updating profile with phone and department...');
        await axios.put(`${API_URL}/users/profile`, {
            phone: '123-456-7890',
            department: 'Testing'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Profile updated.');

        console.log('3. Fetching current user (simulating refresh)...');
        const meRes = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const user = meRes.data.user;

        console.log('Fetched User:', JSON.stringify(user, null, 2));

        const missingFields = [];
        if (!user.phone) missingFields.push('phone');
        if (!user.department) missingFields.push('department');
        // Note: profilePicture might be null if not uploaded, but we can check if the key exists if we want, 
        // but typically mongoose toObject() might strip undefineds. 
        // However, we expect these to be present if we just set them.

        if (user.phone === '123-456-7890' && user.department === 'Testing') {
            console.log('✅ SUCCESS: All fields persisted.');
        } else {
            console.error('❌ FAILURE: Missing or incorrect fields:', missingFields);
            console.log('Phone should be: 123-456-7890, got:', user.phone);
            console.log('Dept should be: Testing, got:', user.department);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) console.error('API Error:', error.response.data);
        process.exit(1);
    }
}

runTest();
