const getFrontendUrl = () => {
    return 'http://localhost:5173';
};

const sendWelcomeEmail = (user, tempPassword = null) => {
    const frontendUrl = getFrontendUrl();
    const dashboardUrl = `${frontendUrl}/login`;
    const magicLink = user.magicToken ? `${frontendUrl}/magic-login?token=${user.magicToken}` : dashboardUrl;
    console.log('Generated Dashboard URL:', dashboardUrl);
    console.log('Generated Magic Link:', magicLink);

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
                              <a href="${magicLink}" target="_blank"
                                 style="display: inline-block; padding: 16px 40px; font-family: 'Segoe UI', sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; background-color: #667eea; border-radius: 8px; border: 1px solid #667eea;">
                                Go to Dashboard
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
    console.log(html);
};

console.log('--- TEST 1: With Magic Token ---');
sendWelcomeEmail({
    name: 'Test User',
    email: 'test@example.com',
    role: 'employee',
    company: 'Test Corp',
    magicToken: 'magic-token-123'
});

console.log('\n--- TEST 2: Without Magic Token ---');
sendWelcomeEmail({
    name: 'Test User',
    email: 'test@example.com',
    role: 'employee',
    company: 'Test Corp'
});
