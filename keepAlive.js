const axios = require('axios');

// Default to localhost if not provided
const API_URL = process.env.API_URL || 'https://task-manger-backend-z2yz.onrender.com/api/system/health';
const INTERVAL_MINUTES = 14; // Render sleeps after 15 mins

console.log(`Starting Keep-Alive script...`);
console.log(`Target: ${API_URL}`);
console.log(`Interval: ${INTERVAL_MINUTES} minutes`);

const ping = async () => {
    try {
        const start = Date.now();
        const response = await axios.get(API_URL);
        const duration = Date.now() - start;

        console.log(`[${new Date().toISOString()}] Ping successful! Status: ${response.status} (${duration}ms)`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Ping failed:`, error.message);
    }
};

// Initial ping
ping();

// Schedule pings
setInterval(ping, INTERVAL_MINUTES * 60 * 1000);
