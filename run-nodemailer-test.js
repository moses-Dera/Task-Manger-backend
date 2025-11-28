const nodemailer = require('nodemailer');
require('dotenv').config();

const sendTestEmail = async () => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Send to self
        subject: 'Test Email via Nodemailer',
        text: 'If you receive this, Nodemailer/Gmail is working.',
    };

    try {
        console.log('Sending email via Nodemailer...');
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

sendTestEmail();
