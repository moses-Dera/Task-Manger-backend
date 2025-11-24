const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    console.log(`\n=== EMAIL SEND ATTEMPT ===`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`From: ${process.env.EMAIL_USER}`);
    console.log(`Auth User: ${process.env.EMAIL_USER}`);
    console.log(`Auth Pass: ${process.env.EMAIL_PASS ? 'SET' : 'NOT SET'}`);
    
    const mailOptions = {
      from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };
    
    console.log('Mail Options:', mailOptions);
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log(`\n=== EMAIL SEND SUCCESS ===`);
    console.log(`Message ID: ${result.messageId}`);
    console.log(`Response: ${result.response}`);
    console.log(`Accepted: ${result.accepted}`);
    console.log(`Rejected: ${result.rejected}`);
    console.log(`========================\n`);
    
    return { success: true, messageId: result.messageId, response: result.response };
  } catch (error) {
    console.error(`\n=== EMAIL SEND FAILED ===`);
    console.error(`To: ${to}`);
    console.error(`Error:`, {
      message: error.message,
      code: error.code,
      response: error.response,
      responseCode: error.responseCode
    });
    console.error(`========================\n`);
    throw error;
  }
};

const sendWelcomeEmail = async (user, tempPassword = null) => {
  const loginUrl = 'https://task-flow-rho-eight.vercel.app/login';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1C64F2; text-align: center;">Welcome to TaskFlow!</h1>
      <p>Hello ${user.name},</p>
      <p>Your TaskFlow account has been created successfully. You can now access the platform to manage tasks and collaborate with your team.</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333;">Your Account Details:</h3>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Role:</strong> ${user.role}</p>
        ${tempPassword ? `<p><strong>Temporary Password:</strong> ${tempPassword}</p>` : ''}
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="background-color: #1C64F2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Login to TaskFlow</a>
      </div>
      
      ${tempPassword ? '<p style="color: #666; font-size: 14px;"><em>Please change your password after your first login for security.</em></p>' : ''}
      
      <p>If you have any questions, please contact your team administrator.</p>
      <p>Best regards,<br>The TaskFlow Team</p>
    </div>
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