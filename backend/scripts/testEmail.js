/**
 * Email Configuration Diagnostic Script
 * Tests email service without starting the full server
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('╔════════════════════════════════════════════╗');
console.log('║   Email Service Diagnostic Tool            ║');
console.log('╚════════════════════════════════════════════╝\n');

// Step 1: Check environment variables
console.log('📋 Step 1: Checking Environment Variables\n');

const requiredVars = {
  'EMAIL_HOST': process.env.EMAIL_HOST,
  'EMAIL_PORT': process.env.EMAIL_PORT,
  'EMAIL_USER': process.env.EMAIL_USER,
  'EMAIL_PASSWORD': process.env.EMAIL_PASSWORD ? '***configured***' : undefined,
  'EMAIL_FROM_NAME': process.env.EMAIL_FROM_NAME,
  'FRONTEND_URL': process.env.FRONTEND_URL
};

let allConfigured = true;
for (const [key, value] of Object.entries(requiredVars)) {
  if (value) {
    console.log(`✅ ${key}: ${value}`);
  } else {
    console.log(`❌ ${key}: NOT SET`);
    allConfigured = false;
  }
}

if (!allConfigured) {
  console.log('\n❌ Some required variables are missing!');
  process.exit(1);
}

// Step 2: Test SMTP connection
console.log('\n📡 Step 2: Testing SMTP Connection\n');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  debug: true, // Enable debug output
  logger: true  // Enable logging
});

console.log('Attempting to connect to Gmail SMTP...\n');

transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ SMTP Connection Failed!\n');
    console.log('Error Details:');
    console.log('  Type:', error.code || 'Unknown');
    console.log('  Message:', error.message);
    console.log('  Response:', error.response || 'No response');
    
    console.log('\n🔍 Common Issues:\n');
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.log('  ❌ Authentication Failed');
      console.log('     • Check if App Password is correct');
      console.log('     • Verify 2-Step Verification is enabled');
      console.log('     • Try generating a new App Password');
      console.log('     • Make sure no spaces in password');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
      console.log('  ❌ Connection Timeout');
      console.log('     • Check internet connection');
      console.log('     • Check firewall settings');
      console.log('     • Verify port 587 is open');
    } else if (error.code === 'ENOTFOUND') {
      console.log('  ❌ Host Not Found');
      console.log('     • Check EMAIL_HOST is correct');
      console.log('     • Verify DNS resolution');
    }
    
    console.log('\n💡 Suggested Actions:');
    console.log('   1. Generate new App Password at: https://myaccount.google.com/apppasswords');
    console.log('   2. Update .env with new password');
    console.log('   3. Restart server');
    console.log('   4. Run this diagnostic again\n');
    
    process.exit(1);
  } else {
    console.log('✅ SMTP Connection Successful!\n');
    console.log('Gmail SMTP server is accessible and credentials are valid.\n');
    
    // Step 3: Send test email
    console.log('📧 Step 3: Sending Test Email\n');
    
    const testEmail = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to self
      subject: 'Test Email - CRM Password Reset System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #4caf50; margin-top: 0;">✅ Email Service Working!</h2>
            <p>Congratulations! Your CRM email service is configured correctly.</p>
            <div style="background: #f0f7ff; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
              <strong>Configuration Details:</strong>
              <ul style="margin: 10px 0;">
                <li>Host: ${process.env.EMAIL_HOST}</li>
                <li>Port: ${process.env.EMAIL_PORT}</li>
                <li>From: ${process.env.EMAIL_USER}</li>
              </ul>
            </div>
            <p><strong>What's Working:</strong></p>
            <ul>
              <li>✅ SMTP connection established</li>
              <li>✅ Authentication successful</li>
              <li>✅ Email sending capability confirmed</li>
            </ul>
            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Test password reset at: <a href="${process.env.FRONTEND_URL}/forgot-password">${process.env.FRONTEND_URL}/forgot-password</a></li>
              <li>Enter your email: ${process.env.EMAIL_USER}</li>
              <li>Check your inbox for reset link</li>
            </ol>
            <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px;">
              This is an automated test email from your CRM Password Reset System.<br>
              Generated at: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `,
      text: `
✅ Email Service Working!

Congratulations! Your CRM email service is configured correctly.

Configuration Details:
- Host: ${process.env.EMAIL_HOST}
- Port: ${process.env.EMAIL_PORT}
- From: ${process.env.EMAIL_USER}

What's Working:
✅ SMTP connection established
✅ Authentication successful
✅ Email sending capability confirmed

Next Steps:
1. Test password reset at: ${process.env.FRONTEND_URL}/forgot-password
2. Enter your email: ${process.env.EMAIL_USER}
3. Check your inbox for reset link

This is an automated test email from your CRM Password Reset System.
Generated at: ${new Date().toLocaleString()}
      `
    };
    
    transporter.sendMail(testEmail, function(error, info) {
      if (error) {
        console.log('❌ Failed to send test email:\n');
        console.log('   Error:', error.message);
        process.exit(1);
      } else {
        console.log('✅ Test email sent successfully!\n');
        console.log('📬 Email Details:');
        console.log('   Message ID:', info.messageId);
        console.log('   Response:', info.response);
        console.log('   To:', process.env.EMAIL_USER);
        
        console.log('\n🎉 SUCCESS! Check your inbox at:', process.env.EMAIL_USER);
        console.log('\n💡 If you don\'t see the email:');
        console.log('   • Check spam/junk folder');
        console.log('   • Wait 1-2 minutes for delivery');
        console.log('   • Check Gmail "All Mail" folder\n');
        
        console.log('✅ Email service is fully operational!\n');
        console.log('You can now test password reset at:');
        console.log(`   ${process.env.FRONTEND_URL}/forgot-password\n`);
        
        process.exit(0);
      }
    });
  }
});
