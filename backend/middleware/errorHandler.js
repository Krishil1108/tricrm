/**
 * Global Error Handler Middleware
 * Catches and formats all errors consistently
 */

const { ErrorResponse } = require('../errors/ErrorResponse');
const { AppError } = require('../errors/AppError');
const logger = require('../utils/logger');

const globalErrorHandler = (err, req, res, next) => {
  // Ensure error has statusCode
  if (!err.statusCode) {
    err.statusCode = 500;
    err.errorCode = 'INTERNAL_SERVER_ERROR';
  }

  // Log the error
  logger.error({
    statusCode: err.statusCode,
    message: err.message,
    errorCode: err.errorCode,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id || 'anonymous'
  });

  // Create error response
  const errorResponse = new ErrorResponse(err, req);

  // Send response
  res.status(errorResponse.statusCode).json(errorResponse.toJSON());
};

/**
 * MongoDB Duplicate Key Error Handler
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyPattern)[0];
  const value = err.keyValue[field];
  
  return new AppError(
    `${field.charAt(0).toUpperCase() + field.slice(1)} "${value}" already exists`,
    409,
    'DUPLICATE_ENTRY'
  );
};

/**
 * MongoDB Validation Error Handler
 */
const handleValidationError = (err) => {
  const messages = Object.values(err.errors)
    .map(val => val.message)
    .join(', ');
  
  return new (require('../errors/AppError').ValidationError)(messages);
};

/**
 * JWT Error Handler
 */
const handleJWTError = () => {
  return new (require('../errors/AppError').AuthenticationError)('Invalid token. Please log in again.');
};

/**
 * JWT Expired Error Handler
 */
const handleJWTExpiredError = () => {
  return new (require('../errors/AppError').AuthenticationError)('Your token has expired. Please log in again.');
};

/**
 * Cast Error Handler (MongoDB)
 */
const handleCastError = (err) => {
  return new (require('../errors/AppError').ValidationError)(`Invalid ${err.path}: ${err.value}`, err.path);
};

module.exports = {
  globalErrorHandler,
  handleDuplicateKeyError,
  handleValidationError,
  handleJWTError,
  handleJWTExpiredError,
  handleCastError
};
