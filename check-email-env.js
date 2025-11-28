require('dotenv').config();

console.log('Checking Email Configuration...');
console.log('MAILERSEND_API_TOKEN:', process.env.MAILERSEND_API_TOKEN ? 'Present' : 'Missing');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM ? 'Present' : 'Missing');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Present' : 'Missing');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Present' : 'Missing');
