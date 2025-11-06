const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Configuration based on environment variables
    const emailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    };

    // For development, use ethereal email (fake SMTP)
    if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
      this.setupEtherealEmail();
      return;
    }

    // Production email setup
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      logger.warn('Email credentials not configured. Password reset emails will not be sent.');
      console.warn('⚠️  EMAIL NOT CONFIGURED: Set EMAIL_USER and EMAIL_PASSWORD in .env file');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport(emailConfig);
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      console.error('❌ Email service initialization failed:', error.message);
    }
  }

  // Setup Ethereal email for development/testing
  async setupEtherealEmail() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      logger.info('Using Ethereal email for development');
      console.log('📧 Using Ethereal email (development mode)');
      console.log('   Preview emails at: https://ethereal.email');
    } catch (error) {
      logger.error('Failed to setup Ethereal email:', error);
    }
  }

  // Verify email configuration
  async verifyConnection() {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service verification failed:', error);
      return false;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, resetToken, userName) {
    if (!this.transporter) {
      logger.error('Cannot send email: Email service not configured');
      throw new Error('Email service not configured');
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    const expirationMinutes = 30;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'CRM System'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: this.getPasswordResetEmailTemplate(userName, resetUrl, expirationMinutes),
      text: this.getPasswordResetEmailText(userName, resetUrl, expirationMinutes)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to ${email}`);
      
      // Log preview URL for Ethereal
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Password reset email sent!');
        console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return info;
    } catch (error) {
      logger.error(`Failed to send password reset email to ${email}:`, error);
      throw error;
    }
  }

  // HTML email template for password reset
  getPasswordResetEmailTemplate(userName, resetUrl, expirationMinutes) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            border: 1px solid #ddd;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #2c3e50;
            margin: 0;
          }
          .content {
            background: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #3498db;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .button:hover {
            background: #2980b9;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 20px;
          }
          .token {
            background: #ecf0f1;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            word-break: break-all;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            
            <p>We received a request to reset your password for your CRM account. If you didn't make this request, you can safely ignore this email.</p>
            
            <p>To reset your password, click the button below:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <div class="token">${resetUrl}</div>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0;">
                <li>This link will expire in <strong>${expirationMinutes} minutes</strong></li>
                <li>It can only be used once</li>
                <li>Never share this link with anyone</li>
                <li>If you didn't request this, please contact your administrator</li>
              </ul>
            </div>
            
            <p>For security reasons, we recommend choosing a strong password that:</p>
            <ul>
              <li>Is at least 8 characters long</li>
              <li>Contains uppercase and lowercase letters</li>
              <li>Includes numbers and special characters</li>
              <li>Is unique to this account</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>This is an automated message from CRM System.</p>
            <p>© ${new Date().getFullYear()} CRM System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Plain text email template for password reset
  getPasswordResetEmailText(userName, resetUrl, expirationMinutes) {
    return `
Password Reset Request

Hello ${userName},

We received a request to reset your password for your CRM account. If you didn't make this request, you can safely ignore this email.

To reset your password, visit this link:
${resetUrl}

SECURITY NOTICE:
- This link will expire in ${expirationMinutes} minutes
- It can only be used once
- Never share this link with anyone
- If you didn't request this, please contact your administrator

For security reasons, we recommend choosing a strong password that:
- Is at least 8 characters long
- Contains uppercase and lowercase letters
- Includes numbers and special characters
- Is unique to this account

This is an automated message from CRM System.
© ${new Date().getFullYear()} CRM System. All rights reserved.
    `;
  }

  // Send password changed confirmation email
  async sendPasswordChangedEmail(email, userName) {
    if (!this.transporter) {
      logger.error('Cannot send email: Email service not configured');
      return;
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'CRM System'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Changed Successfully',
      html: `
        <h2>Password Changed</h2>
        <p>Hello ${userName},</p>
        <p>Your password has been changed successfully.</p>
        <p>If you didn't make this change, please contact your administrator immediately.</p>
        <p>Best regards,<br>CRM System</p>
      `,
      text: `Hello ${userName},\n\nYour password has been changed successfully.\n\nIf you didn't make this change, please contact your administrator immediately.\n\nBest regards,\nCRM System`
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`Password changed confirmation sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send password changed email to ${email}:`, error);
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
