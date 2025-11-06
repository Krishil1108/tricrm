# Input Validation & Sanitization + Security Headers Implementation

## Overview
Comprehensive security implementation including:
- Input validation with express-validator
- XSS and NoSQL injection prevention
- Rate limiting
- Security headers with Helmet.js
- CORS configuration

## Components Implemented

### 1. Input Validation (`backend/validators/inputValidation.js`)

Validation schemas for all major routes:

#### Auth Validation
```javascript
authValidation.login
authValidation.register
```

#### Client Validation
```javascript
clientValidation.create
clientValidation.update
```

#### Inventory Validation
```javascript
inventoryValidation.create
inventoryValidation.update
```

#### Quote Validation
```javascript
quoteValidation.create
```

#### Role Validation
```javascript
roleValidation.create
roleValidation.update
```

#### User Validation
```javascript
userValidation.create
userValidation.updateProfile
userValidation.changePassword
```

### 2. Input Sanitization (`backend/middleware/sanitization.js`)

**Features:**
- ✅ XSS attack prevention
- ✅ NoSQL injection prevention
- ✅ HTML stripping
- ✅ Null byte removal
- ✅ Whitespace normalization
- ✅ Buffer overflow prevention
- ✅ Rate limiting (login, API, strict)

**Sanitization Methods:**
```javascript
sanitizeInput          // Middleware for all inputs
sanitizeObject        // Recursive object sanitization
sanitizeString        // String sanitization
sanitizeHtmlContent   // HTML content with allowed tags
```

**Rate Limiters:**
```javascript
authLimiter   // 5 attempts per 15 minutes
apiLimiter    // 100 requests per minute
strictLimiter // 10 requests per minute
```

### 3. Security Headers (`backend/config/security.js`)

Helmet.js configuration includes:

#### HTTP Headers Set
| Header | Purpose | Value |
|--------|---------|-------|
| Content-Security-Policy | XSS & Injection protection | Restricted |
| X-Content-Type-Options | MIME sniffing prevention | nosniff |
| X-Frame-Options | Clickjacking prevention | DENY |
| X-XSS-Protection | Browser XSS filter | enabled |
| Strict-Transport-Security | HTTPS enforcement | 1 year |
| Referrer-Policy | Referrer control | strict-origin-when-cross-origin |
| Permissions-Policy | Feature access control | All disabled |

#### CORS Configuration
```javascript
allowedOrigins: ['http://localhost:3000', 'http://localhost:5000']
credentials: true
methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
maxAge: 600 seconds
```

## Integration in server.js

**Security Middleware Stack:**
```javascript
1. Helmet.js - Security headers
2. mongoSanitize - NoSQL injection prevention
3. sanitizeInput - XSS prevention
4. apiLimiter - Rate limiting
5. Request logging
```

## Usage Examples

### 1. Login Endpoint with Validation

```javascript
const { authValidation, validationHandler } = require('../validators/inputValidation');
const { asyncHandler } = require('../errors/asyncHandler');
const { authLimiter } = require('../middleware/sanitization');

router.post('/login',
  authLimiter,                    // Rate limit: 5 per 15 min
  authValidation.login,           // Validate input
  validationHandler,              // Handle validation errors
  asyncHandler(async (req, res) => {
    // Handler code
  })
);
```

### 2. Create Client with Validation

```javascript
const { clientValidation, validationHandler } = require('../validators/inputValidation');

router.post('/clients',
  clientValidation.create,
  validationHandler,
  asyncHandler(async (req, res) => {
    // req.body is already sanitized
    const client = await Client.create(req.body);
    res.status(201).json({ status: 'success', data: client });
  })
);
```

### 3. Update Inventory with Validation

```javascript
const { inventoryValidation, validationHandler } = require('../validators/inputValidation');

router.put('/inventory/:id',
  inventoryValidation.update,
  validationHandler,
  asyncHandler(async (req, res) => {
    // req.params.id and req.body are sanitized
    const item = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json({ status: 'success', data: item });
  })
);
```

## Validation Rules Reference

### Username
- Length: 3-50 characters
- Characters: alphanumeric, hyphens, underscores
- Examples: `user_123`, `john-doe`

### Email
- Valid email format
- Normalized to lowercase
- Example: `user@example.com`

### Password (Auth)
- Minimum: 6 characters

### Password (New User)
- Minimum: 8 characters
- Requirements: uppercase, lowercase, number, special character (@$!%*?&)
- Example: `SecurePass123!`

### Phone
- Valid international format
- Examples: `+1 (555) 123-4567`, `555-123-4567`

### Quantity
- Must be positive integer
- Example: `10`

### Price
- Must be positive number
- Example: `99.99`

### Date
- ISO 8601 format
- Example: `2025-11-05T10:30:00Z`

### MongoDB ID
- Valid 24-character hex string
- Example: `507f1f77bcf86cd799439011`

## Security Features

### XSS Prevention
```javascript
// Input: <script>alert('xss')</script>
// Output: alert('xss') - HTML stripped
```

### NoSQL Injection Prevention
```javascript
// Input: {"$ne": null}
// Output: Sanitized and prevented
```

### Rate Limiting
```javascript
// Login: 5 attempts per 15 minutes
// API: 100 requests per minute
// Strict: 10 requests per minute
```

### HTML Normalization
```javascript
// Trims whitespace
// Removes null bytes
// Collapses multiple spaces
// Limits length to 10000 chars
```

## Error Responses

### Validation Error
```json
{
  "status": "error",
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email",
      "value": "invalid",
      "location": "body"
    }
  ],
  "timestamp": "2025-11-05T10:30:00.000Z"
}
```

### Rate Limit Error
```json
{
  "status": "error",
  "statusCode": 429,
  "errorCode": "RATE_LIMIT",
  "message": "Too many login attempts. Please try again in 15 minutes.",
  "timestamp": "2025-11-05T10:30:00.000Z"
}
```

## Configuration

### Environment Variables
```
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000
```

### Helmet Options
- CSP: Strict content security policy
- HSTS: 1 year max-age with preload
- X-Frame-Options: DENY (prevent clickjacking)
- X-XSS-Protection: Enabled
- Referrer-Policy: strict-origin-when-cross-origin

### Rate Limit Windows
- Auth: 15 minutes
- API: 1 minute
- Strict: 1 minute

## Best Practices

### ✅ Do's
```javascript
// 1. Always use validation schemas
router.post('/users', userValidation.create, ...);

// 2. Apply rate limiting to sensitive endpoints
router.post('/login', authLimiter, ...);

// 3. Trust sanitized input
const name = req.body.name; // Already sanitized

// 4. Validate file uploads separately
// 5. Use HTTPS in production
// 6. Keep Helmet.js updated
```

### ❌ Don'ts
```javascript
// 1. Don't skip validation
router.post('/users', asyncHandler(...)); // ❌ Missing validation

// 2. Don't expose validation errors in production
throw new Error(detailedMessage); // ❌ Information leak

// 3. Don't disable rate limiting
// 4. Don't store passwords in plain text
// 5. Don't trust user input without sanitization
```

## Testing Validation

### Test Invalid Email
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid"}'
```

### Test Weak Password
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user",
    "email": "user@example.com",
    "password": "weak",
    "confirmPassword": "weak"
  }'
```

### Test XSS Injection
```bash
curl -X POST http://localhost:5000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<script>alert(1)</script>",
    "email": "client@example.com"
  }'
# Result: <script> tags removed
```

### Test Rate Limiting
```bash
# Make 6 login attempts quickly
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "user", "password": "pass"}'
done
# 6th attempt returns 429 Too Many Requests
```

## Security Headers Explained

### Content-Security-Policy
Prevents XSS attacks by restricting resource loading:
- Only from same origin
- Inline scripts disabled
- External scripts disabled

### Strict-Transport-Security
Enforces HTTPS:
- Max age: 1 year
- Includes subdomains
- Browser preload enabled

### X-Frame-Options: DENY
Prevents clickjacking by disabling framing

### Referrer-Policy
Controls how much referrer information is shared:
- Minimal information across origins
- Full information same origin

### Permissions-Policy
Disables sensitive APIs:
- Camera, microphone, payment
- Geolocation, accelerometer
- USB, VR, etc.

## Monitoring & Logging

All requests and validations are logged:
```
logs/
├── request-2025-11-05.log    # All requests
├── error-2025-11-05.log      # Validation errors
├── warn-2025-11-05.log       # Rate limit warnings
└── info-2025-11-05.log       # Security events
```

## Summary

The security implementation provides:
- ✅ Complete input validation
- ✅ XSS & injection prevention
- ✅ Rate limiting
- ✅ Security headers
- ✅ CORS protection
- ✅ Comprehensive logging
- ✅ Production-ready security

All inputs are validated and sanitized before reaching route handlers! 🔒
