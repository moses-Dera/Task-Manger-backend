const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

const sendEmail = async (to, subject, html) => {
  try {
    console.log(`Attempting to send email to: ${to}`);
    const result = await transporter.sendMail({
      from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`Email sent successfully to ${to}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`Email failed to ${to}:`, error.message);
    throw error;
  }
};

const sendWelcomeEmail = async (user) => {
  const html = `<h1>Welcome to TaskFlow!</h1><p>Hello ${user.name}, your account is ready.</p>`;
  await sendEmail(user.email, "Welcome to TaskFlow", html);
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

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
  sendMeetingNotification
};