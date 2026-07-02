const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valParts] = trimmedLine.split('=');
      if (key) {
        process.env[key.trim()] = valParts.join('=').trim();
      }
    }
  });
}

let transporter;

// Create a test account or transport on startup
const initEmail = async () => {
  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      console.log('Configuring Custom SMTP Transporter for real emails...');
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      console.log('Custom SMTP Transporter initialized successfully.');
    } else {
      console.log('Configuring Ethereal Mail Transporter for test environment...');
      // Generate test SMTP service account from ethereal.email
      const testAccount = await nodemailer.createTestAccount();

      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass  // generated ethereal password
        }
      });
      console.log('Ethereal Mail transporter initialized successfully for testing.');
    }
  } catch (err) {
    console.error('Failed to initialize Mail service, using mock console fallback:', err.message);
  }
};

// Initialize right away
initEmail();

const sendLoginNotification = async (userEmail, userName, userRole) => {
  const currentDateTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const mailOptions = {
    from: '"campusFlow System" <no-reply@campusflow.com>',
    to: userEmail,
    subject: '⚠️ Security Alert: Successful Login Notification',
    html: `
      <div style="font-family: 'Outfit', 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 2rem; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
          <h2 style="color: #6366f1; margin: 0; text-transform: uppercase; letter-spacing: 1px;">campusFlow System</h2>
          <p style="margin: 0.3rem 0 0 0; color: #64748b; font-size: 0.9rem;">Security Access Logs</p>
        </div>
        
        <p style="font-size: 1.05rem; font-weight: 600;">Hello ${userName},</p>
        <p>This email is to notify you that your account has been successfully logged into the campusFlow System portal.</p>
        
        <div style="background-color: #f8fafc; padding: 1.2rem; border-radius: 8px; border-left: 4px solid #6366f1; margin: 1.5rem 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
            <tr>
              <td style="color: #64748b; padding: 0.3rem 0; font-weight: 500;">Role:</td>
              <td style="font-weight: 600; padding: 0.3rem 0; color: #0f172a;">${userRole}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 0.3rem 0; font-weight: 500;">Email:</td>
              <td style="font-weight: 600; padding: 0.3rem 0; color: #0f172a;">${userEmail}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 0.3rem 0; font-weight: 500;">Timestamp:</td>
              <td style="font-weight: 600; padding: 0.3rem 0; color: #0f172a;">${currentDateTime} (IST)</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 0.3rem 0; font-weight: 500;">IP Address:</td>
              <td style="font-weight: 600; padding: 0.3rem 0; color: #0f172a;">127.0.0.1 (Localhost)</td>
            </tr>
          </table>
        </div>
        
        <p style="color: #ef4444; font-weight: 500; font-size: 0.9rem;">
          ⚠️ If this login was not authorized by you, please reset your portal password immediately to secure your account.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 2rem 0 1rem 0;" />
        <p style="font-size: 0.8rem; color: #94a3b8; text-align: center; margin: 0;">
          This is an automated system security notification. Please do not reply to this email.
        </p>
      </div>
    `
  };

  // Log to terminal console in a beautiful format
  console.log(`
========================================================================
📬  [EMAIL NOTIFICATION QUEUED]
------------------------------------------------------------------------
To:      ${userEmail}
Subject: ${mailOptions.subject}
Time:    ${currentDateTime} (IST)
User:    ${userName} (${userRole})
========================================================================
`);

  try {
    if (transporter) {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✉️  Email successfully sent to ${userEmail}!`);
      // Dynamic testing link print
      console.log(`🔗  View Preview Email at: ${nodemailer.getTestMessageUrl(info)}`);
      console.log(`========================================================================\n`);
    } else {
      console.log(`⚠️  Transporter not active. Simulated Email Output success!`);
      console.log(`========================================================================\n`);
    }
  } catch (err) {
    console.error('❌ Failed to dispatch email notification:', err.message);
    console.log(`========================================================================\n`);
  }
};

const sendOTPEmail = async (userEmail, otp) => {
  const mailOptions = {
    from: '"campusFlow Verification" <verify@campusflow.com>',
    to: userEmail,
    subject: '🔑 campusFlow Access Portal: Email Verification OTP',
    html: `
      <div style="font-family: 'Outfit', 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 2rem; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
          <h2 style="color: #6366f1; margin: 0; text-transform: uppercase; letter-spacing: 1px;">campusFlow System</h2>
          <p style="margin: 0.3rem 0 0 0; color: #64748b; font-size: 0.9rem;">Email Verification Gateway</p>
        </div>
        
        <p style="font-size: 1.05rem; font-weight: 600;">Hello,</p>
        <p>You have requested access to the campusFlow System portal. To verify your email address, please use the following 6-digit One-Time Password (OTP):</p>
        
        <div style="background-color: #f8fafc; padding: 1.5rem; border-radius: 8px; text-align: center; margin: 2rem 0; border: 1px dashed #6366f1;">
          <span style="font-size: 2.2rem; font-weight: 800; color: #6366f1; letter-spacing: 6px;">${otp}</span>
        </div>
        
        <p style="color: #ef4444; font-weight: 500; font-size: 0.9rem;">
          ⚠️ This OTP is confidential and will expire in 10 minutes. Do not share it with anyone.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 2rem 0 1rem 0;" />
        <p style="font-size: 0.8rem; color: #94a3b8; text-align: center; margin: 0;">
          This is an automated system security notification. Please do not reply to this email.
        </p>
      </div>
    `
  };

  const currentDateTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  console.log(`
========================================================================
📬  [EMAIL OTP QUEUED]
------------------------------------------------------------------------
To:      ${userEmail}
Subject: ${mailOptions.subject}
OTP:     ${otp}
Time:    ${currentDateTime} (IST)
========================================================================
`);

  try {
    if (transporter) {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✉️  OTP Email successfully sent to ${userEmail}!`);
      console.log(`🔗  View Preview Email at: ${nodemailer.getTestMessageUrl(info)}`);
      console.log(`========================================================================\n`);
    } else {
      console.log(`⚠️  Transporter not active. Simulated OTP Email success!`);
      console.log(`========================================================================\n`);
    }
  } catch (err) {
    console.error('❌ Failed to dispatch OTP email:', err.message);
    console.log(`========================================================================\n`);
  }
};

module.exports = { 
  sendLoginNotification,
  sendOTPEmail
};
