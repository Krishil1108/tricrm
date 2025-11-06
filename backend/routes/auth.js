const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Role = require('../models/Role');
const PasswordResetToken = require('../models/PasswordResetToken');
const { generateToken, authenticate } = require('../middleware/auth');
const emailService = require('../utils/emailService');
const { authLimiter, strictLimiter } = require('../middleware/sanitization');
const { ValidationError, NotFoundError } = require('../errors/AppError');
const { asyncHandler } = require('../errors/asyncHandler');

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ 
      username: username.toLowerCase() 
    }).populate('role');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is inactive. Please contact administrator.' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data without password
    const userData = user.toJSON();

    res.json({ 
      success: true, 
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login', 
      error: error.message 
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('role')
      .select('-password');

    res.json({ 
      success: true, 
      user 
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticate, async (req, res) => {
  try {
    // In a JWT system, logout is primarily handled client-side by removing the token
    // You could add token blacklisting here if needed
    res.json({ 
      success: true, 
      message: 'Logout successful' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during logout', 
      error: error.message 
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user's own password
// @access  Private
router.post('/change-password', [
  authenticate,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id);

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Update password
    user.password = newPassword;
    user.passwordResetRequired = false;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/auth/permissions
// @desc    Get current user's permissions
// @access  Private
router.get('/permissions', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('role');
    
    if (!user || !user.role) {
      return res.status(404).json({ 
        success: false, 
        message: 'User or role not found' 
      });
    }

    res.json({ 
      success: true, 
      permissions: user.role.permissions,
      roleName: user.role.name 
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ============================================
// PASSWORD RESET ROUTES
// ============================================

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Send password reset email to user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         description: Too many requests
 */
// @route   POST /api/auth/forgot-password
// @desc    Request password reset email
// @access  Public (with strict rate limiting)
router.post('/forgot-password', strictLimiter, [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
], asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Invalid email format', errors.array());
  }

  const { email } = req.body;

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });

  // Always return success message (prevent email enumeration)
  const successMessage = 'If an account with that email exists, a password reset link has been sent.';

  if (!user) {
    // Don't reveal that user doesn't exist
    return res.sendSuccess({}, successMessage);
  }

  // Check if user is active
  if (!user.isActive) {
    // Don't reveal account status
    return res.sendSuccess({}, successMessage);
  }

  // Delete any existing unused reset tokens for this user
  await PasswordResetToken.deleteMany({ 
    userId: user._id, 
    used: false 
  });

  // Generate reset token
  const { token, hashedToken, expiresAt } = PasswordResetToken.createToken(
    user._id,
    req.ip,
    req.get('user-agent')
  );

  // Save hashed token to database
  await PasswordResetToken.create({
    userId: user._id,
    token: hashedToken,
    expiresAt,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  // Send reset email
  try {
    await emailService.sendPasswordResetEmail(
      user.email,
      token,
      user.fullName || user.username
    );
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    // Don't throw error - still return success to prevent email enumeration
  }

  res.sendSuccess({}, successMessage);
}));

/**
 * @swagger
 * /api/auth/verify-reset-token/{token}:
 *   get:
 *     summary: Verify password reset token
 *     description: Check if reset token is valid
 *     tags: [Authentication]
 *     parameters:
 *       - name: token
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token is valid
 *       400:
 *         description: Invalid or expired token
 */
// @route   GET /api/auth/verify-reset-token/:token
// @desc    Verify if reset token is valid
// @access  Public
router.get('/verify-reset-token/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;

  // Verify token
  const tokenDoc = await PasswordResetToken.verifyToken(token);

  if (!tokenDoc) {
    throw new ValidationError('Invalid or expired password reset token');
  }

  res.sendSuccess({
    valid: true,
    email: tokenDoc.userId.email,
    expiresAt: tokenDoc.expiresAt
  }, 'Token is valid');
}));

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     description: Set new password using reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
// @route   POST /api/auth/reset-password
// @desc    Reset password using valid token
// @access  Public (with auth rate limiting)
router.post('/reset-password', authLimiter, [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
], asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { token, newPassword } = req.body;

  // Verify token
  const tokenDoc = await PasswordResetToken.verifyToken(token);

  if (!tokenDoc) {
    throw new ValidationError('Invalid or expired password reset token');
  }

  // Get user
  const user = await User.findById(tokenDoc.userId._id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (!user.isActive) {
    throw new ValidationError('Account is inactive. Please contact administrator.');
  }

  // Update password (will be hashed by pre-save hook)
  user.password = newPassword;
  await user.save();

  // Mark token as used
  await tokenDoc.markAsUsed();

  // Delete all other reset tokens for this user
  await PasswordResetToken.deleteMany({ 
    userId: user._id,
    _id: { $ne: tokenDoc._id }
  });

  // Send confirmation email
  try {
    await emailService.sendPasswordChangedEmail(
      user.email,
      user.fullName || user.username
    );
  } catch (error) {
    console.error('Failed to send password changed email:', error);
    // Don't throw - password was already changed
  }

  res.sendSuccess({
    message: 'Password reset successful. You can now login with your new password.'
  }, 'Password reset successful');
}));

module.exports = router;
