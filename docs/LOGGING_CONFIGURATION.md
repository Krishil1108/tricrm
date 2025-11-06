# Logging Configuration

## Overview
The logging system has been configured to reduce console noise while maintaining comprehensive log files for debugging and auditing.

## Current Configuration

### Console Output
- ✅ **Errors**: Displayed in console (RED) - Critical issues that need immediate attention
- ✅ **Warnings**: Displayed in console (YELLOW) - Important issues that should be reviewed
- ❌ **Info**: NOT displayed in console - Stored only in files to reduce noise
- ❌ **Debug**: Only in development mode

### File Storage
All logs are stored in the `backend/logs/` directory:

- `error-YYYY-MM-DD.log` - Error logs
- `warn-YYYY-MM-DD.log` - Warning logs  
- `info-YYYY-MM-DD.log` - Info logs (API requests, responses, database operations)

### Log Rotation
- Daily rotation by date
- Each log level has its own file
- Old logs are preserved automatically

## Logger Methods

### Error Logging
```javascript
logger.error('Something went wrong');
logger.error({ message: 'Database error', details: error });
```
**Output**: Console + File

### Warning Logging
```javascript
logger.warn('This should be reviewed');
logger.warn({ message: 'Deprecated API used', endpoint: '/old-api' });
```
**Output**: Console + File

### Info Logging
```javascript
logger.info('User logged in');
logger.info({ action: 'login', userId: '123' });
```
**Output**: File Only (No Console)

### Request/Response Logging
```javascript
logger.logRequest(req);
logger.logResponse(req, statusCode, responseTime);
```
**Output**: File Only

### Database Operations
```javascript
logger.logDatabaseOperation('CREATE', { collection: 'users', documentId: '123' });
```
**Output**: File Only

## Benefits

1. **Clean Console**: Only important messages (errors/warnings) shown
2. **Complete Audit Trail**: All activity logged to files
3. **Easy Debugging**: Review info logs in files when needed
4. **Performance**: Reduced console I/O improves performance
5. **Production Ready**: Proper log levels for production environments

## Enable Info Logs in Console (If Needed)

If you need to temporarily see info logs in console, edit `backend/utils/logger.js`:

```javascript
// Log info
info: (data) => {
  const message = formatLogMessage('info', data);
  console.log(message); // Uncomment this line
  writeToFile(`info-${new Date().toISOString().split('T')[0]}.log`, message);
},
```

## Future Enhancement: Database Logging

For long-term log storage and analysis, consider implementing database logging:

### Schema Example
```javascript
const LogSchema = new mongoose.Schema({
  level: { type: String, enum: ['error', 'warn', 'info', 'debug'], required: true },
  message: { type: String, required: true },
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now, index: true },
  userId: String,
  endpoint: String,
  statusCode: Number,
  responseTime: Number,
  ip: String,
  userAgent: String
}, {
  timestamps: true,
  capped: { size: 10000000, max: 100000 } // 10MB, max 100k documents
});
```

### Implementation
```javascript
// In logger.js
const Log = require('../models/Log');

info: async (data) => {
  const message = formatLogMessage('info', data);
  writeToFile(`info-${new Date().toISOString().split('T')[0]}.log`, message);
  
  // Store in database (non-blocking)
  try {
    await Log.create({
      level: 'info',
      message: typeof data === 'string' ? data : JSON.stringify(data),
      metadata: typeof data === 'object' ? data : {}
    });
  } catch (err) {
    // Don't let logging errors crash the app
    console.error('Failed to log to database:', err);
  }
}
```

### Benefits of Database Logging
- Query logs by date range, user, endpoint, etc.
- Real-time log monitoring dashboards
- Automated alerts on error patterns
- Log analytics and reporting
- Centralized logging for microservices

## Log Viewing Commands

```bash
# View today's error logs
type backend\logs\error-2025-11-05.log

# View today's info logs
type backend\logs\info-2025-11-05.log

# Watch error logs in real-time
Get-Content backend\logs\error-2025-11-05.log -Wait

# Search for specific errors
findstr "MongoDB" backend\logs\error-2025-11-05.log

# Count log entries
(Get-Content backend\logs\info-2025-11-05.log | Measure-Object -Line).Lines
```

## Production Recommendations

1. **Use Environment Variables**: Control log levels via environment
2. **Log Rotation**: Implement size-based rotation (e.g., using `winston` or `rotating-file-stream`)
3. **Centralized Logging**: Consider services like CloudWatch, LogDNA, or ELK Stack
4. **Performance**: Use async file writing for high-traffic applications
5. **Security**: Sanitize sensitive data before logging (passwords, tokens, etc.)

## Status
✅ Info logs disabled in console
✅ All logs still written to files
✅ Error and warning logs visible in console
✅ Log files organized by date and level
