# Authentication Token Fix - 401 Unauthorized Error Resolution

## Problem
Users were experiencing 401 (Unauthorized) errors when trying to access protected API endpoints like `/api/clients`, `/api/inventory`, etc. The error occurred because:
1. Service files were making direct `fetch()` calls without including JWT authentication tokens
2. No axios interceptors were configured to automatically add auth tokens

## Error Messages
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Error: Failed to fetch clients
```

## Root Cause
After implementing RBAC (Role-Based Access Control), all API routes were protected with authentication middleware that requires a valid JWT token in the `Authorization` header. However:
- Service files (ClientService, InventoryService, QuoteService) were using plain `fetch()` calls
- No authentication headers were being included in API requests
- Only `utils/api.js` had the auth token logic, but services weren't using it

## Solution Implemented

### 1. Configured Axios Interceptors (`services/api.js`)
Added global axios interceptors to automatically include JWT tokens in all axios-based requests:

```javascript
// Request interceptor - adds auth token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handles 401 unauthorized errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 2. Updated ClientService.js
Replaced all direct `fetch()` calls with the authenticated `api` utility from `utils/api.js`:

**Before:**
```javascript
const response = await fetch(`${API_BASE_URL}/clients`);
```

**After:**
```javascript
import api from '../utils/api';

return await api.get('/clients');
```

### 3. Added authenticatedFetch Helper (InventoryService.js & QuoteService.js)
For services that couldn't easily switch to the api utility, added a helper function:

```javascript
const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
};
```

Then replaced all `fetch()` calls with `authenticatedFetch()`.

## Files Modified

### 1. `frontend/src/services/api.js`
- ✅ Added axios request interceptor (adds Bearer token)
- ✅ Added axios response interceptor (handles 401 errors)

### 2. `frontend/src/services/ClientService.js`
- ✅ Imported `api` from `utils/api.js`
- ✅ Replaced all `fetch()` calls with `api.get()`, `api.post()`, `api.put()`, `api.delete()`
- ✅ Simplified error handling (now handled by api utility)

### 3. `frontend/src/services/InventoryService.js`
- ✅ Added `authenticatedFetch` helper function
- ✅ Replaced all 15 `fetch()` calls with `authenticatedFetch()`

### 4. `frontend/src/services/QuoteService.js`
- ✅ Added `authenticatedFetch` helper function
- ✅ Replaced all `fetch()` calls with `authenticatedFetch()`

## How Authentication Flow Works Now

```
User Login → Token Stored in localStorage
                    ↓
API Request Made → Service File Called
                    ↓
         ┌──────────┴──────────┐
         ↓                     ↓
    Axios Request         Fetch Request
         ↓                     ↓
   Interceptor Adds      authenticatedFetch
   Bearer Token          Adds Bearer Token
         ↓                     ↓
         └──────────┬──────────┘
                    ↓
            Request Sent with
        Authorization: Bearer <token>
                    ↓
         Backend Validates Token
                    ↓
         ┌──────────┴──────────┐
         ↓                     ↓
    200 Success          401 Unauthorized
    Return Data          Clear Token & 
                        Redirect to /login
```

## Testing Checklist

After the fix, verify:
- [x] Login page loads correctly
- [x] User can log in with credentials (admin/admin123)
- [x] Clients page loads without 401 errors
- [x] Inventory page loads correctly
- [x] Quote History page loads correctly
- [x] Dashboard analytics load properly
- [x] Creating/updating/deleting records works
- [x] Token expiry (after 24 hours) redirects to login
- [x] Logout button clears token and redirects to login

## Additional Notes

### Why Multiple Approaches?
- **ClientService**: Small service, easy to refactor to use `api` utility
- **InventoryService & QuoteService**: Large services with many fetch calls, added helper function to minimize changes
- **ActivityService**: Uses axios (already fixed by global interceptor)

### Token Storage
- Tokens are stored in `localStorage` with key `'token'`
- Token format: `Bearer <JWT_TOKEN>`
- Token expiry: 24 hours (configured in backend)

### Security Considerations
- ✅ Token automatically cleared on 401 errors
- ✅ User redirected to login on authentication failures
- ✅ All API routes protected with authentication middleware
- ✅ Sensitive data (password) excluded from responses

## Related Files

- Backend authentication: `backend/middleware/auth.js`
- Auth context: `frontend/src/contexts/AuthContext.js`
- Auth routes: `backend/routes/auth.js`
- API utility: `frontend/src/utils/api.js`
- Protected routes: `frontend/src/ProtectedRoute.js`

## Date
November 4, 2025
