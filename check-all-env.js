require('dotenv').config();

const requiredVars = [
    'PORT',
    'MONGODB_URI',
    'FRONTEND_URL',
    'JWT_SECRET',
    'MAILERSEND_API_TOKEN',
    'EMAIL_FROM'
];

console.log('=== Environment Variable Check ===');
let missing = false;

requiredVars.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`❌ Missing: ${varName}`);
        missing = true;
    } else {
        console.log(`✅ Present: ${varName}`);
    }
});

if (missing) {
    console.error('Some environment variables are missing!');
    process.exit(1);
} else {
    console.log('All required environment variables are present.');
}
