require('dotenv').config();
const { sendEmail } = require('./utils/emailService');

async function testResend() {
    console.log('Final Code Check...');
    try {
        const result = await sendEmail('okonkwomoses158@gmail.com', 'Final Check', '<p>Code is good.</p>');
        if (result.success) {
            console.log('✅ SUCCESS: Code is working perfectly.');
        } else {
            console.error('❌ FAILURE:', result.error);
        }
    } catch (e) {
        console.error('❌ CRITICAL ERROR:', e);
    }
}

testResend();
