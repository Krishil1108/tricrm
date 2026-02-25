/**
 * Input Sanitization Middleware
 * Sanitizes and cleans input data
 */

const sanitizeHtml = require('sanitize-html');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

/**
 * Custom sanitization middleware
 * Removes potentially dangerous characters and HTML
 */
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

/**
 * Recursively sanitize object properties
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized;
};

/**
 * Sanitize individual string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;

  // Remove XSS attacks
  let cleaned = xss(str, {
    whiteList: {}, // No HTML tags allowed
    stripIgnoredTag: true,
    stripLeakedHtml: true
  });

  // Remove extra whitespace
  cleaned = cleaned.trim().replace(/\s+/g, ' ');

  // Remove null bytes
  cleaned = cleaned.replace(/\0/g, '');

  // Limit length to prevent buffer overflow
  if (cleaned.length > 10000) {
    cleaned = cleaned.substring(0, 10000);
  }

  return cleaned;
};

/**
 * Sanitize HTML content
 * Use when you need to allow some HTML tags
 */
const sanitizeHtmlContent = (html, allowedTags = []) => {
  return sanitizeHtml(html, {
    allowedTags: allowedTags,
    allowedAttributes: {},
    disallowedTagsMode: 'discard'
  });
};

/**
 * Rate limiting for security
 */
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 login attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins against limit
  handler: (req, res) => {
    // Properly send 429 response instead of throwing
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again in 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour for very sensitive endpoints
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests for this action. Please try again in an hour.'
    });
  }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down.'
    });
  }
});

module.exports = {
  sanitizeInput,
  sanitizeObject,
  sanitizeString,
  sanitizeHtmlContent,
  authLimiter,
  apiLimiter,
  strictLimiter,
  mongoSanitize
};
