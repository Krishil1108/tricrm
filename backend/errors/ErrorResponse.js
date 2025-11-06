/**
 * Error Response Formatter
 * Standardizes error responses across the API
 */

const isDevelopment = process.env.NODE_ENV === 'development';

class ErrorResponse {
  constructor(error, req = null) {
    this.statusCode = error.statusCode || 500;
    this.errorCode = error.errorCode || 'INTERNAL_SERVER_ERROR';
    this.message = error.message || 'An error occurred';
    this.timestamp = error.timestamp || new Date().toISOString();
    
    // Additional fields for development
    if (isDevelopment) {
      this.stack = error.stack;
      this.path = req?.originalUrl || null;
      this.method = req?.method || null;
    }
    
    // Validation error field
    if (error.field) {
      this.field = error.field;
    }
    
    // Additional details
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
