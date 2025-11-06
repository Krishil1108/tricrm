/**
 * Example: Updated Auth Route with Validation & Error Handling
 * This shows how to integrate validation and error handling
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../errors/asyncHandler');
const { AuthenticationError, ConflictError } = require('../errors/AppError');
const { authValidation, validationHandler } = require('../validators/inputValidation');
const { authLimiter } = require('../middleware/sanitization');
const logger = require('../utils/logger');

// Example: Login Route
// ==================
/*
router.post('/login',
  authLimiter,                    // Rate limit: 5 per 15 min
  authValidation.login,           // Validate email & password
  validationHandler,              // Handle validation errors
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    
    // Log login attempt
    logger.info({
      action: 'login_attempt',
      username: username,
      ip: req.ip
    });
    
    // Find user
    const user = await User.findOne({ username }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      logger.warn({
        action: 'login_failed',
        username: username,
        reason: 'Invalid credentials',
        ip: req.ip
      });
      throw new AuthenticationError('Invalid username or password');
    }
    
    if (user.status === 'suspended') {
      throw new AuthenticationError('Your account has been suspended');
    }
    
    // Generate token
    const token = user.generateAuthToken();
    
    // Log successful login
    logger.info({
      action: 'login_success',
      userId: user._id,
      username: username,
      ip: req.ip
    });
    
    // Get permissions
    const permissions = await user.getPermissions();
    
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        permissions
      }
    });
  })
);
*/

// Example: Register Route
// =======================
/*
router.post('/register',
  authValidation.register,        // Validate registration data
  validationHandler,              // Handle validation errors
  asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    
    // Log registration attempt
    logger.info({
      action: 'registration_attempt',
      username: username,
      email: email
    });
    
    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });
    
    if (existingUser) {
      const field = existingUser.username === username ? 'username' : 'email';
      logger.warn({
        action: 'registration_failed',
        reason: 'User already exists',
        field: field,
        value: existingUser[field]
      });
      throw new ConflictError(`User with this ${field} already exists`);
    }
    
    // Create user
    const user = await User.create({
      username,
      email,
      password
    });
    
    // Get default role
    const defaultRole = await Role.findOne({ name: 'user' });
    user.role = defaultRole._id;
    await user.save();
    
    // Log successful registration
    logger.info({
      action: 'registration_success',
      userId: user._id,
      username: username,
      email: email
    });
    
    // Generate token
    const token = user.generateAuthToken();
    
    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      }
    });
  })
);
*/

// Example: Change Password Route
// ===============================
/*
router.post('/change-password',
  authenticate,                   // Require authentication
  userValidation.changePassword,  // Validate password data
  validationHandler,              // Handle validation errors
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    
    // Verify current password
    if (!(await user.comparePassword(currentPassword))) {
      logger.warn({
        action: 'password_change_failed',
        userId: user._id,
        reason: 'Invalid current password'
      });
      throw new AuthenticationError('Current password is incorrect');
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    logger.info({
      action: 'password_changed',
      userId: user._id,
      username: user.username
    });
    
    res.json({
      status: 'success',
      message: 'Password changed successfully'
    });
  })
);
*/

module.exports = router;
