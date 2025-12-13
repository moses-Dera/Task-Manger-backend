const { sendWelcomeEmail } = require('./utils/emailService');
require('dotenv').config();

const runTest = async () => {
    try {
        const user = {
            name: 'Link Tester',
            email: process.env.EMAIL_USER || 'test@example.com',
            role: 'manager',
            company: 'Test Corp'
        };

        console.log('Sending welcome email to:', user.email);
        await sendWelcomeEmail(user, 'temp-password-123');
        console.log('✅ Email sent successfully.');

    } catch (error) {
        console.error('Test Error:', error);
    }
};

runTest();
