const { sendWelcomeEmail } = require('./utils/emailService');
const fs = require('fs');

// Mock sendEmail to capture HTML instead of sending
const emailService = require('./utils/emailService');
emailService.sendEmail = async (to, subject, html) => {
    console.log('--- Captured Email HTML ---');
    console.log(html);
    fs.writeFileSync('debug_email.html', html);
    return { success: true };
};

const runDebug = async () => {
    console.log('Testing with Magic Token...');
    await sendWelcomeEmail({
        name: 'Debug User',
        email: 'debug@example.com',
        role: 'employee',
        company: 'Debug Corp',
        magicToken: 'test-magic-token-123'
    });

    console.log('\nTesting WITHOUT Magic Token...');
    await sendWelcomeEmail({
        name: 'Debug User No Token',
        email: 'debug_no_token@example.com',
        role: 'employee',
        company: 'Debug Corp'
    });
};

runDebug();
