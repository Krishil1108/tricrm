/**
 * Logger Utility
 * Handles logging of errors, warnings, and info messages
 */

const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

const formatLogMessage = (level, data) => {
  const timestamp = getCurrentTimestamp();
  const message = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  
  return `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
};

const writeToFile = (filename, content) => {
  const filepath = path.join(logsDir, filename);
  
  try {
    fs.appendFileSync(filepath, content, 'utf8');
  } catch (error) {
    console.error(`Error writing to log file ${filename}:`, error);
  }
};

const logger = {
  // Log errors
  error: (data) => {
    const message = formatLogMessage('error', data);
    console.error(message);
    
    // Also write to error log file
    const today = new Date().toISOString().split('T')[0];
    writeToFile(`error-${today}.log`, message);
  },

  // Log warnings
  warn: (data) => {
    const message = formatLogMessage('warn', data);
    console.warn(message);
    writeToFile(`warn-${new Date().toISOString().split('T')[0]}.log`, message);
  },

  // Log info (only to file, not console)
  info: (data) => {
    const message = formatLogMessage('info', data);
    // Disabled console logging for info - only write to file
    // console.log(message);
    writeToFile(`info-${new Date().toISOString().split('T')[0]}.log`, message);
  },

  // Log debug (only in development)
  debug: (data) => {
    if (process.env.NODE_ENV === 'development') {
      const message = formatLogMessage('debug', data);
      console.log(message);
    }
  },

  // Log API requests
  logRequest: (req) => {
    const requestLog = {
      timestamp: getCurrentTimestamp(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?.id || 'anonymous',
      userAgent: req.get('user-agent')
    };
    
    logger.info(requestLog);
  },

  // Log API responses
  logResponse: (req, statusCode, responseTime) => {
    const responseLog = {
      timestamp: getCurrentTimestamp(),
      method: req.method,
      url: req.originalUrl,
      statusCode: statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user?.id || 'anonymous'
    };
    
    logger.info(responseLog);
  },

  // Log database operations
  logDatabaseOperation: (operation, details) => {
    const dbLog = {
      timestamp: getCurrentTimestamp(),
      operation: operation,
      ...details
    };
    
    logger.info(dbLog);
  }
};

module.exports = logger;
