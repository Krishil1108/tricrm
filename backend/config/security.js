/**
 * Security Configuration
 * Helmet.js and CORS configuration
 */

const helmet = require('helmet');

/**
 * Helmet Middleware Configuration
 * Sets various HTTP headers to protect the app
 */
const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  
  // Enforce HTTPS (X-Content-Type-Options)
  noSniff: true,
  
  // Prevents browsers from MIME-sniffing
  xContentTypeOptions: {
    noSniff: true
  },
  
  // X-Frame-Options - Prevent clickjacking
  frameguard: {
    action: 'deny'
  },
  
  // X-XSS-Protection - XSS filter
  xssFilter: true,
  
  // Strict-Transport-Security
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  },
  
  // Remove powered-by header
  hidePoweredBy: true,
  
  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  
  // Permissions Policy (formerly Feature Policy)
  permissionsPolicy: {
    accelerometer: [],
    camera: [],
    geolocation: [],
    gyroscope: [],
    magnetometer: [],
    microphone: [],
    payment: [],
    usb: [],
    vr: []
  }
});

/**
 * CORS Configuration
 */
const corsConfig = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token'
  ],
  maxAge: 600 // 10 minutes
};

/**
 * Express JSON Parser Options
 */
const jsonOptions = {
  limit: '10mb',
  strict: true,
  type: 'application/json'
};

/**
 * Express URL Encoded Parser Options
 */
const urlencodedOptions = {
  limit: '10mb',
  extended: true,
  parameterLimit: 50
};

module.exports = {
  helmetConfig,
  corsConfig,
  jsonOptions,
  urlencodedOptions
};
