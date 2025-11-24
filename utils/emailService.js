const { Resend } = require('resend');
require('dotenv').config();

// Initialize Resend with API Key
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender
const DEFAULT_SENDER = process.env.EMAIL_FROM || 'onboarding@resend.dev';

const sendEmail = async (to, subject, html) => {
  console.log(`\n=== EMAIL SEND ATTEMPT (Resend) ===`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`From: ${DEFAULT_SENDER}`);

  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is missing in .env');
    return { success: false, error: 'Missing API Key' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_SENDER,
      to: to,
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('❌ Resend API Error:', error);
      throw new Error(error.message || 'Failed to send email');
    }

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', data.id);
    return { success: true, messageId: data.id };

  } catch (err) {
    console.error('❌ Unexpected Error sending email:', err.message);
    throw err;
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

// Keep these for compatibility if they are used elsewhere
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