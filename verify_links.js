const { sendWelcomeEmail } = require('./utils/emailService');
require('dotenv').config();

const mockUser = {
    name: 'Link Tester',
    email: process.env.EMAIL_USER || 'test@example.com',
    role: 'employee',
    company: 'Link Test Corp'
};

console.log('Sending test email to verify links...');
sendWelcomeEmail(mockUser, 'temp-pass-123')
    .then(() => console.log('✅ Test email sent. Please check your inbox for the fallback link.'))
    .catch(err => console.error('❌ Test failed:', err.message));
