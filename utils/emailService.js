const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
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
  connectionTimeout: 10000
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"TaskFlow Team" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`Email sent to: ${to}`);
  } catch (error) {
    console.error('Email failed:', error.message);
  }
};

const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="text-align: center; color: #333; margin-bottom: 30px; font-size: 24px;">Welcome to TaskFlow!</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">We're excited to have you join our task management platform. You can now create, organize, and collaborate on tasks with your team efficiently.</p>
        
        <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 18px;">Your Account Details:</h3>
          <p style="margin: 5px 0; color: #4a5568;"><strong>Name:</strong> ${user.name}</p>
          <p style="margin: 5px 0; color: #4a5568;"><strong>Email:</strong> ${user.email}</p>
          <p style="margin: 5px 0; color: #4a5568;"><strong>Role:</strong> ${user.role}</p>
          <p style="margin: 5px 0; color: #4a5568;"><strong>Company:</strong> ${user.company}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Get Started</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
        <p style="color: #666; font-size: 14px; text-align: center;">Best regards,<br><strong>TaskFlow Team</strong></p>
      </div>
    </div>
  `;
  
  await sendEmail(user.email, "Welcome to TaskFlow", html);
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="text-align: center; color: #333; margin-bottom: 30px; font-size: 24px;">Reset Your Password</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">We received a request to reset your password. Click the button below to create a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        
        <p style="color: #888; font-size: 14px; margin-top: 25px;">This link will expire in 1 hour for security reasons.</p>
        <p style="color: #888; font-size: 14px;">If you didn't request this password reset, please ignore this email.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
        <p style="color: #666; font-size: 14px; text-align: center;">Best regards,<br><strong>TaskFlow Team</strong></p>
      </div>
    </div>
  `;
  
  await sendEmail(user.email, "Reset Password", html);
};

const sendPasswordResetConfirmation = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="text-align: center; color: #333; margin-bottom: 30px; font-size: 24px;">Password Reset Successful</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">Your TaskFlow password has been successfully reset. You can now log in with your new password.</p>
        
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
          <p style="color: #155724; margin: 0; font-weight: bold;">✓ Password updated successfully</p>
          <p style="color: #155724; margin: 5px 0 0; font-size: 14px;">Your account is now secure.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Continue to TaskFlow</a>
        </div>
        
        <p style="color: #888; font-size: 14px;">If you didn't make this change, please contact our support team immediately.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
        <p style="color: #666; font-size: 14px; text-align: center;">Best regards,<br><strong>TaskFlow Team</strong></p>
      </div>
    </div>
  `;
  
  await sendEmail(user.email, "Password Reset Successful", html);
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation
};