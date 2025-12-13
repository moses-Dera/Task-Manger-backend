const axios = require('axios');
const jwt = require('jsonwebtoken'); // You might need to install this or just base64 decode

const API_URL = 'http://localhost:5000/api';

function parseJwt(token) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}

async function verifyToken() {
    try {
        const email = `test_token_${Date.now()}@test.com`;
        console.log('Signing up:', email);

        const res = await axios.post(`${API_URL}/auth/signup`, {
            name: 'Token Tester',
            email: email,
            password: 'password123',
            role: 'manager',
            company: 'Token Corp'
        });

        const token = res.data.token;
        console.log('Token received');

        const decoded = parseJwt(token);
        console.log('Decoded Token:', JSON.stringify(decoded, null, 2));

        if (!decoded.company) {
            console.error('FAIL: Company is missing in token!');
            process.exit(1);
        } else {
            console.log('SUCCESS: Company is present:', decoded.company);
        }

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

verifyToken();
