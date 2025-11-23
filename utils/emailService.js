const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 5000
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
  } catch (error) {
    // Silent fail for performance
  }
};

const sendWelcomeEmail = async (user) => {
  const html = `<h1>Welcome to TaskFlow!</h1><p>Hello ${user.name}, your account is ready.</p>`;
  await sendEmail(user.email, "Welcome to TaskFlow", html);
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const html = `<h1>Reset Password</h1><p><a href="${resetLink}">Reset your password</a></p>`;
  await sendEmail(user.email, "Reset Password", html);
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