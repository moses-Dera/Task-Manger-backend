const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'utils', 'emailService.js');
console.log(`Checking ${filePath}...`);

try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check 1: Double TR tag
    const doubleTrRegex = /<tr>\s*<tr>/g;
    if (doubleTrRegex.test(content)) {
        console.error('❌ FAIL: Double <tr> tags found in email template!');
    } else {
        console.log('✅ PASS: No double <tr> tags found.');
    }

    // Check 2: Production URL
    if (content.includes('process.env.FRONTEND_URL')) {
        console.log('✅ PASS: Uses process.env.FRONTEND_URL');
    } else {
        console.error('❌ FAIL: Does NOT use process.env.FRONTEND_URL');
    }

    // Check 3: Backup Link
    if (content.includes('${magicLink}</a>') && content.includes('Alternative Link')) {
        console.log('✅ PASS: Backup Magic Link is present in HTML');
    } else {
        console.error('❌ FAIL: Backup Magic Link seems missing');
    }

} catch (err) {
    console.error('Error reading file:', err);
}
