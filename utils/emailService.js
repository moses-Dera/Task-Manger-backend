const axios = require('axios');
require('dotenv').config();

// MailerSend API configuration
const MAILERSEND_API_URL = 'https://api.mailersend.com/v1/email';
const MAILERSEND_TOKEN = process.env.MAILERSEND_API_TOKEN;

const sendEmail = async (to, subject, html) => {
  console.log(`\n=== EMAIL SEND ATTEMPT (MailerSend API) ===`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`From: ${process.env.EMAIL_FROM}`);

  if (!MAILERSEND_TOKEN) {
    console.error('❌ Missing MailerSend API token');
    throw new Error('MailerSend API token not configured');
  }

  try {
    const emailData = {
      from: {
        email: process.env.EMAIL_FROM,
        name: 'TaskFlow'
      },
      to: [{
        email: to
      }],
      subject: subject,
      html: html
    };

    console.log('Sending email via MailerSend API...');
    const response = await axios.post(MAILERSEND_API_URL, emailData, {
      headers: {
        'Authorization': `Bearer ${MAILERSEND_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    console.log('✅ Email sent successfully!');
    console.log('Response status:', response.status);
    return { success: true, messageId: response.headers['x-message-id'] || 'sent' };

  } catch (err) {
    console.error('❌ MailerSend API Error Details:');
    console.error('Error message:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', JSON.stringify(err.response.data, null, 2));
    }
    throw new Error(err.response?.data?.message || err.message || 'Failed to send email');
  }
};

const getFrontendUrl = () => {
  const url = process.env.FRONTEND_URL || 'http://localhost:5173';
  return url.replace(/\/$/, ''); // Remove trailing slash if present
};

const sendWelcomeEmail = async (user, tempPassword = null) => {
  const frontendUrl = getFrontendUrl();
  const dashboardUrl = `${frontendUrl}/login`;
  const magicLink = user.magicToken ? `${frontendUrl}/magic-login?token=${user.magicToken}` : dashboardUrl;
  console.log('Generated Dashboard URL:', dashboardUrl);
  console.log('Generated Magic Link:', magicLink);
  const subject = 'Welcome to TaskFlow';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to TaskFlow</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); background-color: #667eea; padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">Welcome to TaskFlow! 🎉</h1>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">Hello ${user.name},</h2>
                  
                  <p style="margin: 0 0 20px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                    We're excited to have you on board! Your account has been created successfully and you're all set to start managing your tasks efficiently.
                  </p>
                  
                  <!-- Account Details Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin: 30px 0;">
                    <tr>
                      <td style="padding: 25px;">
                        <h3 style="margin: 0 0 15px 0; color: #667eea; font-size: 18px; font-weight: 600;">Account Details</h3>
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #666666; font-size: 14px; font-weight: 600; width: 120px;">Email:</td>
                            <td style="color: #333333; font-size: 14px;">${user.email}</td>
                          </tr>
                          <tr>
                            <td style="color: #666666; font-size: 14px; font-weight: 600;">Role:</td>
                            <td style="color: #333333; font-size: 14px; text-transform: capitalize;">${user.role}</td>
                          </tr>
                          <tr>
                            <td style="color: #666666; font-size: 14px; font-weight: 600;">Company:</td>
                            <td style="color: #333333; font-size: 14px;">${user.company}</td>
                          </tr>
                          ${tempPassword ? `
                          <tr>
                            <td colspan="2" style="padding-top: 15px;">
                              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin-top: 10px;">
                                <p style="margin: 0 0 8px 0; color: #856404; font-size: 14px; font-weight: 600;">⚠️ Temporary Password</p>
                                <p style="margin: 0; color: #856404; font-size: 16px; font-family: 'Courier New', monospace; font-weight: 700;">${tempPassword}</p>
                                <p style="margin: 10px 0 0 0; color: #856404; font-size: 12px;">Please change this password after your first login for security.</p>
                              </div>
                            </td>
                          </tr>
                          ` : ''}
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 30px 0 20px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                    Ready to get started? Click the button below to access your dashboard:
                  </p>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                          <tr>
                            <td align="center" bgcolor="#667eea" style="border-radius: 8px;">
                              <!--[if mso]>
                              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${magicLink}" style="height:50px;v-text-anchor:middle;width:200px;" arcsize="16%" stroke="f" fillcolor="#667eea">
                                <w:anchorlock/>
                                <center>
                              <![endif]-->
                                  <a href="${magicLink}"
                                     style="background-color:#667eea;border-radius:8px;color:#ffffff;display:inline-block;font-family:'Segoe UI', sans-serif;font-size:16px;font-weight:600;line-height:50px;text-align:center;text-decoration:none;width:200px;-webkit-text-size-adjust:none;">
                                    Go to Dashboard
                                  </a>
                              <!--[if mso]>
                                </center>
                              </v:roundrect>
                              <![endif]-->
                            </td>
                          </tr>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Alternative Link -->
                  <p style="margin: 30px 0 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
                    Or copy and paste this link into your browser:
                  </p>
                  <p style="margin: 10px 0 0 0; color: #667eea; font-size: 14px; word-break: break-all;">
                    <a href="${dashboardUrl}" target="_blank" style="color: #667eea; text-decoration: underline;">${dashboardUrl}</a>
                  </p>
                  
                  <p style="margin: 30px 0 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
                    If you have any questions or need assistance, feel free to reach out to our support team.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="margin: 0 0 10px 0; color: #888888; font-size: 14px;">
                    © ${new Date().getFullYear()} TaskFlow. All rights reserved.
                  </p>
                  <p style="margin: 0; color: #aaaaaa; font-size: 12px;">
                    This is an automated message, please do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  return sendEmail(user.email, subject, html);
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const frontendUrl = getFrontendUrl();
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  const subject = 'Password Reset Request';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); background-color: #667eea; padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">Password Reset Request 🔐</h1>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">Hello ${user.name},</h2>
                  
                  <p style="margin: 0 0 20px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                    We received a request to reset your password for your TaskFlow account.
                  </p>
                  
                  <p style="margin: 0 0 30px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                    Click the button below to reset your password:
                  </p>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                          <tr>
                            <td align="center" bgcolor="#667eea" style="border-radius: 8px;">
                              <!--[if mso]>
                              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${resetUrl}" style="height:50px;v-text-anchor:middle;width:200px;" arcsize="16%" stroke="f" fillcolor="#667eea">
                                <w:anchorlock/>
                                <center>
                              <![endif]-->
                                  <a href="${resetUrl}"
                                     style="background-color:#667eea;border-radius:8px;color:#ffffff;display:inline-block;font-family:'Segoe UI', sans-serif;font-size:16px;font-weight:600;line-height:50px;text-align:center;text-decoration:none;width:200px;-webkit-text-size-adjust:none;">
                                    Reset Password
                                  </a>
                              <!--[if mso]>
                                </center>
                              </v:roundrect>
                              <![endif]-->
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Alternative Link -->
                  <p style="margin: 30px 0 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
                    Or copy and paste this link into your browser:
                  </p>
                  <p style="margin: 10px 0 30px 0; color: #667eea; font-size: 14px; word-break: break-all;">
                    <a href="${resetUrl}" style="color: #667eea; text-decoration: underline;">${resetUrl}</a>
                  </p>
                  
                  <!-- Warning Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; margin: 20px 0;">
                    <tr>
                      <td style="padding: 15px;">
                        <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                          ⚠️ <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 20px 0 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
                    This link will expire in 1 hour for security reasons.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="margin: 0 0 10px 0; color: #888888; font-size: 14px;">
                    © ${new Date().getFullYear()} TaskFlow. All rights reserved.
                  </p>
                  <p style="margin: 0; color: #aaaaaa; font-size: 12px;">
                    This is an automated message, please do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  return sendEmail(user.email, subject, html);
};

const sendMeetingNotification = async (user, meetingDetails) => {
  const subject = 'New Team Meeting Scheduled';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Team Meeting Notification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); background-color: #667eea; padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">Team Meeting Scheduled 📅</h1>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">Hello ${user.name},</h2>
                  
                  <p style="margin: 0 0 30px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                    A new team meeting has been scheduled. Please find the details below:
                  </p>
                  
                  <!-- Meeting Details Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin: 30px 0;">
                    <tr>
                      <td style="padding: 25px;">
                        <h3 style="margin: 0 0 15px 0; color: #667eea; font-size: 18px; font-weight: 600;">Meeting Details</h3>
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #666666; font-size: 14px; font-weight: 600; width: 120px;">Title:</td>
                            <td style="color: #333333; font-size: 14px;">${meetingDetails.title}</td>
                          </tr>
                          <tr>
                            <td style="color: #666666; font-size: 14px; font-weight: 600;">Description:</td>
                            <td style="color: #333333; font-size: 14px;">${meetingDetails.description}</td>
                          </tr>
                          <tr>
                            <td style="color: #666666; font-size: 14px; font-weight: 600;">Scheduled by:</td>
                            <td style="color: #333333; font-size: 14px;">${meetingDetails.manager}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 30px 0 20px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                    Click the button below to join the meeting:
                  </p>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                          <tr>
                            <td align="center" bgcolor="#667eea" style="border-radius: 8px;">
                              <a href="${meetingDetails.meeting_url}"
                                 style="display: inline-block; padding: 16px 40px; font-family: 'Segoe UI', sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; background-color: #667eea; border-radius: 8px; border: 1px solid #667eea;">
                                Join Meeting
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Alternative Link -->
                  <p style="margin: 30px 0 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
                    Or copy and paste this link into your browser:
                  </p>
                  <p style="margin: 10px 0 0 0; color: #667eea; font-size: 14px; word-break: break-all;">
                    <a href="${meetingDetails.meeting_url}" style="color: #667eea; text-decoration: underline;">${meetingDetails.meeting_url}</a>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="margin: 0 0 10px 0; color: #888888; font-size: 14px;">
                    © ${new Date().getFullYear()} TaskFlow. All rights reserved.
                  </p>
                  <p style="margin: 0; color: #aaaaaa; font-size: 12px;">
                    This is an automated message, please do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
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