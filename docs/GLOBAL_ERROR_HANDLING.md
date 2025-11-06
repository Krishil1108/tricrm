# Global Error Handling Implementation Guide

## Overview
Comprehensive error handling system implemented to catch, standardize, and log all errors across the CRM backend API.

## Components

### 1. Error Classes (`backend/errors/AppError.js`)
Custom error classes for different error scenarios:

```javascript
// Base error class
new AppError(message, statusCode, errorCode);

// Specific error types
new ValidationError(message, field);
new AuthenticationError(message);
new AuthorizationError(message);
new NotFoundError(resource);
new ConflictError(message);
new DatabaseError(message);
new RateLimitError(message);
```

**Example Usage:**
```javascript
const { NotFoundError, ValidationError } = require('../errors/AppError');

// In route handler
if (!user) {
  throw new NotFoundError('User');
}

if (!email.includes('@')) {
  throw new ValidationError('Invalid email format', 'email');
}
```

### 2. Error Response Formatter (`backend/errors/ErrorResponse.js`)
Standardizes all error and success responses:

**Error Response Format:**
```json
{
  "status": "error",
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "message": "Invalid email format",
  "timestamp": "2025-11-05T10:30:00.000Z",
  "field": "email"
}
```

**Success Response Format:**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "User created successfully",
  "data": { "id": "123", "name": "John" },
  "timestamp": "2025-11-05T10:30:00.000Z"
}
```

### 3. Async Handler (`backend/errors/asyncHandler.js`)
Wraps async route handlers to catch errors automatically:

```javascript
const { asyncHandler } = require('../errors/asyncHandler');

// Without wrapper (traditional)
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError('User');
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// With wrapper (cleaner)
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new NotFoundError('User');
  res.json(user);
}));
```

### 4. Error Handlers (`backend/middleware/errorHandler.js`)
Specific handlers for different error types:

```javascript
// MongoDB Duplicate Key Error
handleDuplicateKeyError(err) → AppError (409, 'DUPLICATE_ENTRY')

// MongoDB Validation Error
handleValidationError(err) → ValidationError (400)

// JWT Errors
handleJWTError(err) → AuthenticationError (401)
handleJWTExpiredError(err) → AuthenticationError (401)

// MongoDB Cast Error
handleCastError(err) → ValidationError (400)
```

### 5. Global Error Middleware (`backend/middleware/errorHandler.js`)
Main error middleware that:
- Catches all errors
- Formats error responses
- Logs errors
- Sends consistent responses

**Features:**
- ✅ Catches synchronous and asynchronous errors
- ✅ Handles MongoDB errors
- ✅ Handles JWT errors
- ✅ Logs errors with context (user, URL, method)
- ✅ Includes stack traces in development mode
- ✅ Provides development vs production responses

### 6. Logger Utility (`backend/utils/logger.js`)
Comprehensive logging system:

```javascript
logger.error(data);              // Log errors
logger.warn(data);               // Log warnings
logger.info(data);               // Log info messages
logger.debug(data);              // Log debug (dev only)
logger.logRequest(req);          // Log API requests
logger.logResponse(req, status, time); // Log API responses
logger.logDatabaseOperation(op, details); // Log DB ops
```

**Logging Features:**
- ✅ Console output
- ✅ File-based logging (logs/ directory)
- ✅ Daily log rotation
- ✅ Development vs production modes
- ✅ Timestamps and context

### 7. Validation Middleware (`backend/middleware/validation.js`)
Validates request data and returns formatted errors:

```javascript
const { handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');

app.post('/users', 
  body('email').isEmail().withMessage('Invalid email'),
  body('name').notEmpty().withMessage('Name required'),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    // Handler code
  })
);
```

## Implementation Pattern

### Simple Route Implementation
```javascript
const { asyncHandler } = require('../errors/asyncHandler');
const { NotFoundError, ValidationError } = require('../errors/AppError');

// Single resource endpoint
app.get('/api/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  res.status(200).json({
    status: 'success',
    data: user
  });
}));

// Create with validation
app.post('/api/users', asyncHandler(async (req, res) => {
  const { email, name } = req.body;
  
  if (!email || !name) {
    throw new ValidationError('Email and name are required');
  }
  
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }
  
  const user = await User.create({ email, name });
  
  res.status(201).json({
    status: 'success',
    message: 'User created successfully',
    data: user
  });
}));
```

## Error Codes Reference

| Error Code | HTTP Status | Description |
|-----------|------------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| AUTH_ERROR | 401 | Authentication failed |
| FORBIDDEN | 403 | Access denied |
| NOT_FOUND | 404 | Resource not found |
| DUPLICATE_ENTRY | 409 | Resource already exists |
| CONFLICT | 409 | Conflict with existing data |
| RATE_LIMIT | 429 | Too many requests |
| DB_ERROR | 500 | Database error |
| INTERNAL_SERVER_ERROR | 500 | Server error |

## Best Practices

### ✅ Do's
```javascript
// 1. Use async handlers for all route handlers
app.get('/', asyncHandler(async (req, res) => {}));

// 2. Throw specific errors
throw new NotFoundError('User');
throw new ValidationError('Invalid input', 'email');

// 3. Include error codes for programmatic handling
// Error codes help clients determine appropriate action

// 4. Log with context
logger.error({ userId: req.user.id, action: 'create_user' });

// 5. Handle promises properly
const result = await somethingAsync().catch(err => {
  throw new DatabaseError('Operation failed');
});
```

### ❌ Don'ts
```javascript
// 1. Don't use try-catch if using asyncHandler
// This is redundant and catches errors twice

// 2. Don't send custom res.status() and res.json()
// Let error handler send formatted responses

// 3. Don't log and throw (duplicate logging)
// Either log or throw, error handler will do the rest

// 4. Don't use generic errors
throw new Error('Something failed'); // ❌ Bad

// 5. Don't expose internal stack traces
// Only shown in development mode
```

## Error Flow Diagram

```
Request
   ↓
Route Handler (asyncHandler)
   ↓
Success? → Send Response
   ↓
Error Thrown
   ↓
Caught by asyncHandler
   ↓
Error Middleware
   ↓
Format Error Response
   ↓
Log Error
   ↓
Send Response to Client
```

## Configuration

### Environment Variables
```
NODE_ENV=development  # Shows stack traces
NODE_ENV=production   # Hides stack traces
LOG_LEVEL=info        # info, warn, error, debug
```

### Log Files
Logs are stored in `backend/logs/` directory:
```
logs/
├── error-2025-11-05.log
├── warn-2025-11-05.log
├── info-2025-11-05.log
```

## Testing Error Scenarios

### Test Invalid Request
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid"}'
```

**Response:**
```json
{
  "status": "error",
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "message": "Invalid email format",
  "field": "email",
  "timestamp": "2025-11-05T10:30:00.000Z"
}
```

### Test Not Found
```bash
curl http://localhost:5000/api/users/invalid-id
```

**Response:**
```json
{
  "status": "error",
  "statusCode": 404,
  "errorCode": "NOT_FOUND",
  "message": "User not found",
  "timestamp": "2025-11-05T10:30:00.000Z"
}
```

## Next Steps

1. **Update all routes** to use asyncHandler
2. **Add request validation** using express-validator
3. **Implement rate limiting** middleware
4. **Add Helmet.js** for security headers
5. **Setup monitoring** (Sentry, LogRocket)

## Summary

The global error handling system provides:
- ✅ Consistent error responses across API
- ✅ Automatic error catching and formatting
- ✅ Comprehensive logging
- ✅ Easy integration with existing routes
- ✅ Development-friendly debugging
- ✅ Production-ready error handling

All errors are now handled uniformly, logged consistently, and returned in a standardized format! 🎉
