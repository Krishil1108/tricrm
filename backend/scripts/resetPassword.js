/**
 * Admin Password Reset Script
 * 
 * This script allows administrators to reset user passwords directly
 * without requiring email verification. Useful when:
 * - Email service is not configured
 * - User doesn't have access to their email
 * - Emergency password reset is needed
 * 
 * Usage:
 *   node scripts/resetPassword.js <username> <newPassword>
 * 
 * Example:
 *   node scripts/resetPassword.js admin NewSecurePass123!
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tricrm';

async function resetPassword(username, newPassword) {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Import User model after connection
    const User = require('../models/User');

    // Find user
    console.log(`🔍 Searching for user: ${username}`);
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      console.error(`❌ User '${username}' not found`);
      process.exit(1);
    }

    console.log(`✅ User found: ${user.fullName || user.username} (${user.email})`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}\n`);

    // Validate new password
    if (newPassword.length < 8) {
      console.error('❌ Password must be at least 8 characters long');
      process.exit(1);
    }

    // Password strength check
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    console.log('🔐 Password strength check:');
    console.log(`   ${hasUpperCase ? '✅' : '❌'} Contains uppercase letter`);
    console.log(`   ${hasLowerCase ? '✅' : '❌'} Contains lowercase letter`);
    console.log(`   ${hasNumber ? '✅' : '❌'} Contains number`);
    console.log(`   ${hasSpecial ? '✅' : '❌'} Contains special character`);
    console.log('');

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      console.warn('⚠️  Warning: Password should contain uppercase, lowercase, and numbers for better security');
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    user.passwordResetRequired = false;
    await user.save();

    console.log('✅ Password updated successfully!');
    console.log('\n📋 Summary:');
    console.log(`   User: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   New Password: ${newPassword}`);
    console.log('\n🔒 IMPORTANT: Store this password securely and share it with the user through a secure channel.');
    console.log('   Consider requiring the user to change their password on next login.\n');

  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Interactive mode with prompts
async function interactiveMode() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter username: ', (username) => {
      rl.question('Enter new password: ', (password) => {
        rl.close();
        resolve({ username, password });
      });
    });
  });
}

// Main execution
(async () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Admin Password Reset Utility             ║');
  console.log('║   CRM System - Emergency Password Reset    ║');
  console.log('╚════════════════════════════════════════════╝\n');

  let username, newPassword;

  // Check if arguments provided
  if (process.argv.length >= 4) {
    username = process.argv[2];
    newPassword = process.argv[3];
  } else if (process.argv.length === 3 && process.argv[2] === '--help') {
    console.log('Usage:');
    console.log('  node scripts/resetPassword.js <username> <newPassword>');
    console.log('  node scripts/resetPassword.js (interactive mode)');
    console.log('\nExample:');
    console.log('  node scripts/resetPassword.js admin NewSecurePass123!');
    console.log('\nPassword Requirements:');
    console.log('  - Minimum 8 characters');
    console.log('  - At least one uppercase letter');
    console.log('  - At least one lowercase letter');
    console.log('  - At least one number');
    console.log('  - Special characters recommended\n');
    process.exit(0);
  } else {
    // Interactive mode
    console.log('No arguments provided. Starting interactive mode...\n');
    const inputs = await interactiveMode();
    username = inputs.username;
    newPassword = inputs.password;
  }

  if (!username || !newPassword) {
    console.error('❌ Username and password are required');
    console.log('Run with --help for usage information');
    process.exit(1);
  }

  await resetPassword(username, newPassword);
})();
