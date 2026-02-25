/**
 * Error Response Formatter
 * Standardizes error responses across the API
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

class ErrorResponse {
  constructor(error, req = null) {
    this.statusCode = error.statusCode || 500;
    this.errorCode = error.errorCode || 'INTERNAL_SERVER_ERROR';
    this.timestamp = error.timestamp || new Date().toISOString();
    
    // In production, mask internal server error messages to avoid leaking implementation details
    // Only safe, intentional app errors (4xx or AppError instances) reveal their message
    if (isProduction && this.statusCode >= 500 && !error.isOperational) {
      this.message = 'An internal server error occurred. Please try again later.';
    } else {
      this.message = error.message || 'An error occurred';
    }
    
    // Stack trace and request details only in development
    if (isDevelopment) {
      this.stack = error.stack;
      this.path = req?.originalUrl || null;
      this.method = req?.method || null;
    }
    
    // Validation error field
    if (error.field) {
      this.field = error.field;
    }
    
    // Validation errors array (safe to expose - they're user-facing field errors)
    this.errors = error.errors || null;
  }

  toJSON() {
    return {
      status: 'error',
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      message: this.message,
      timestamp: this.timestamp,
      ...(this.field && { field: this.field }),
      ...(this.errors && { errors: this.errors }),
      ...(isDevelopment && { 
        stack: this.stack,
        path: this.path,
        method: this.method
      })
    };
  }
}

class SuccessResponse {
  constructor(data, message = 'Success', statusCode = 200) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      status: 'success',
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
      timestamp: this.timestamp
    };
  }
}

module.exports = {
  ErrorResponse,
  SuccessResponse
};
