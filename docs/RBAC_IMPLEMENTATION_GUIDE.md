# Role-Based Access Control (RBAC) Implementation Guide

## Overview

This document describes the comprehensive Role-Based Access Control (RBAC) system implemented for the CRM application. The system provides secure authentication, authorization, and granular permission management.

## Features Implemented

### 1. **Authentication System**
- Secure JWT-based authentication
- Password hashing using bcrypt
- Session management with token expiry
- Protected routes and API endpoints

### 2. **Role Management**
- Create, edit, and delete custom roles
- Assign granular permissions to roles
- System roles (Admin) that cannot be deleted
- Permission categories:
  - Module Access (Home, Clients, Inventory, Dashboard, Quotation, Quote History, Settings)
  - Feature Permissions (View, Create, Edit, Delete, Export, Import)
  - Admin Permissions (User Management, Role Management)

### 3. **User Management**
- Create, edit, and delete user accounts
- Assign roles to users
- Activate/deactivate user accounts
- Reset user passwords (Admin only)
- Track last login and user activity

### 4. **Permission-Based UI**
- Dynamic sidebar menu based on user permissions
- Hide/show features based on role permissions
- Prevent access to unauthorized routes
- API-level permission checks

## Setup Instructions

### 1. Install Dependencies

Backend:
```bash
cd backend
npm install bcryptjs jsonwebtoken express-validator
```

Frontend:
```bash
cd frontend
# No additional packages needed - using existing React dependencies
```

### 2. Initialize Database with Admin User

Run the seed script to create the default admin user and roles:

```bash
cd backend
node seedAuth.js
```

This will create:
- **Admin Role**: Full access to all modules and features
- **Staff Role**: Basic role with limited access (example)
- **Admin User**:
  - Username: `admin`
  - Password: `admin123`
  - Email: `admin@crm.com`

⚠️ **IMPORTANT**: Change the default admin password immediately after first login!

### 3. Start the Application

Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend
npm start
```

### 4. First Login

1. Navigate to `http://localhost:3000/login`
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. Change your password in Settings

## File Structure

### Backend Files Created/Modified

```
backend/
├── models/
│   ├── User.js                 # User model with authentication
│   └── Role.js                 # Role model with permissions
├── middleware/
│   └── auth.js                 # Authentication & authorization middleware
├── routes/
│   ├── auth.js                 # Login, logout, password management
│   ├── users.js                # User CRUD operations (Admin only)
│   ├── roles.js                # Role CRUD operations (Admin only)
│   ├── clients.js              # Updated with permission checks
│   └── [other routes]          # Protected with authentication
├── seedAuth.js                 # Database seeding script
└── server.js                   # Updated with auth routes
```

### Frontend Files Created/Modified

```
frontend/
├── src/
│   ├── contexts/
│   │   └── AuthContext.js      # Authentication state management
│   ├── utils/
│   │   └── api.js              # API utility with auth headers
│   ├── LoginPage.js            # Login interface
│   ├── LoginPage.css
│   ├── UserManagementPage.js   # Admin user management
│   ├── UserManagementPage.css
│   ├── RoleManagementPage.js   # Admin role management
│   ├── RoleManagementPage.css
│   ├── ProtectedRoute.js       # Route protection component
│   ├── App.js                  # Updated with auth routes
│   ├── Sidebar.js              # Updated with permission-based menu
│   └── Sidebar.css             # Updated styles
```

## Usage Guide

### For Administrators

#### 1. User Management
Access: Sidebar → User Management

**Create New User:**
1. Click "+ Add New User"
2. Fill in:
   - Full Name
   - Username (unique)
   - Email (unique)
   - Password (minimum 6 characters)
   - Role
3. Click "Create"

**Edit User:**
1. Click "Edit" next to a user
2. Modify details
3. Click "Update"

**Reset Password:**
1. Click "Reset Password" next to a user
2. Enter new password
3. Optionally require password change on next login
4. Click "Reset Password"

**Activate/Deactivate User:**
1. Click "Activate" or "Deactivate" next to a user
2. Confirm action

**Delete User:**
1. Click "Delete" next to a user
2. Confirm deletion
3. Note: Cannot delete your own account

#### 2. Role Management
Access: Sidebar → Role Management

**Create New Role:**
1. Click "+ Add New Role"
2. Enter role name and description
3. Select permissions:
   - **Module Access**: Which modules user can see
   - **Feature Permissions**: What actions user can perform
4. Click "Create"

**Edit Role:**
1. Click "Edit" on a role card
2. Modify permissions
3. Click "Update"

**Delete Role:**
1. Click "Delete" on a role card
2. Confirm deletion
3. Note: Cannot delete system roles or roles assigned to users

### For Staff Users

1. **Login**: Use credentials provided by admin
2. **Access**: Only assigned modules and features visible
3. **Change Password**: Available in user profile/settings

## Permission Structure

### Module Permissions
Controls visibility of main navigation items:
- `home` - Home page
- `clients` - Clients module
- `inventory` - Inventory module
- `dashboard` - Dashboard & Analytics
- `quotation` - Quotation creation
- `quoteHistory` - Quote history
- `settings` - Settings page

### Feature Permissions

**Clients Module:**
- `view` - View client list and details
- `create` - Add new clients
- `edit` - Modify client information
- `delete` - Remove clients
- `export` - Export client data
- `import` - Import client data

**Inventory Module:**
- `view` - View inventory
- `create` - Add items
- `edit` - Modify items
- `delete` - Remove items
- `manageStock` - Update stock levels
- `export` - Export inventory data

**Quotation Module:**
- `view` - View quotations
- `create` - Create quotations
- `edit` - Modify quotations
- `delete` - Delete quotations
- `generatePdf` - Generate PDF
- `export` - Export quotations

**Other Modules:**
- Meetings: view, create, edit, delete
- Notes: view, create, edit, delete
- Dashboard: viewAnalytics, viewReports, exportReports
- Settings: viewCompanySettings, editCompanySettings, manageUsers, manageRoles

## Security Features

1. **Password Security**
   - Passwords hashed with bcrypt (10 salt rounds)
   - Minimum 6 characters required
   - Cannot view stored passwords

2. **JWT Tokens**
   - 24-hour expiry (configurable)
   - Stored in localStorage
   - Auto-refresh on valid token

3. **API Protection**
   - All routes require authentication
   - Permission checks on every request
   - Unauthorized access returns 401/403

4. **Session Management**
   - Token validation on each request
   - Automatic logout on token expiry
   - Track last login time

5. **Input Validation**
   - Email format validation
   - Username uniqueness
   - Password strength requirements

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/change-password` - Change own password
- `GET /api/auth/permissions` - Get user permissions

### Users (Admin Only)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/reset-password` - Reset user password
- `PUT /api/users/:id/toggle-status` - Activate/deactivate user

### Roles (Admin Only)
- `GET /api/roles` - List all roles
- `GET /api/roles/:id` - Get role details
- `POST /api/roles` - Create role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role
- `GET /api/roles/:id/users` - Get users with role

## Frontend Usage

### Using Auth Context

```javascript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const {
    user,              // Current user object
    permissions,       // User permissions
    token,             // JWT token
    isAuthenticated,   // Boolean
    hasModuleAccess,   // Function to check module access
    hasPermission,     // Function to check specific permission
    isAdmin,           // Function to check if admin
    logout             // Logout function
  } = useAuth();

  // Check if user can access clients module
  if (hasModuleAccess('clients')) {
    // Show clients content
  }

  // Check if user can create clients
  if (hasPermission('clients', 'create')) {
    // Show create button
  }

  // Check if user is admin
  if (isAdmin()) {
    // Show admin features
  }
}
```

### Making Authenticated API Calls

```javascript
import api from './utils/api';

// GET request
const clients = await api.get('/clients');

// POST request
const newClient = await api.post('/clients', clientData);

// PUT request
const updated = await api.put(`/clients/${id}`, updateData);

// DELETE request
await api.delete(`/clients/${id}`);
```

### Protecting Routes

```javascript
<Route 
  path="/clients" 
  element={
    <ProtectedRoute requireModule="clients">
      <ClientsPage />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/user-management" 
  element={
    <ProtectedRoute requireAdmin>
      <UserManagementPage />
    </ProtectedRoute>
  } 
/>
```

## Best Practices

1. **Role Design**
   - Create roles based on job functions
   - Use least privilege principle
   - Review permissions regularly

2. **Password Management**
   - Enforce strong passwords
   - Regular password changes
   - Never share credentials

3. **User Lifecycle**
   - Deactivate users when they leave
   - Regular access reviews
   - Remove unused accounts

4. **Monitoring**
   - Track last login times
   - Monitor failed login attempts
   - Review user activities

## Troubleshooting

### Cannot Login
- Check username/password
- Verify account is active
- Check MongoDB connection
- Verify backend is running

### Token Expired
- Login again
- Check JWT_EXPIRE setting in backend

### Access Denied
- Verify role permissions
- Check module access settings
- Contact administrator

### Cannot Create User
- Check username uniqueness
- Verify email format
- Ensure role exists

## Environment Variables

Add to `backend/.env`:

```env
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=24h
MONGODB_URI=mongodb://localhost:27017/mern-app
```

## Production Considerations

1. **Security**
   - Change JWT_SECRET to a strong random string
   - Use HTTPS in production
   - Implement rate limiting
   - Add CORS restrictions

2. **Performance**
   - Index database fields (username, email)
   - Implement caching
   - Monitor API response times

3. **Backup**
   - Regular database backups
   - Backup user credentials
   - Document recovery procedures

## Support

For issues or questions:
1. Check this documentation
2. Review error messages in console
3. Verify permissions in Role Management
4. Contact system administrator

---

**Version:** 1.0.0  
**Last Updated:** November 4, 2025
