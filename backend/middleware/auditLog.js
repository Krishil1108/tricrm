const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Get the real IP address, respecting common proxy headers.
 */
function getClientIp(req) {
  return (
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Safely persist an audit entry.  Never throws — audit failures must not break normal flow.
 */
async function writeAuditLog(data) {
  try {
    await AuditLog.create(data);
  } catch (err) {
    // Log the failure but do NOT propagate it
    logger.error('Audit log write failed:', err.message);
  }
}

/**
 * auditLog(action, resource?)
 *
 * Returns an Express middleware that fires AFTER the response is sent.
 *
 * Usage:
 *   router.post('/login', auditLog('LOGIN', 'User'), loginHandler)
 *   router.delete('/clients/:id', authenticate, auditLog('DELETE', 'Client'), deleteHandler)
 */
function auditLog(action, resource = null) {
  return (req, res, next) => {
    // Hook into the response finish event so we capture the real status code
    res.on('finish', () => {
      const entry = {
        action,
        resource,
        resourceId: req.params?.id || null,
        method: req.method,
        path: req.originalUrl || req.path,
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'] || null,
        success: res.statusCode < 400,
        statusCode: res.statusCode,
        // Attach user info if authentication middleware ran first
        userId: req.user?._id || req.user?.id || null,
        username: req.user?.username || req.user?.email || req.body?.username || 'anonymous',
      };
      writeAuditLog(entry);
    });

    next();
  };
}

/**
 * auditLogEvent(action, resource, details)
 *
 * Programmatic helper — call directly from controllers when you need
 * fine-grained control (e.g., login failures, permission changes).
 *
 * Usage:
 *   await auditLogEvent(req, 'LOGIN_FAILED', 'User', { reason: 'Bad password', username });
 */
async function auditLogEvent(req, action, resource = null, details = null) {
  await writeAuditLog({
    action,
    resource,
    resourceId: req.params?.id || null,
    method: req.method,
    path: req.originalUrl || req.path,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'] || null,
    success: false,
    statusCode: null,
    userId: req.user?._id || req.user?.id || null,
    username: req.user?.username || req.user?.email || req.body?.username || 'anonymous',
    details,
  });
}

module.exports = { auditLog, auditLogEvent };
