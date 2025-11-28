const { testEmail } = require('./utils/emailService');
require('dotenv').config();

const recipient = process.env.EMAIL_USER || 'okonkwomoses158@gmail.com';
console.log(`Attempting to send test email to ${recipient}...`);

testEmail(recipient)
    .then(res => console.log('Success:', res))
    .catch(err => {
        console.error('Failed to send email.');
        console.error(err);
    });
