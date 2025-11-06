/**
 * Input Validation Schemas
 * Using express-validator for robust input validation
 */

const { body, param, query, validationResult } = require('express-validator');

// ==================== AUTH VALIDATION ====================

const authValidation = {
  login: [
    body('username')
      .trim()
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain alphanumeric characters, hyphens, and underscores'),
    
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],

  register: [
    body('username')
      .trim()
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain alphanumeric characters'),
    
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    
    body('confirmPassword')
      .notEmpty().withMessage('Confirm password is required')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Passwords do not match')
  ]
};

// ==================== CLIENT VALIDATION ====================

const clientValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('Client name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Client name must be between 2 and 100 characters')
      .escape(),
    
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('phone')
      .optional()
      .trim()
      .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .withMessage('Please provide a valid phone number'),
    
    body('company')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Company name must not exceed 100 characters')
      .escape(),
    
    body('address')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Address must not exceed 200 characters')
      .escape()
  ],

  update: [
    param('id')
      .isMongoId().withMessage('Invalid client ID'),
    
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Client name must be between 2 and 100 characters')
      .escape(),
    
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('phone')
      .optional()
      .trim()
      .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .withMessage('Please provide a valid phone number'),
    
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
  ]
};

// ==================== INVENTORY VALIDATION ====================

const inventoryValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('Item name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Item name must be between 2 and 100 characters')
      .escape(),
    
    body('sku')
      .optional()
      .trim()
      .matches(/^[A-Z0-9-]+$/).withMessage('SKU can only contain uppercase letters, numbers, and hyphens'),
    
    body('quantity')
      .notEmpty().withMessage('Quantity is required')
      .isInt({ min: 0 }).withMessage('Quantity must be a positive integer'),
    
    body('price')
      .notEmpty().withMessage('Price is required')
      .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    
    body('category')
      .trim()
      .notEmpty().withMessage('Category is required')
      .isLength({ max: 50 }).withMessage('Category must not exceed 50 characters')
      .escape(),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters')
      .escape()
  ],

  update: [
    param('id')
      .isMongoId().withMessage('Invalid inventory item ID'),
    
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Item name must be between 2 and 100 characters')
      .escape(),
    
    body('quantity')
      .optional()
      .isInt({ min: 0 }).withMessage('Quantity must be a positive integer'),
    
    body('price')
      .optional()
      .isFloat({ min: 0 }).withMessage('Price must be a positive number')
  ]
};

// ==================== QUOTE VALIDATION ====================

const quoteValidation = {
  create: [
    body('client')
      .notEmpty().withMessage('Client is required')
      .isMongoId().withMessage('Invalid client ID'),
    
    body('items')
      .isArray({ min: 1 }).withMessage('Quote must have at least one item'),
    
    body('items.*.product')
      .notEmpty().withMessage('Product is required for each item')
      .isMongoId().withMessage('Invalid product ID'),
    
    body('items.*.quantity')
      .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    
    body('items.*.price')
      .isFloat({ min: 0 }).withMessage('Price must be positive'),
    
    body('dueDate')
      .optional()
      .isISO8601().withMessage('Invalid date format'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters')
      .escape()
  ]
};

// ==================== ROLE VALIDATION ====================

const roleValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('Role name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Role name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Role name can only contain letters, numbers, hyphens, and underscores')
      .escape(),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters')
      .escape(),
    
    body('permissions')
      .optional()
      .isArray().withMessage('Permissions must be an array')
  ],

  update: [
    param('id')
      .isMongoId().withMessage('Invalid role ID'),
    
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Role name must be between 2 and 50 characters')
      .escape(),
    
    body('permissions')
      .optional()
      .isArray().withMessage('Permissions must be an array')
  ]
};

// ==================== USER VALIDATION ====================

const userValidation = {
  create: [
    body('username')
      .trim()
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain alphanumeric characters'),
    
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('role')
      .notEmpty().withMessage('Role is required')
      .isMongoId().withMessage('Invalid role ID'),
    
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
      .escape(),
    
    body('phone')
      .optional()
      .trim()
      .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .withMessage('Please provide a valid phone number'),
    
    body('department')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Department must not exceed 50 characters')
      .escape()
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty().withMessage('Current password is required'),
    
    body('newPassword')
      .notEmpty().withMessage('New password is required')
      .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    
    body('confirmPassword')
      .notEmpty().withMessage('Confirm password is required')
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage('Passwords do not match')
  ]
};

// ==================== PAGINATION & FILTERING ====================

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .matches(/^-?[a-zA-Z_]+$/).withMessage('Invalid sort field')
];

// ==================== VALIDATION RESULT HANDLER ====================

const validationHandler = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));
    
    const error = new (require('../errors/AppError').ValidationError)('Validation failed');
    error.errors = formattedErrors;
    
    return next(error);
  }
  
  next();
};

module.exports = {
  // Auth
  authValidation,
  
  // Clients
  clientValidation,
  
  // Inventory
  inventoryValidation,
  
  // Quotes
  quoteValidation,
  
  // Roles
  roleValidation,
  
  // Users
  userValidation,
  
  // Pagination
  paginationValidation,
  
  // Handler
  validationHandler,
  
  // Express-validator exports
  body,
  param,
  query,
  validationResult
};
