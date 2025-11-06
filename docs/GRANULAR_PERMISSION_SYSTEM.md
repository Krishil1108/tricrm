# Granular Permission System - Complete Guide

## Overview

This CRM application now features a **fully configurable, granular permission system** that allows administrators to control both **page-level access** and **action-level permissions** for each role. Users will only see pages they can access and only see action buttons (Add, Edit, Delete, Duplicate, Export, Import) they have permission to use.

## Table of Contents

1. [Permission Structure](#permission-structure)
2. [Role Management Interface](#role-management-interface)
3. [How It Works](#how-it-works)
4. [Implementation Details](#implementation-details)
5. [Usage Guide](#usage-guide)
6. [API Enforcement](#api-enforcement)
7. [Testing & Validation](#testing--validation)

---

## Permission Structure

### Module Access Permissions

Controls which pages/modules users can navigate to:

| Module | Description |
|--------|-------------|
| **Home** | Access to home page |
| **Clients** | Access to clients module |
| **Inventory** | Access to inventory management |
| **Dashboard** | Access to analytics dashboard |
| **Quotation** | Access to quotation creation |
| **Quote History** | Access to historical quotes |
| **Settings** | Access to settings page |

### Action-Level Permissions

Each module has granular action permissions:

#### **Clients Module**
- 👁️ **View** - View client list and details
- ➕ **Add** (create) - Create new clients
- ✏️ **Edit** - Edit existing clients
- 🗑️ **Delete** - Delete clients
- 📋 **Duplicate** - Duplicate client records
- 📤 **Export** - Export client data to Excel
- 📥 **Import** - Import client data from Excel

#### **Inventory Module**
- 👁️ **View** - View inventory items
- ➕ **Add** (create) - Add new inventory items
- ✏️ **Edit** - Edit inventory items
- 🗑️ **Delete** - Delete inventory items
- 📋 **Duplicate** - Duplicate inventory items
- 📦 **Manage Stock** - Add/consume stock quantities
- 📤 **Export** - Export inventory data
- 📥 **Import** - Import inventory data

#### **Quotation Module**
- 👁️ **View** - View quotations
- ➕ **Add** (create) - Create new quotations
- ✏️ **Edit** - Edit quotations
- 🗑️ **Delete** - Delete quotations
- 📋 **Duplicate** - Duplicate quotations
- 📄 **Generate PDF** - Generate PDF documents
- 📤 **Export** - Export quotation data

#### **Quote History Module**
- 👁️ **View** - View quote history
- ➕ **Add** - Add new quotes
- ✏️ **Edit** - Edit existing quotes
- 🗑️ **Delete** - Delete quotes
- 📋 **Duplicate** - Duplicate quotes
- 📤 **Export** - Export quote data

#### **Meeting Module**
- 👁️ **View** - View meetings
- ➕ **Add** - Create meetings
- ✏️ **Edit** - Edit meetings
- 🗑️ **Delete** - Delete meetings

#### **Notes Module**
- 👁️ **View** - View notes
- ➕ **Add** - Create notes
- ✏️ **Edit** - Edit notes
- 🗑️ **Delete** - Delete notes

#### **Dashboard Module**
- 👁️ **View Dashboard** - Access dashboard page
- 📊 **View Analytics** - View analytics data
- 📈 **View Reports** - View reports
- 📤 **Export Reports** - Export reports

#### **Settings Module**
- 👁️ **View Settings** - Access settings page
- 🏢 **View Company Settings** - View company info
- ✏️ **Edit Company Settings** - Edit company info
- 👥 **Manage Users** - User management access
- 🔐 **Manage Roles** - Role management access

---

## Role Management Interface

### Accessing Role Management

1. Login as **Admin**
2. Navigate to **Role Management** in the sidebar
3. Click **"+ Add New Role"** or **"Edit"** on existing roles

### Creating/Editing Roles

The role configuration modal shows:

**1. Basic Information**
- **Role Name**: Unique identifier for the role
- **Description**: Purpose and scope of the role

**2. Permissions Configuration**
- **Module Access Section**: Checkboxes for each page/module
- **Action Permission Sections**: Grouped by module with:
  - Icon indicators for each action
  - Descriptive labels
  - Hover tooltips with detailed explanations
  - "Toggle All" button for each group

**3. Permission Interface Features**
- ✅ Visual checkboxes with hover effects
- 📝 Descriptive text for each permission
- 🔄 "Toggle All" buttons for quick selection
- 💡 Helpful descriptions at the top
- 🎨 Color-coded permission cards

### Example: Staff Role Configuration

```
✅ Module Access:
   ✓ Home
   ✓ Clients
   ✗ Inventory
   ✗ Dashboard
   
✅ Clients Permissions:
   ✓ View - Can see client list
   ✓ Add - Can create new clients
   ✓ Edit - Can modify existing clients
   ✗ Delete - CANNOT delete clients
   ✓ Duplicate - Can duplicate records
   ✗ Export - CANNOT export data
   ✗ Import - CANNOT import data
```

**Result**: Staff users will see:
- Clients page in sidebar
- Client list with data
- "Add New Client" button
- "Edit" buttons on each client
- "Duplicate" button (if implemented)
- NO "Delete" buttons
- NO "Export" or "Import" buttons

---

## How It Works

### Frontend Permission Checks

The `AuthContext` provides helper functions:

```javascript
const { 
  canView, 
  canCreate, 
  canEdit, 
  canDelete, 
  canDuplicate,
  canExport,
  canImport 
} = useAuth();
```

### Button Visibility Example

```javascript
// Only show "Add Client" button if user has create permission
{canCreate('clients') && (
  <button onClick={() => setShowAddPopup(true)}>
    Add New Client
  </button>
)}

// Only show "Edit" button if user has edit permission
{canEdit('clients') && (
  <button onClick={() => handleEdit(client)}>Edit</button>
)}

// Only show "Delete" button if user has delete permission
{canDelete('clients') && (
  <button onClick={() => handleDelete(client._id)}>Delete</button>
)}
```

### Backend API Protection

All API routes are protected with middleware:

```javascript
// Clients route protection
router.get('/', checkPermission('clients', 'view'), async (req, res) => {
  // Return clients only if user has 'view' permission
});

router.post('/', checkPermission('clients', 'create'), async (req, res) => {
  // Create client only if user has 'create' permission
});

router.put('/:id', checkPermission('clients', 'edit'), async (req, res) => {
  // Update client only if user has 'edit' permission
});

router.delete('/:id', checkPermission('clients', 'delete'), async (req, res) => {
  // Delete client only if user has 'delete' permission
});
```

---

## Implementation Details

### Database Schema (Role Model)

```javascript
permissions: {
  modules: {
    home: Boolean,
    clients: Boolean,
    inventory: Boolean,
    dashboard: Boolean,
    quotation: Boolean,
    quoteHistory: Boolean,
    settings: Boolean
  },
  clients: {
    view: Boolean,
    create: Boolean,
    edit: Boolean,
    delete: Boolean,
    duplicate: Boolean,
    export: Boolean,
    import: Boolean
  },
  // ... other modules
}
```

### AuthContext Helper Functions

```javascript
// General permission check
hasPermission(module, action) // Returns true/false

// Convenient shortcuts
canView(module)      // Check 'view' permission
canCreate(module)    // Check 'create' permission
canEdit(module)      // Check 'edit' permission
canDelete(module)    // Check 'delete' permission
canDuplicate(module) // Check 'duplicate' permission
canExport(module)    // Check 'export' permission
canImport(module)    // Check 'import' permission
```

### Backend Middleware

```javascript
// Authentication middleware
const { authenticate, checkPermission } = require('../middleware/auth');

// Usage
router.get('/', authenticate, checkPermission('clients', 'view'), handler);
```

---

## Usage Guide

### For Administrators

#### Creating a New Role

1. Navigate to **Role Management**
2. Click **"+ Add New Role"**
3. Enter **Role Name** and **Description**
4. Configure **Module Access**:
   - Check pages the role should access
5. Configure **Action Permissions**:
   - For each module, select allowed actions
   - Use "Toggle All" for quick selection
6. Click **"Create"**

#### Editing Existing Roles

1. Navigate to **Role Management**
2. Click **"Edit"** on the role card
3. Modify permissions as needed
4. Click **"Update"**

**Note**: System roles (Admin) cannot be deleted but can be edited.

#### Assigning Roles to Users

1. Navigate to **User Management**
2. Create or edit a user
3. Select the appropriate **Role** from dropdown
4. Save changes

### For Users

Users will automatically experience the permissions system:

- **Sidebar Menu**: Only shows modules they can access
- **Action Buttons**: Only shows buttons for allowed actions
- **API Calls**: Automatically blocked if unauthorized

**Example**:
- Staff with no "delete" permission won't see delete buttons
- Staff without "export" permission won't see export buttons
- Staff without "inventory" module access won't see inventory in sidebar

---

## API Enforcement

### How API Protection Works

1. **User Logs In** → JWT token issued with role information
2. **Frontend Makes Request** → Token automatically included in headers
3. **Backend Validates Token** → Extracts user and role
4. **Middleware Checks Permission** → Verifies user has required permission
5. **Execute or Reject** → Process request or return 403 Forbidden

### Error Responses

```javascript
// 401 Unauthorized - No token or invalid token
{
  "message": "Unauthorized - No token provided"
}

// 403 Forbidden - Valid token but insufficient permissions
{
  "message": "Forbidden - Insufficient permissions"
}
```

### Protected Routes

All API routes under these endpoints require authentication and permissions:

- `/api/clients/*` - Requires clients permissions
- `/api/inventory/*` - Requires inventory permissions
- `/api/quotes/*` - Requires quotation permissions
- `/api/meetings/*` - Requires meeting permissions
- `/api/notes/*` - Requires notes permissions
- `/api/users/*` - Requires admin role
- `/api/roles/*` - Requires admin role

---

## Testing & Validation

### Test Scenarios

#### 1. Test Staff Role (Limited Permissions)

```javascript
Staff Role Permissions:
- Module Access: Home, Clients only
- Clients: view ✓, create ✓, edit ✓, delete ✗, duplicate ✓, export ✗, import ✗

Expected Behavior:
✅ Can see Home and Clients in sidebar
✅ Can view client list
✅ Can add new clients
✅ Can edit existing clients
✅ Cannot delete clients (button hidden)
✅ Cannot export data (button hidden)
✅ Cannot import data (button hidden)
❌ Cannot see Inventory, Dashboard, Settings in sidebar
```

#### 2. Test Manager Role (Moderate Permissions)

```javascript
Manager Role Permissions:
- Module Access: Home, Clients, Inventory, Dashboard
- Clients: All permissions ✓
- Inventory: view ✓, create ✓, edit ✓, delete ✗, manageStock ✓
- Dashboard: view ✓, viewAnalytics ✓

Expected Behavior:
✅ Can access multiple modules
✅ Has full client management capabilities
✅ Can manage inventory but not delete items
✅ Can view dashboard analytics
❌ Cannot access Settings or User/Role management
```

#### 3. Test Admin Role (Full Permissions)

```javascript
Admin Role Permissions:
- All modules: ✓
- All actions: ✓

Expected Behavior:
✅ Can access all modules
✅ Can perform all actions
✅ Can manage users and roles
✅ System role (cannot be deleted)
```

### Validation Checklist

- [ ] UI buttons appear/disappear based on permissions
- [ ] Sidebar menu shows only accessible modules
- [ ] API calls reject unauthorized actions with 403 error
- [ ] Role configuration saves correctly
- [ ] Permission changes reflect immediately after role update
- [ ] Admin can access everything
- [ ] Staff/custom roles respect configured permissions
- [ ] No permission = no button = no API access

---

## Default Roles

### Admin Role
- **Description**: System Administrator with full access
- **Module Access**: All modules ✓
- **Permissions**: All actions in all modules ✓
- **System Role**: Yes (cannot be deleted)

### Staff Role
- **Description**: Basic staff with limited client access
- **Module Access**: Home, Clients only
- **Clients Permissions**: 
  - view ✓, create ✓, edit ✓, duplicate ✓
  - delete ✗, export ✗, import ✗
- **System Role**: No (can be deleted)

---

## Best Practices

### For Admins

1. **Principle of Least Privilege**
   - Give users only the permissions they need
   - Start restrictive, add permissions as needed

2. **Test Before Deploying**
   - Create test roles before assigning to real users
   - Verify UI and API behavior

3. **Document Custom Roles**
   - Use clear role names (e.g., "Sales Team", "Inventory Manager")
   - Write descriptive descriptions

4. **Regular Audits**
   - Review role assignments periodically
   - Remove unnecessary permissions

### For Developers

1. **Always Check Permissions**
   ```javascript
   // In components
   {canDelete('clients') && <DeleteButton />}
   
   // In API routes
   router.delete('/:id', checkPermission('clients', 'delete'), handler);
   ```

2. **Use Helper Functions**
   - Prefer `canCreate()` over `hasPermission('clients', 'create')`
   - More readable and maintainable

3. **Handle Missing Permissions Gracefully**
   - Don't show error messages for hidden buttons
   - Provide clear 403 responses from API

---

## Troubleshooting

### Issue: Buttons not appearing after permission change

**Solution**: 
- Logout and login again to refresh token and permissions
- Check browser console for permission errors

### Issue: API returns 403 Forbidden

**Solution**:
- Verify role has the required permission in Role Management
- Check that user is assigned the correct role
- Ensure backend route has correct middleware

### Issue: User sees button but API rejects action

**Problem**: Frontend and backend permissions mismatch

**Solution**:
- Ensure button uses same permission check as API route
- Example: If button checks `canCreate('clients')`, API should use `checkPermission('clients', 'create')`

---

## Summary

This granular permission system provides:

✅ **Complete Control** - Admin can configure every detail
✅ **User-Friendly** - Clear interface with icons and descriptions
✅ **Secure** - Both frontend and backend enforcement
✅ **Flexible** - Easy to add new modules and permissions
✅ **Maintainable** - Clean code structure with helper functions
✅ **Scalable** - Works for small teams to large organizations

Users experience a clean, streamlined interface showing only what they need, while administrators have powerful tools to configure access at a granular level.

---

**Last Updated**: November 4, 2025
**Version**: 1.0
