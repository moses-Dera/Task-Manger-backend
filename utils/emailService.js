const nodemailer = require('nodemailer');

// Log email configuration on startup
console.log('Email Configuration:', {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 5) + '...' : 'NOT SET',
  pass: process.env.EMAIL_PASS ? '***CONFIGURED***' : 'NOT SET',
  from: process.env.EMAIL_FROM
});

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true' || parseInt(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  // Enforce TLS. For local testing with self-signed certs, you might need
  // to temporarily set `rejectUnauthorized: false` in a local-only .env config.
  // For production, this should always be true.
  tls: { rejectUnauthorized: process.env.NODE_ENV === 'development' ? false : true }
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error('================================================');
    console.error('====== ✗ EMAIL SERVICE VERIFICATION FAILED =====');
    console.error('================================================');
    console.error('Error:', error.message);
    console.error('Troubleshooting: Check .env variables (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS) and network/firewall settings.');
    console.error('================================================\n');
  } else {
    console.log('Email service is ready:', success);
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    console.log(`\n[EMAIL] Attempting to send email:`);
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  From: ${process.env.EMAIL_FROM}`);
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    });
    
    console.log(`[EMAIL] ✓ Email sent successfully!`);
    console.log(`  Message ID: ${info.messageId}`);
    console.log(`  Response: ${info.response}\n`);
    return info;
  } catch (error) {
    console.error(`[EMAIL] ✗ Email sending FAILED for ${to}`);
    console.error(`  Error Code: ${error.code}`);
    console.error(`  Error Message: ${error.message}`);
    console.error(`  Full Error:`, error);
    console.error(`\n[EMAIL] Troubleshooting:`);
    console.error(`  - Check EMAIL_HOST: ${process.env.EMAIL_HOST}`);
    console.error(`  - Check EMAIL_PORT: ${process.env.EMAIL_PORT}`);
    console.error(`  - Check EMAIL_USER: ${process.env.EMAIL_USER?.substring(0, 5)}...`);
    console.error(`  - Check EMAIL_SECURE: ${process.env.EMAIL_SECURE}\n`);
    throw error;
  }
};

const sendWelcomeEmail = async (user, tempPassword = null, isInvite = false) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to TaskFlow</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <div style="width: 30px; height: 30px; background: white; border-radius: 6px;"></div>
          </div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Welcome to TaskFlow</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">Your productivity journey starts here</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1a202c; margin: 0 0 16px; font-size: 24px; font-weight: 600;">Hello ${user.name}! </h2>
          
          <p style="color: #4a5568; line-height: 1.6; margin: 0 0 24px; font-size: 16px;">
            ${tempPassword ? 
              `You've been invited to join TaskFlow! Your account has been created and you can start collaborating with your team right away.` : 
              `We're thrilled to have you join our community of productive professionals. Your account has been successfully created and you're ready to transform how you manage tasks.`
            }
          </p>
          
          ${tempPassword ? `
          <!-- Temporary Password Card -->
          <div style="background: #fef5e7; border: 1px solid #f6e05e; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <h3 style="color: #744210; margin: 0 0 16px; font-size: 18px; font-weight: 600;">Your Login Credentials</h3>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #744210; font-weight: 500;">Email:</span>
                <span style="color: #744210; font-weight: 600; font-family: monospace;">${user.email}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #744210; font-weight: 500;">Temporary Password:</span>
                <span style="color: #744210; font-weight: 600; font-family: monospace; background: rgba(116, 66, 16, 0.1); padding: 4px 8px; border-radius: 4px;">${tempPassword}</span>
              </div>
            </div>
            <p style="color: #744210; margin: 16px 0 0; font-size: 14px; font-style: italic;">
              ⚠️ Please change this password after your first login for security.
            </p>
          </div>
          ` : ''}
          
          <!-- Account Card -->
          <div style="background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <h3 style="color: #2d3748; margin: 0 0 16px; font-size: 18px; font-weight: 600;">Your Account Details</h3>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #718096; font-weight: 500;">Name:</span>
                <span style="color: #2d3748; font-weight: 600;">${user.name}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #718096; font-weight: 500;">Email:</span>
                <span style="color: #2d3748; font-weight: 600;">${user.email}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #718096; font-weight: 500;">Role:</span>
                <span style="background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">${user.role}</span>
              </div>
            </div>
          </div>
          
          <!-- Features -->
          <div style="margin: 32px 0;">
            <h3 style="color: #2d3748; margin: 0 0 20px; font-size: 18px; font-weight: 600;">What you can do now:</h3>
            <div style="display: grid; gap: 16px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 8px; height: 8px; background: #48bb78; border-radius: 50%;"></div>
                <span style="color: #4a5568; font-size: 15px;">Create and organize your tasks efficiently</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 8px; height: 8px; background: #ed8936; border-radius: 50%;"></div>
                <span style="color: #4a5568; font-size: 15px;">Collaborate with your team seamlessly</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 8px; height: 8px; background: #667eea; border-radius: 50%;"></div>
                <span style="color: #4a5568; font-size: 15px;">Track progress with powerful analytics</span>
              </div>
            </div>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://b2-b-task-manager.vercel.app'}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: all 0.2s;">Get Started Now</a>
          </div>
          
          <p style="color: #718096; line-height: 1.6; margin: 24px 0 0; font-size: 14px; text-align: center;">
            Need help getting started? Check out our <a href="#" style="color: #667eea; text-decoration: none;">quick start guide</a> or <a href="#" style="color: #667eea; text-decoration: none;">contact support</a>.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f7fafc; padding: 24px 30px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="color: #718096; margin: 0; font-size: 14px;">
            Best regards,<br>
            <strong style="color: #2d3748;">The TaskFlow Team</strong>
          </p>
          <p style="color: #a0aec0; margin: 16px 0 0; font-size: 12px;">
            © 2024 TaskFlow. Empowering productivity, one task at a time.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const subject = isInvite ? 
    '🎉 You\'re Invited to TaskFlow - Get Started!' : 
    '🎉 Welcome to TaskFlow - Let\'s Get Started!';
  
  await sendEmail(user.email, subject, html);
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'https://b2-b-task-manager.vercel.app'}/reset-password?token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - TaskFlow</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center;">
          <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <div style="width: 24px; height: 24px; border: 3px solid white; border-radius: 50%; border-top-color: transparent; animation: spin 1s linear infinite;"></div>
          </div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Password Reset</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">Secure your account in just one click</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1a202c; margin: 0 0 16px; font-size: 24px; font-weight: 600;">Hello ${user.name},</h2>
          
          <p style="color: #4a5568; line-height: 1.6; margin: 0 0 24px; font-size: 16px;">
            We received a request to reset your TaskFlow account password. No worries - it happens to the best of us! Click the button below to create a new password.
          </p>
          
          <!-- Security Notice -->
          <div style="background: #fef5e7; border: 1px solid #f6e05e; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <div style="width: 20px; height: 20px; background: #f6e05e; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="color: #744210; font-size: 12px; font-weight: bold;">!</span>
              </div>
              <h3 style="color: #744210; margin: 0; font-size: 16px; font-weight: 600;">Security Notice</h3>
            </div>
            <p style="color: #744210; margin: 0; font-size: 14px; line-height: 1.5;">
              This reset link will expire in <strong>1 hour</strong> for your security. If you didn't request this reset, you can safely ignore this email.
            </p>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4); transition: all 0.2s;">Reset My Password</a>
          </div>
          
          <!-- Alternative Link -->
          <div style="background: #f7fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="color: #718096; margin: 0 0 8px; font-size: 14px; font-weight: 500;">Button not working? Copy and paste this link:</p>
            <p style="color: #667eea; margin: 0; font-size: 14px; word-break: break-all; font-family: monospace;">${resetUrl}</p>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 32px;">
            <p style="color: #718096; line-height: 1.6; margin: 0; font-size: 14px; text-align: center;">
              Need help? Contact our support team at <a href="mailto:support@taskflow.com" style="color: #667eea; text-decoration: none;">support@taskflow.com</a>
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f7fafc; padding: 24px 30px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="color: #718096; margin: 0; font-size: 14px;">
            Best regards,<br>
            <strong style="color: #2d3748;">The TaskFlow Security Team</strong>
          </p>
          <p style="color: #a0aec0; margin: 16px 0 0; font-size: 12px;">
            © 2024 TaskFlow. Your security is our priority.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await sendEmail(user.email, '🔐 Reset Your TaskFlow Password', html);
};

const sendPasswordResetConfirmation = async (user) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Updated - TaskFlow</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 40px 30px; text-align: center;">
          <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <div style="width: 24px; height: 16px; border-left: 3px solid white; border-bottom: 3px solid white; transform: rotate(-45deg); margin-top: -4px;"></div>
          </div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Password Updated</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">Your account is now secure</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1a202c; margin: 0 0 16px; font-size: 24px; font-weight: 600;">Great news, ${user.name}! ✅</h2>
          
          <p style="color: #4a5568; line-height: 1.6; margin: 0 0 24px; font-size: 16px;">
            Your TaskFlow account password has been successfully updated. Your account is now secure and you can continue using all features without any interruption.
          </p>
          
          <!-- Success Card -->
          <div style="background: #f0fff4; border: 1px solid #9ae6b4; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <div style="width: 20px; height: 20px; background: #48bb78; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <div style="width: 8px; height: 5px; border-left: 2px solid white; border-bottom: 2px solid white; transform: rotate(-45deg); margin-top: -1px;"></div>
              </div>
              <h3 style="color: #22543d; margin: 0; font-size: 16px; font-weight: 600;">Password Successfully Changed</h3>
            </div>
            <p style="color: #22543d; margin: 0; font-size: 14px; line-height: 1.5;">
              Changed on: <strong>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
            </p>
          </div>
          
          <!-- Security Tips -->
          <div style="margin: 32px 0;">
            <h3 style="color: #2d3748; margin: 0 0 20px; font-size: 18px; font-weight: 600;">Security Tips:</h3>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 6px; height: 6px; background: #667eea; border-radius: 50%;"></div>
                <span style="color: #4a5568; font-size: 14px;">Use a unique password for your TaskFlow account</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 6px; height: 6px; background: #667eea; border-radius: 50%;"></div>
                <span style="color: #4a5568; font-size: 14px;">Enable two-factor authentication for extra security</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 6px; height: 6px; background: #667eea; border-radius: 50%;"></div>
                <span style="color: #4a5568; font-size: 14px;">Never share your password with anyone</span>
              </div>
            </div>
          </div>
          
          <!-- Warning Notice -->
          <div style="background: #fef5e7; border: 1px solid #f6e05e; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
              <div style="width: 20px; height: 20px; background: #f6e05e; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="color: #744210; font-size: 12px; font-weight: bold;">!</span>
              </div>
              <h3 style="color: #744210; margin: 0; font-size: 16px; font-weight: 600;">Didn't make this change?</h3>
            </div>
            <p style="color: #744210; margin: 0; font-size: 14px; line-height: 1.5;">
              If you didn't reset your password, please <a href="mailto:security@taskflow.com" style="color: #744210; font-weight: 600;">contact our security team</a> immediately.
            </p>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://b2-b-task-manager.vercel.app'}" style="display: inline-block; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4); transition: all 0.2s;">Continue to TaskFlow</a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f7fafc; padding: 24px 30px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="color: #718096; margin: 0; font-size: 14px;">
            Best regards,<br>
            <strong style="color: #2d3748;">The TaskFlow Security Team</strong>
          </p>
          <p style="color: #a0aec0; margin: 16px 0 0; font-size: 12px;">
            © 2024 TaskFlow. Keeping your account secure, always.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await sendEmail(user.email, '✅ TaskFlow Password Successfully Updated', html);
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation
};