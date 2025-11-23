require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('\n╔════════════════════════════════════════╗');
console.log('║     EMAIL SERVICE DIAGNOSTIC TEST      ║');
console.log('╚════════════════════════════════════════╝\n');

// Check environment variables
console.log('📋 STEP 1: Checking Environment Variables');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const requiredVars = {
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_SECURE: process.env.EMAIL_SECURE
};

let allVarsPresent = true;
Object.entries(requiredVars).forEach(([key, value]) => {
  const status = value ? '✓' : '✗';
  const display = key === 'EMAIL_PASS' 
    ? (value ? '***CONFIGURED***' : 'NOT SET')
    : (key === 'EMAIL_USER' 
      ? (value ? value.substring(0, 5) + '...' : 'NOT SET')
      : value);
  console.log(`  ${status} ${key}: ${display}`);
  if (!value) allVarsPresent = false;
});

if (!allVarsPresent) {
  console.log('\n❌ FAILED: Missing required environment variables!');
  console.log('Please check your .env file\n');
  process.exit(1);
}

console.log('\n✓ All environment variables are set!\n');

// Create transporter
console.log('📨 STEP 2: Creating Email Transporter');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true' || parseInt(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'development' ? false : true
  }
});

console.log(`  Host: ${process.env.EMAIL_HOST}`);
console.log(`  Port: ${process.env.EMAIL_PORT}`);
console.log(`  Secure: ${process.env.EMAIL_SECURE === 'true' || parseInt(process.env.EMAIL_PORT) === 465}`);
console.log(`  Auth User: ${process.env.EMAIL_USER?.substring(0, 5)}...`);
console.log('\n✓ Transporter created!\n');

// Verify connection
console.log('🔗 STEP 3: Verifying SMTP Connection');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

transporter.verify((error, success) => {
  if (error) {
    console.error('\n❌ SMTP Connection FAILED!');
    console.error(`Error Code: ${error.code}`);
    console.error(`Error Message: ${error.message}`);
    console.error('\nTroubleshooting:');
    console.error('  1. Check EMAIL_HOST is correct: ' + process.env.EMAIL_HOST);
    console.error('  2. Check EMAIL_PORT is correct: ' + process.env.EMAIL_PORT);
    console.error('  3. Verify EMAIL_USER and EMAIL_PASS are correct');
    console.error('  4. If using Gmail, ensure App Password (not regular password) is used');
    console.error('  5. Check firewall/network connectivity to SMTP server');
    console.error('  6. Try disabling antivirus/VPN temporarily\n');
    process.exit(1);
  } else {
    console.log('✓ SMTP Connection Verified!\n');
    
    // Send test email
    console.log('📬 STEP 4: Sending Test Email');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const testEmail = process.env.EMAIL_USER; // Send to self
    const testSubject = 'TaskFlow Email Service Test - ' + new Date().toLocaleString();
    const testHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #667eea;">✓ Email Service Working!</h2>
            <p>This is a test email from TaskFlow Task Manager.</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>From:</strong> ${process.env.EMAIL_FROM}</p>
            <p><strong>To:</strong> ${testEmail}</p>
            <hr />
            <p style="color: #666; font-size: 12px;">
              If you received this email, your email service is configured correctly and ready to send:
              <ul>
                <li>Welcome emails for new sign-ups</li>
                <li>Invitation emails for new team members</li>
                <li>Password reset emails</li>
                <li>And more...</li>
              </ul>
            </p>
          </div>
        </body>
      </html>
    `;
    
    transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: testEmail,
      subject: testSubject,
      html: testHtml
    }, (error, info) => {
      if (error) {
        console.error('\n❌ Email Send FAILED!');
        console.error(`Error Code: ${error.code}`);
        console.error(`Error Message: ${error.message}`);
        console.error('\nCommon Causes:');
        console.error('  - Invalid credentials');
        console.error('  - Email account locked');
        console.error('  - Daily sending limit exceeded');
        console.error('  - SMTP authentication failed\n');
        process.exit(1);
      } else {
        console.log('✓ Test Email Sent Successfully!');
        console.log(`  Message ID: ${info.messageId}`);
        console.log(`  Response: ${info.response}`);
        console.log(`  Recipient: ${testEmail}`);
        
        console.log('\n╔════════════════════════════════════════╗');
        console.log('║   ✓ EMAIL SERVICE FULLY OPERATIONAL    ║');
        console.log('╚════════════════════════════════════════╝\n');
        console.log('Check your email inbox (or spam folder) for the test message.\n');
        
        process.exit(0);
      }
    });
  }
});
