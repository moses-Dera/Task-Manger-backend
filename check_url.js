require('dotenv').config();
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('Type:', typeof process.env.FRONTEND_URL);
console.log('Length:', process.env.FRONTEND_URL ? process.env.FRONTEND_URL.length : 0);
