/**
 * Custom Error Classes for better error handling
 */

class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.timestamp = new Date().toISOString();
    
    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field = null, errorCode = 'VALIDATION_ERROR') {
    super(message, 400, errorCode);
    this.field = field;
    this.isValidationError = true;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', errorCode = 'AUTH_ERROR') {
    super(message, 401, errorCode);
    this.isAuthenticationError = true;
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied', errorCode = 'FORBIDDEN') {
    super(message, 403, errorCode);
    this.isAuthorizationError = true;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource', errorCode = 'NOT_FOUND') {
    super(`${resource} not found`, 404, errorCode);
    this.isNotFoundError = true;
  }
}

class ConflictError extends AppError {
  constructor(message, errorCode = 'CONFLICT') {
    super(message, 409, errorCode);
    this.isConflictError = true;
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', errorCode = 'DB_ERROR') {
    super(message, 500, errorCode);
    this.isDatabaseError = true;
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests', errorCode = 'RATE_LIMIT') {
    super(message, 429, errorCode);
    this.isRateLimitError = true;
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  RateLimitError
};
