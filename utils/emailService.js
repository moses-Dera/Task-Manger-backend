const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");
require('dotenv').config();

// Initialize MailerSend
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_TOKEN,
});

// Default sender email
const DEFAULT_SENDER_EMAIL = process.env.EMAIL_FROM || 'noreply@TaskFlow.com.ng';
const DEFAULT_SENDER_NAME = 'TaskFlow';

const sendEmail = async (to, subject, html) => {
  console.log(`\n=== EMAIL SEND ATTEMPT (MailerSend) ===`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`From: ${DEFAULT_SENDER_EMAIL}`);
  console.log(`API Token: ${process.env.MAILERSEND_API_TOKEN ? 'Set ✓' : 'Missing ✗'}`);

  if (!process.env.MAILERSEND_API_TOKEN) {
    console.error('❌ MAILERSEND_API_TOKEN is missing in .env');
    throw new Error('Email service not configured');
  }

  try {
    const sentFrom = new Sender(DEFAULT_SENDER_EMAIL, DEFAULT_SENDER_NAME);
    const recipients = [new Recipient(to)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(html);

    console.log('Sending email via MailerSend API...');
    const response = await mailerSend.email.send(emailParams);

    console.log('✅ Email sent successfully!');
    console.log('Response:', JSON.stringify(response, null, 2));
    return { success: true, response };

  } catch (err) {
    console.error('❌ MailerSend Error Details:');
    console.error('Error message:', err.message);
    console.error('Error body:', err.body);
    console.error('Full error:', JSON.stringify(err, null, 2));
    throw new Error(err.body?.message || err.message || 'Failed to send email');
  }
};

const sendWelcomeEmail = async (user, tempPassword = null) => {
  const subject = 'Welcome to TaskFlow';
  const html = `
    <h1>Welcome to TaskFlow!</h1>
    <p>Hello ${user.name},</p>
    <p>We are excited to have you on board.</p>
    <p>Your account has been created successfully.</p>
    <p>Role: ${user.role}</p>
    <p>Company: ${user.company}</p>
    ${tempPassword ? `<p><strong>Temporary Password:</strong> ${tempPassword}</p>` : ''}
    <p>Please login and change your password immediately.</p>
  `;
  return sendEmail(user.email, subject, html);
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  const subject = 'Password Reset Request';
  const html = `
    <h1>Password Reset</h1>
    <p>You requested a password reset.</p>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p>If you didn't request this, please ignore this email.</p>
  `;
  return sendEmail(user.email, subject, html);
};

const sendMeetingNotification = async (user, meetingDetails) => {
  const subject = 'New Team Meeting';
  const html = `
    <h1>Team Meeting Notification</h1>
    <p>Hello ${user.name},</p>
    <p>A new meeting has been scheduled.</p>
    <p><strong>Title:</strong> ${meetingDetails.title}</p>
    <p><strong>Description:</strong> ${meetingDetails.description}</p>
    <p><strong>Link:</strong> <a href="${meetingDetails.meeting_url}">Join Meeting</a></p>
    <p>Scheduled by: ${meetingDetails.manager}</p>
  `;
  return sendEmail(user.email, subject, html);
};

const sendPasswordResetConfirmation = async (user) => {
  const html = `<h1>Password Reset Successful</h1><p>Your password has been updated.</p>`;
  return sendEmail(user.email, "Password Reset Successful", html);
};

const testEmail = async (to) => {
  const html = `<h1>Test Email</h1><p>This is a simple test email from TaskFlow.</p><p>Time: ${new Date().toISOString()}</p>`;
  return sendEmail(to, "Simple Test - TaskFlow", html);
};

const sendSimpleEmail = async (to) => {
  const html = `<p>Simple test message</p>`;
  return sendEmail(to, "Test", html);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
  sendMeetingNotification,
  testEmail,
  sendSimpleEmail
};