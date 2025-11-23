# Email Service Troubleshooting Guide

## Status: ✓ EMAIL SERVICE FULLY OPERATIONAL

The email service is working correctly and emails ARE being sent. If you're not receiving emails, follow these steps:

---

## 📬 Checklist - Why You Might Not Be Seeing Emails

### 1. Check Your Spam/Junk Folder
- **Gmail**: Look in "Spam" and "Promotions" tabs
- **Outlook**: Check "Junk Email" folder
- **Yahoo**: Check "Spam" folder
- **Other**: Check spam/junk folder in your email client

**Most emails from this service end up in spam on first delivery.**

### 2. Whitelist the Sender
Add `okonkwomoses158@gmail.com` to your contacts to prevent future emails from going to spam:
- Mark email as "Not Spam"
- Add to your contacts/address book
- Create email filter to allow emails from this sender

### 3. Verify the Email Address You Used
- Check that you entered the **correct email** when signing up
- Emails are sent to the address you provided
- If you misspelled it, no email will arrive

### 4. Check Backend Logs
When you try to signup or invite users, the backend logs should show:

**Success Message:**
```
[EMAIL] ✓ Email sent successfully!
  Message ID: <xxxxx>
  Response: 250 2.0.0 OK
```

**Error Message (if applicable):**
```
[EMAIL] ✗ Email sending FAILED
  Error Code: [code]
  Error Message: [message]
```

---

## 🧪 Testing the Email Service

### Run the Email Diagnostic Test
```bash
cd Task-Manger-backend
node test-email-detailed.js
```

This will:
1. ✓ Verify all environment variables are configured
2. ✓ Test SMTP connection to Gmail
3. ✓ Send a test email to the configured account
4. ✓ Report any errors with troubleshooting steps

**Result**: `✓ EMAIL SERVICE FULLY OPERATIONAL`

---

## 📧 Emails That Should Be Sent

### 1. Signup Email
- **When**: User creates a new account
- **Sent To**: The email provided during signup
- **Subject**: "🎉 Welcome to TaskFlow - Let's Get Started!"
- **Contains**: Welcome message, account details, login link

### 2. Employee Invitation Email
- **When**: Manager/Admin invites a new employee
- **Sent To**: The invited employee's email
- **Subject**: "🎉 You're Invited to TaskFlow - Get Started!"
- **Contains**: Welcome message, temporary password, login link

### 3. Password Reset Email
- **When**: User requests password reset
- **Sent To**: User's email
- **Subject**: "Reset Your TaskFlow Password"
- **Contains**: Password reset link (valid for 24 hours)

### 4. Password Reset Confirmation
- **When**: User successfully resets their password
- **Sent To**: User's email
- **Subject**: "Your TaskFlow Password Has Been Reset"
- **Contains**: Confirmation message, instructions

---

## 🔧 Current Configuration

```
Email Provider: Gmail
SMTP Host: smtp.gmail.com
SMTP Port: 465 (Secure/SSL)
From Address: okonkwomoses158@gmail.com
Authentication: App Password
TLS Enabled: Yes
```

**Note**: Using Gmail's App Password (16-character password), not the regular account password.

---

## 🚨 If Emails Are Still Not Arriving

### Step 1: Check Frontend Console
1. Open browser Developer Tools (F12)
2. Go to "Console" tab
3. Try the action (signup/invite)
4. Look for any error messages

### Step 2: Check Backend Logs
Look at the terminal running `node server.js`:
- Search for `[EMAIL]` prefix
- Check for error messages
- Note any error codes

### Step 3: Common Error Codes

| Error Code | Meaning | Solution |
|-----------|---------|----------|
| `ECONNREFUSED` | Can't connect to SMTP server | Check firewall, network connectivity |
| `Invalid login` | Wrong email/password | Verify .env credentials |
| `535 5.7.8 Username and password not accepted` | App Password issue | Regenerate Gmail App Password |
| `EHLO` failure | Server rejected connection | Check EMAIL_HOST and EMAIL_PORT |
| `TLS` error | Secure connection failed | Ensure EMAIL_SECURE=true |

### Step 4: Reset Gmail App Password
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Find "App passwords" section
3. Delete the old password
4. Generate a new one (16 characters)
5. Update .env file: `EMAIL_PASS=djwa yidf irkg cjwf` (replace with new password)
6. Restart backend

### Step 5: Firewall/Network
- Check if port 465 is blocked by firewall
- Try temporarily disabling VPN/Proxy
- Check antivirus email scanning settings
- Try from different network (mobile hotspot)

---

## ✓ Verification Steps

### Test 1: Service Startup
Backend should show on startup:
```
Email Configuration: {
  host: 'smtp.gmail.com',
  port: '465',
  user: 'okonk...',
  pass: '***CONFIGURED***',
  from: 'okonkwomoses158@gmail.com'
}
[Server] Email service initialized
Email service is ready: true
```

### Test 2: Signup Email
1. Go to signup page
2. Enter email and other details
3. Click signup
4. Check backend logs for `[EMAIL]` messages
5. Check inbox/spam for welcome email

### Test 3: Invite Employee
1. Go to User Management
2. Enter employee email in "Invite User"
3. Click "Invite User"
4. Check backend logs
5. Check that email's inbox/spam

---

## 📊 Log Examples

### Successful Email Send
```
[Team] Inviting user: test@example.com with role: employee

[EMAIL] Attempting to send email:
  To: test@example.com
  Subject: 🎉 You're Invited to TaskFlow - Get Started!
  From: okonkwomoses158@gmail.com

[EMAIL] ✓ Email sent successfully!
  Message ID: <2d625da5-c91c-5696...@gmail.com>
  Response: 250 2.0.0 OK
```

### Failed Email Send
```
[EMAIL] ✗ Email sending FAILED for test@example.com
  Error Code: ECONNREFUSED
  Error Message: connect ECONNREFUSED 142.250.9.109:465
  ...
  Troubleshooting:
    - Check EMAIL_HOST: smtp.gmail.com
    - Check EMAIL_PORT: 465
    - Check EMAIL_USER: okonk...
    - Check EMAIL_SECURE: true
```

---

## 💡 Tips

1. **Always check Spam first** - Most first-time emails go to spam
2. **Whitelist the sender** - Add to contacts to improve delivery
3. **Use correct email** - Double-check email spelling
4. **Check logs first** - Backend logs show what happened
5. **Test the service** - Run `test-email-detailed.js` to verify
6. **Give it time** - Emails can take a few seconds to arrive

---

## Need Help?

If emails still aren't working after these steps:

1. Run the diagnostic test: `node test-email-detailed.js`
2. Check backend logs for error messages
3. Verify .env file has correct credentials
4. Check spam folder in email account
5. Try resetting Gmail App Password
6. Check firewall/network connectivity

---

**Last Verified**: 2025-11-23  
**Status**: ✓ FULLY OPERATIONAL
