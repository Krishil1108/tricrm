/**
 * Standardized API response helpers for consistent JSON envelopes across all routes.
 */

const sendSuccess = (res, data = null, message = undefined, statusCode = 200, extra = {}) => {
  const payload = { success: true };
  if (message !== undefined) payload.message = message;
  if (data !== null && data !== undefined) payload.data = data;
  Object.assign(payload, extra);
  return res.status(statusCode).json(payload);
};

const sendError = (res, message = 'Server error', statusCode = 500, extra = {}) => {
  const payload = {
    success: false,
    message,
    ...extra
  };
  return res.status(statusCode).json(payload);
};

module.exports = {
  sendSuccess,
  sendError
};
