/**
 * Standardized API Response Wrapper
 * Ensures all responses follow a consistent format
 */

/**
 * Success Response Format
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {String} message - Success message
 * @param {Number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  const response = {
    status: 'success',
    statusCode: statusCode,
    message: message,
    timestamp: new Date().toISOString(),
    data: data
  };
  
  return res.status(statusCode).json(response);
};

/**
 * Success Response with Pagination
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination metadata
 * @param {String} message - Success message
 */
const sendSuccessWithPagination = (res, data, pagination, message = 'Success') => {
  const response = {
    status: 'success',
    statusCode: 200,
    message: message,
    timestamp: new Date().toISOString(),
    data: data,
    pagination: {
      currentPage: pagination.currentPage || 1,
      totalPages: pagination.totalPages || 1,
      totalItems: pagination.totalItems || data.length,
      itemsPerPage: pagination.itemsPerPage || data.length,
      hasNextPage: pagination.hasNextPage || false,
      hasPreviousPage: pagination.hasPreviousPage || false
    }
  };
  
  return res.status(200).json(response);
};

/**
 * Created Response (201)
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {String} message - Success message
 */
const sendCreated = (res, data, message = 'Resource created successfully') => {
  return sendSuccess(res, data, message, 201);
};

/**
 * No Content Response (204)
 * @param {Object} res - Express response object
 */
const sendNoContent = (res) => {
  return res.status(204).send();
};

/**
 * Error Response Format
 * This is handled by the global error handler
 * But can be used for custom error responses
 */
const sendError = (res, error, statusCode = 500) => {
  const response = {
    status: 'error',
    statusCode: statusCode,
    errorCode: error.errorCode || 'INTERNAL_SERVER_ERROR',
    message: error.message || 'An error occurred',
    timestamp: new Date().toISOString(),
    ...(error.errors && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };
  
  return res.status(statusCode).json(response);
};

/**
 * API Response Middleware
 * Attaches helper methods to res object
 */
const attachResponseHelpers = (req, res, next) => {
  // Attach helper methods to response object
  res.sendSuccess = (data, message, statusCode) => sendSuccess(res, data, message, statusCode);
  res.sendSuccessWithPagination = (data, pagination, message) => sendSuccessWithPagination(res, data, pagination, message);
  res.sendCreated = (data, message) => sendCreated(res, data, message);
  res.sendNoContent = () => sendNoContent(res);
  res.sendError = (error, statusCode) => sendError(res, error, statusCode);
  
  next();
};

module.exports = {
  sendSuccess,
  sendSuccessWithPagination,
  sendCreated,
  sendNoContent,
  sendError,
  attachResponseHelpers
};
