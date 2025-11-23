#!/usr/bin/env node

/**
 * Email Test Script
 * Usage: node test-email.js your-email@example.com
 */

// IMPORTANT: Load .env BEFORE importing anything else
require('dotenv').config();

const nodemailer = require('nodemailer');

const testEmail = process.argv[2] || process.env.EMAIL_USER;

if (!testEmail) {
  console.error('Error: Please provide an email address');
  console.error('Usage: node test-email.js your-email@example.com');
  process.exit(1);
}

console.log('\n=== Email Service Test ===\n');
console.log('Configuration:');
console.log(`  EMAIL_HOST: ${process.env.EMAIL_HOST}`);
console.log(`  EMAIL_PORT: ${process.env.EMAIL_PORT}`);
console.log(`  EMAIL_USER: ${process.env.EMAIL_USER}`);
console.log(`  EMAIL_FROM: ${process.env.EMAIL_FROM}`);
console.log(`  Test recipient: ${testEmail}\n`);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: parseInt(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'development' ? false : true
  }
});

// Verify connection
console.log('Verifying email service...');
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service verification failed:');
    console.error(error.message);
    if (error.message.includes('invalid login')) {
      console.error('\n  Tip: Check your EMAIL_USER and EMAIL_PASS in .env');
      console.error('  For Gmail: Make sure you\'re using an App Password, not your regular password');
    }
    process.exit(1);
  } else {
    console.log('✓ Email service verification successful\n');
    sendTestEmail();
  }
});

async function sendTestEmail() {
  try {
    console.log(`Sending test email to: ${testEmail}...\n`);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: testEmail,
      subject: '🧪 TaskFlow Email Service Test',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #667eea;">✅ Email Service Test Successful!</h2>
              <p>If you're seeing this email, your TaskFlow email service is working correctly.</p>
              
              <div style="background: #f0f7ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0;">What's Next?</h3>
                <ul>
                  <li>You will now receive welcome emails when users sign up</li>
                  <li>Users will receive password reset emails</li>
                  <li>All email notifications will work correctly</li>
                </ul>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                This is a test email sent from the TaskFlow email service at ${new Date().toLocaleString()}
              </p>
            </div>
          </body>
        </html>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✓ Test email sent successfully!');
    console.log(`  Message ID: ${info.messageId}`);
    console.log(`\n  Check your inbox (and spam folder) at: ${testEmail}`);
    console.log('\n=== Email Service is Working! ===\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Failed to send test email:');
    console.error(error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n  Tip: Email host is unreachable. Check EMAIL_HOST and network connection.');
    } else if (error.message.includes('Timeout')) {
      console.error('\n  Tip: Connection timeout. Port 587 might be blocked by firewall.');
    } else if (error.message.includes('invalid login')) {
      console.error('\n  Tip: Invalid credentials. Check EMAIL_USER and EMAIL_PASS.');
    }
    
    process.exit(1);
  }
}
