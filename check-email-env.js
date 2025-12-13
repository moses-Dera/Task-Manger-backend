require('dotenv').config();
const axios = require('axios');

async function checkEmailConfig() {
    console.log('\n=== Email Configuration Check ===');

    // 1. Check Environment Variables
    const token = process.env.MAILERSEND_API_TOKEN;
    const emailFrom = process.env.EMAIL_FROM;

    console.log('Environment Variables:');
    console.log(`MAILERSEND_API_TOKEN: ${token ? 'Present (' + token.substring(0, 8) + '...)' : 'Missing'}`);
    console.log(`EMAIL_FROM: ${emailFrom || 'Missing'}`);
    console.log(`EMAIL_USER: ${process.env.EMAIL_USER || 'Missing'}`);

    if (!token) {
        console.error('❌ Error: MAILERSEND_API_TOKEN is missing in .env');
        return;
    }

    // 2. Validate API Token (List Domains)
    console.log('\nValidating API Token...');
    try {
        const response = await axios.get('https://api.mailersend.com/v1/domains', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ API Token is valid.');
        console.log(`Found ${response.data.data.length} verified domains.`);

        const verifiedDomains = response.data.data.map(d => d.name);
        console.log('Verified Domains:', verifiedDomains);

        // 3. Check if EMAIL_FROM domain is verified
        if (emailFrom) {
            const fromDomain = emailFrom.split('@')[1];
            const isVerified = verifiedDomains.includes(fromDomain);
            if (isVerified) {
                console.log(`✅ Sender domain (@${fromDomain}) is verified.`);
            } else {
                console.warn(`⚠️ Warning: Sender domain (@${fromDomain}) is NOT in the list of verified domains.`);
                console.warn('   Please ensure EMAIL_FROM matches a verified domain in MailerSend.');
            }
        }

    } catch (error) {
        console.error('❌ API Token Validation Failed:');
        if (error.response) {
            console.error(`Status: ${error.response.status} ${error.response.statusText}`);
            console.error('Response:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

checkEmailConfig();
