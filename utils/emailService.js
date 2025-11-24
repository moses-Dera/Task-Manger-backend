const { Resend } = require('resend');
require('dotenv').config();

// Initialize Resend with API Key
// If no key is provided, it will fail gracefully when trying to send
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender: Use 'onboarding@resend.dev' for testing without a domain
// Or use a verified domain if configured in .env
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
    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}" style="background-color: #1C64F2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Login to TaskFlow</a>
    </div>
      
      ${ tempPassword ? '<p style="color: #666; font-size: 14px;"><em>Please change your password after your first login for security.</em></p>' : '' }
      
      <p>If you have any questions, please contact your team administrator.</p>
      <p>Best regards,<br>The TaskFlow Team</p>
    </div >
  `;
  
  return await sendEmail(user.email, "Welcome to TaskFlow - Your Account is Ready!", html);
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetLink = `https://task-flow-rho-eight.vercel.app/reset-password?token=${resetToken}`;
const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1C64F2;">Reset Your Password</h1>
      <p>Hello ${user.name},</p>
      <p>You requested to reset your password. Click the button below to reset it:</p>
      <a href="${resetLink}" style="background-color: #1C64F2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Reset Password</a>
      <p>Or copy this link: ${resetLink}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p> 
    </div>
  `;
return await sendEmail(user.email, "Reset Your TaskFlow Password", html);
};

const sendPasswordResetConfirmation = async (user) => {
  const html = `<h1>Password Reset Successful</h1><p>Your password has been updated.</p>`;
  await sendEmail(user.email, "Password Reset Successful", html);
};

const sendMeetingNotification = async (user, meetingData) => {
  const { title, description, meeting_url, manager } = meetingData;
  const html = `
    <h1>${title}</h1>
    <p>Hello ${user.name},</p>
    <p>${description || `${manager} has started a team meeting.`}</p>
    <p><a href="${meeting_url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Join Meeting</a></p>
    <p>Meeting Link: ${meeting_url}</p>
  `;
  await sendEmail(user.email, `Team Meeting: ${title}`, html);
};

const testEmail = async (to) => {
  const html = `<h1>Test Email</h1><p>This is a simple test email from TaskFlow.</p><p>Time: ${new Date().toISOString()}</p>`;
  return await sendEmail(to, "Simple Test - TaskFlow", html);
};

const sendSimpleEmail = async (to) => {
  const html = `<p>Simple test message</p>`;
  return await sendEmail(to, "Test", html);
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
  sendMeetingNotification,
  testEmail,
  sendSimpleEmail
};