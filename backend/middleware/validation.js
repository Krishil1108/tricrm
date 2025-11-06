/**
 * Validation Middleware
 * Validates request data using express-validator
 */

const { validationResult } = require('express-validator');
const { ValidationError } = require('../errors/AppError');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    const error = new ValidationError('Validation failed');
    error.errors = formattedErrors;
    
    return next(error);
  }
  
  next();
};

module.exports = {
  handleValidationErrors
};
