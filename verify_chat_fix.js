const io = require('./node_modules/socket.io-client');
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runTest() {
    try {
        console.log('1. Creating two users...');
        // User A
        const emailA = `userA_${Date.now()}@test.com`;
        const resA = await axios.post(`${API_URL}/auth/signup`, {
            name: 'User A', email: emailA, password: 'password123', role: 'employee', company: 'ChatCorp'
        });
        const tokenA = resA.data.token;
        const userA = resA.data.user;

        // User B
        const emailB = `userB_${Date.now()}@test.com`;
        const resB = await axios.post(`${API_URL}/auth/signup`, {
            name: 'User B', email: emailB, password: 'password123', role: 'employee', company: 'ChatCorp'
        });
        const tokenB = resB.data.token;
        const userB = resB.data.user;

        console.log('2. Connecting User B to socket...');
        const socketB = io(SOCKET_URL, {
            auth: { token: tokenB },
            transports: ['websocket']
        });

        await new Promise((resolve, reject) => {
            socketB.on('connect', () => {
                console.log('User B connected to socket');
                resolve();
            });
            socketB.on('connect_error', (err) => reject(err));
            setTimeout(() => reject(new Error('Socket connection timeout')), 5000);
        });

        console.log('3. Listening for messages on User B...');
        const messagePromise = new Promise((resolve, reject) => {
            socketB.on('new_message', (data) => {
                console.log('Received message event:', JSON.stringify(data, null, 2));

                // Verify structure
                if (data.message && data.message.sender_id && data.message.sender_id._id) {
                    console.log('✅ Structure is correct (populated sender_id)');
                    resolve();
                } else {
                    console.error('❌ Structure is INCORRECT (missing populated fields)');
                    reject(new Error('Invalid message structure'));
                }
            });
            setTimeout(() => reject(new Error('Message timeout')), 5000);
        });

        console.log('4. Sending message from User A via API...');
        await axios.post(`${API_URL}/chat/send`, {
            recipient_id: userB.id,
            message: 'Hello from User A'
        }, {
            headers: { Authorization: `Bearer ${tokenA}` }
        });

        await messagePromise;
        console.log('✅ Test Passed: Real-time message received correctly');

        socketB.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) console.error('API Error:', error.response.data);
        process.exit(1);
    }
}

runTest();
