const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const newToken = 'mlsn.135a68601f523713f1b8d8f25345e1c4d349c939f26745b706e732593ee01598';

try {
    let envContent = fs.readFileSync(envPath, 'utf8');

    if (envContent.includes('MAILERSEND_API_TOKEN=')) {
        envContent = envContent.replace(/MAILERSEND_API_TOKEN=.*/g, `MAILERSEND_API_TOKEN=${newToken}`);
    } else {
        envContent += `\nMAILERSEND_API_TOKEN=${newToken}`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('Successfully updated .env with new token.');
} catch (error) {
    console.error('Error updating .env:', error);
}
