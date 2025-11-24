const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter for Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  requireTLS: true
});

const sendEmail = async (to, subject, html) => {
  console.log(`\n=== EMAIL SEND ATTEMPT (Gmail SMTP) ===`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`From: ${process.env.EMAIL_USER}`);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ EMAIL_USER or EMAIL_PASS is missing in .env');
    throw new Error('Email credentials not configured');
  }

  try {
    const info = await transporter.sendMail({
      from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (err) {
    console.error('❌ Error sending email:', err.message);
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