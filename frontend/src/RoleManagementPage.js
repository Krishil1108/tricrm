import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import './RoleManagementPage.css';
import API_BASE_URL from './config/api';

function RoleManagementPage() {
  const { token } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showHelp, setShowHelp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {
      modules: {},
      home: {},
      clients: {},
      associates: {},
      finance: {},
      dashboard: {},
      settings: {},
      admin: {},
      data_operations: {},
      ui_components: {}
    }
  });

  // Define comprehensive permission groups for all modules and components
  const permissionGroups = [
    {
      title: 'Module Access',
      key: 'modules',
      description: 'Control which pages/modules users can access in the sidebar',
      permissions: [
        { key: 'home', label: 'Home', description: 'Access to home page', icon: '🏠', implemented: true },
        { key: 'clients', label: 'Clients', description: 'Access to clients module', icon: '👥', implemented: true },
        { key: 'associates', label: 'Associates', description: 'Access to associates module', icon: '🤝', implemented: true },
        { key: 'dashboard', label: 'Dashboard', description: 'Access to dashboard and analytics', icon: '📊', implemented: true },
        { key: 'finance', label: 'Finance/Projects', description: 'Access to finance and project management', icon: '💰', implemented: true },
        { key: 'settings', label: 'Settings', description: 'Access to settings page', icon: '⚙️', implemented: true },
        { key: 'admin', label: 'Admin Panel', description: 'Access to user and role management', icon: '👨‍💼', implemented: true }
      ]
    },
    {
      title: 'Home Page Components',
      key: 'home',
      description: 'Control access to home page sections and widgets',
      permissions: [
        { key: 'view', label: 'View Page', description: 'Access to home page', icon: '👁️', implemented: true },
        { key: 'stats_cards', label: 'Statistics Cards', description: 'View overview statistics', icon: '📊', implemented: true },
        { key: 'recent_activity', label: 'Recent Activity', description: 'View recent activity feed', icon: '⚡', implemented: true },
        { key: 'quick_actions', label: 'Quick Actions', description: 'Access quick action buttons', icon: '🚀', implemented: true }
      ]
    },
    {
      title: 'Client Management Module',
      key: 'clients',
      description: 'Comprehensive control over client management functionality',
      permissions: [
        // Page Permissions
        { key: 'view_client_page', label: 'View Client Page', description: 'Access to main clients page', icon: '👁️', implemented: true },
        { key: 'view_client_projects_page', label: 'View Client Projects Page', description: 'Access to client project list page', icon: '📂', implemented: true },
        
        // Button Permissions - Client Page
        { key: 'add_new_client', label: 'Add New Client', description: 'Create new clients', icon: '➕', implemented: true },
        { key: 'edit_client', label: 'Edit Client', description: 'Edit existing clients', icon: '✏️', implemented: true },
        { key: 'delete_client', label: 'Delete Client', description: 'Delete clients', icon: '🗑️', implemented: true },
        { key: 'view_client_details', label: 'View Client Details', description: 'Access client details popup/modal', icon: '🔍', implemented: true },
        { key: 'view_client_projects', label: 'View Client Projects', description: 'Navigate to client project pages', icon: '📂', implemented: true },
        { key: 'export_clients', label: 'Export Clients to Excel', description: 'Export client data to Excel', icon: '📤', implemented: true },
        { key: 'import_clients', label: 'Import Clients from Excel', description: 'Import clients from Excel', icon: '📥', implemented: true },
        
        // Summary Components - Client Page
        { key: 'view_client_summary_cards', label: 'View Client Summary Cards', description: 'View client statistics cards', icon: '📊', implemented: true },
        
        // Button Permissions - Client Projects Page
        { key: 'add_new_project_from_client', label: 'Add New Project (Client Page)', description: 'Add project from client projects page', icon: '🆕', implemented: true },
        { key: 'back_to_clients', label: 'Back to Clients', description: 'Navigate back to clients page', icon: '🔙', implemented: true },
        { key: 'edit_project_from_client', label: 'Edit Project (Client Page)', description: 'Edit project from client projects page', icon: '✏️', implemented: true },
        
        // Summary/Sections - Client Projects Page
        { key: 'view_project_summary_cards_client', label: 'View Project Summary Cards (Client)', description: 'View project statistics on client projects page', icon: '📈', implemented: true },
        { key: 'view_distribution_section_client', label: 'View Distribution Section (Client)', description: 'View distribution details on client projects page', icon: '💰', implemented: true }
      ]
    },
    {
      title: 'Associate Management Module',
      key: 'associates',
      description: 'Comprehensive control over associate management functionality',
      permissions: [
        // Page Permissions
        { key: 'view_associates_page', label: 'View Associates Page', description: 'Access to main associates page', icon: '👁️', implemented: true },
        { key: 'view_associate_projects_page', label: 'View Associate Projects Page', description: 'Access to associate projects page', icon: '📂', implemented: true },
        
        // Button Permissions - Associate Page
        { key: 'add_new_associate', label: 'Add New Associate', description: 'Create new associates', icon: '➕', implemented: true },
        { key: 'edit_associate', label: 'Edit Associate', description: 'Edit existing associates', icon: '✏️', implemented: true },
        { key: 'delete_associate', label: 'Delete Associate', description: 'Delete associates', icon: '🗑️', implemented: true },
        { key: 'export_associates', label: 'Export Associates to Excel', description: 'Export associate data to Excel', icon: '📤', implemented: true },
        { key: 'import_associates', label: 'Import Associates from Excel', description: 'Import associates from Excel', icon: '📥', implemented: true },
        { key: 'view_associated_projects', label: 'View Associated Projects', description: 'Navigate to associate projects page', icon: '📂', implemented: true },
        
        // Summary Components - Associate Page
        { key: 'view_associate_summary_cards', label: 'View Associate Summary Cards', description: 'View associate statistics cards', icon: '📊', implemented: true },
        
        // Button Permissions - Associate Projects Page
        { key: 'add_new_project_from_associate', label: 'Add New Project (Associate Page)', description: 'Add project from associate projects page', icon: '🆕', implemented: true },
        { key: 'back_to_associates', label: 'Back to Associates', description: 'Navigate back to associates page', icon: '🔙', implemented: true },
        { key: 'edit_project_from_associate', label: 'Edit Project (Associate Page)', description: 'Edit project from associate projects page', icon: '✏️', implemented: true },
        
        // Summary Components - Associate Projects Page
        { key: 'view_summary_cards_associate_projects', label: 'View Summary Cards (Associate Projects)', description: 'View summary cards on associate projects page', icon: '📈', implemented: true },
        { key: 'view_owner_view', label: 'View Owner View', description: 'Access owner view section', icon: '👑', implemented: true },
        { key: 'view_associate_details', label: 'View Associate Details', description: 'View detailed associate information', icon: '🔍', implemented: true }
      ]
    },
    {
      title: 'Project Management Module',
      key: 'finance',
      description: 'Comprehensive control over project management and financial operations',
      permissions: [
        // Page Permissions
        { key: 'view_project_management_page', label: 'View Project Management Page', description: 'Access to main project management page', icon: '👁️', implemented: true },
        { key: 'view_add_project_form', label: 'View Add New Project Form', description: 'Access to add project form/modal', icon: '📝', implemented: true },
        
        // Button Permissions - Project Management Page
        { key: 'add_new_project', label: 'Add New Project', description: 'Create new projects', icon: '➕', implemented: true },
        { key: 'configure_percentages', label: 'Configure Percentages', description: 'Access percentage configuration settings', icon: '⚙️', implemented: true },
        { key: 'import_excel', label: 'Import Excel', description: 'Import projects from Excel files', icon: '📥', implemented: true },
        { key: 'export_excel', label: 'Export Excel', description: 'Export project data to Excel', icon: '📤', implemented: true },
        { key: 'edit_project', label: 'Edit Project', description: 'Edit existing projects', icon: '✏️', implemented: true },
        { key: 'delete_project', label: 'Delete Project', description: 'Delete projects', icon: '🗑️', implemented: true },
        { key: 'expense_distribution', label: 'Expense Distribution', description: 'View and manage expense distributions', icon: '💰', implemented: true },
        { key: 'associate_distribution', label: 'Associate Distribution', description: 'View and manage associate distributions', icon: '🤝', implemented: true },
        
        // Summary Components - Project Management Page
        { key: 'view_project_summary_cards', label: 'View Project Summary Cards', description: 'View project statistics and summary cards', icon: '📊', implemented: true },
        
        // Button Permissions - Add New Project Form
        { key: 'add_new_client_from_project', label: 'Add New Client (Project Form)', description: 'Add client from project creation form', icon: '👤', implemented: true },
        { key: 'add_payment', label: 'Add Payment', description: 'Add payment details in project form', icon: '💳', implemented: true },
        { key: 'add_associates_to_project', label: 'Add Associates to Project', description: 'Add and configure associates in project form', icon: '👥', implemented: true }
      ]
    },
    {
      title: 'Reports Module',
      key: 'reports',
      description: 'Access to various reporting and analytics features',
      permissions: [
        // Page Permissions
        { key: 'view_reports_page', label: 'View Reports Page', description: 'Access to main reports dashboard', icon: '👁️', implemented: false },
        
        // Report Generation Permissions
        { key: 'generate_client_reports', label: 'Generate Client Reports', description: 'Create and export client-related reports', icon: '📊', implemented: false },
        { key: 'generate_associate_reports', label: 'Generate Associate Reports', description: 'Create and export associate-related reports', icon: '📈', implemented: false },
        { key: 'generate_project_reports', label: 'Generate Project Reports', description: 'Create and export project financial reports', icon: '📋', implemented: false },
        { key: 'generate_payment_reports', label: 'Generate Payment Reports', description: 'Create and export payment history reports', icon: '💰', implemented: false },
        { key: 'generate_summary_reports', label: 'Generate Summary Reports', description: 'Create comprehensive summary reports', icon: '📄', implemented: false },
        
        // Export Permissions
        { key: 'export_reports_pdf', label: 'Export Reports to PDF', description: 'Export reports in PDF format', icon: '📝', implemented: false },
        { key: 'export_reports_excel', label: 'Export Reports to Excel', description: 'Export reports in Excel format', icon: '📤', implemented: false },
        
        // Advanced Reporting
        { key: 'custom_date_ranges', label: 'Custom Date Ranges', description: 'Set custom date ranges for reports', icon: '📅', implemented: false },
        { key: 'advanced_filters', label: 'Advanced Filters', description: 'Use advanced filtering options in reports', icon: '🔍', implemented: false }
      ]
    },
    {
      title: 'Profile Module',
      key: 'profile',
      description: 'User profile and account settings management',
      permissions: [
        // Page Permissions
        { key: 'view_profile_page', label: 'View Profile Page', description: 'Access to user profile page', icon: '👁️', implemented: false },
        
        // Profile Management
        { key: 'edit_personal_info', label: 'Edit Personal Information', description: 'Update personal details and contact information', icon: '✏️', implemented: false },
        { key: 'change_password', label: 'Change Password', description: 'Update account password', icon: '🔑', implemented: false },
        { key: 'upload_profile_picture', label: 'Upload Profile Picture', description: 'Change profile picture/avatar', icon: '📷', implemented: false },
        { key: 'view_activity_log', label: 'View Activity Log', description: 'Access personal activity and login history', icon: '📜', implemented: false },
        
        // Account Settings
        { key: 'notification_preferences', label: 'Notification Preferences', description: 'Configure email and system notifications', icon: '🔔', implemented: false },
        { key: 'privacy_settings', label: 'Privacy Settings', description: 'Manage privacy and data sharing preferences', icon: '🔒', implemented: false },
        { key: 'account_security', label: 'Account Security', description: 'Manage two-factor authentication and security settings', icon: '🛡️', implemented: false }
      ]
    },
    {
      title: 'User Management Module',
      key: 'user_management',
      description: 'Comprehensive control over user account management',
      permissions: [
        // Page Permissions
        { key: 'view_user_management_page', label: 'View User Management Page', description: 'Access to user management interface', icon: '👁️', implemented: true },
        
        // User Operations
        { key: 'add_new_user', label: 'Add New User', description: 'Create new user accounts', icon: '➕', implemented: true },
        { key: 'edit_user', label: 'Edit User', description: 'Modify existing user accounts', icon: '✏️', implemented: true },
        { key: 'delete_user', label: 'Delete User', description: 'Remove user accounts from system', icon: '🗑️', implemented: true },
        { key: 'view_user_details', label: 'View User Details', description: 'Access detailed user information', icon: '🔍', implemented: true },
        
        // Role and Permission Management
        { key: 'assign_roles', label: 'Assign Roles', description: 'Assign and modify user roles', icon: '👤', implemented: true },
        { key: 'manage_user_permissions', label: 'Manage User Permissions', description: 'Configure individual user permissions', icon: '🔐', implemented: true },
        
        // Account Management
        { key: 'reset_user_passwords', label: 'Reset User Passwords', description: 'Reset passwords for user accounts', icon: '🔑', implemented: true },
        { key: 'activate_deactivate_users', label: 'Activate/Deactivate Users', description: 'Enable or disable user accounts', icon: '🔴', implemented: true },
        { key: 'export_user_list', label: 'Export User List', description: 'Export user data to Excel', icon: '📤', implemented: true },
        
        // Advanced User Management
        { key: 'bulk_user_operations', label: 'Bulk User Operations', description: 'Perform bulk operations on multiple users', icon: '📦', implemented: false },
        { key: 'user_audit_log', label: 'User Audit Log', description: 'View user activity and audit logs', icon: '📋', implemented: false }
      ]
    },
    {
      title: 'Role Management Module',
      key: 'role_management',
      description: 'Advanced role and permission system configuration',
      permissions: [
        // Page Permissions
        { key: 'view_role_management_page', label: 'View Role Management Page', description: 'Access to role management interface', icon: '👁️', implemented: true },
        
        // Role Operations
        { key: 'create_new_role', label: 'Create New Role', description: 'Create custom roles with specific permissions', icon: '➕', implemented: true },
        { key: 'edit_existing_role', label: 'Edit Existing Role', description: 'Modify permissions for existing roles', icon: '✏️', implemented: true },
        { key: 'delete_custom_role', label: 'Delete Custom Role', description: 'Remove custom roles from system', icon: '🗑️', implemented: true },
        { key: 'duplicate_role', label: 'Duplicate Role', description: 'Create copy of existing role for customization', icon: '📋', implemented: false },
        
        // Permission Management
        { key: 'configure_all_permissions', label: 'Configure All Permissions', description: 'Manage all system-wide permissions', icon: '⚙️', implemented: true },
        { key: 'module_permission_control', label: 'Module Permission Control', description: 'Control access to specific application modules', icon: '🏗️', implemented: true },
        { key: 'granular_permission_setting', label: 'Granular Permission Setting', description: 'Set detailed page and button-level permissions', icon: '🔧', implemented: true },
        
        // Role Assignment and Management
        { key: 'assign_roles_to_users', label: 'Assign Roles to Users', description: 'Link roles to user accounts', icon: '🔗', implemented: true },
        { key: 'view_role_assignments', label: 'View Role Assignments', description: 'See which users have which roles', icon: '👥', implemented: false },
        { key: 'role_hierarchy_management', label: 'Role Hierarchy Management', description: 'Manage role inheritance and hierarchy', icon: '🏛️', implemented: false },
        
        // System Administration
        { key: 'manage_system_roles', label: 'Manage System Roles', description: 'Configure built-in system roles', icon: '🔒', implemented: true },
        { key: 'permission_audit', label: 'Permission Audit', description: 'Audit and review permission usage', icon: '🔍', implemented: false },
        { key: 'export_role_configuration', label: 'Export Role Configuration', description: 'Export role and permission settings', icon: '📤', implemented: false }
      ]
    },

  ];

  // Filter to show only implemented permissions and apply search/category filters
  const getFilteredPermissionGroups = () => {
    const categoryMap = {
      core: ['clients', 'associates', 'finance', 'reports', 'profile'],
      admin: ['user_management', 'role_management'],
      all: ['clients', 'associates', 'finance', 'reports', 'profile', 'user_management', 'role_management']
    };

    let filteredGroups = permissionGroups.map(group => ({
      ...group,
      permissions: group.permissions.filter(p => p.implemented !== false)
    }));

    // Apply category filter
    if (selectedCategory !== 'all') {
      const allowedGroups = categoryMap[selectedCategory] || [];
      filteredGroups = filteredGroups.filter(group => allowedGroups.includes(group.key));
    }

    // Apply search filter
    if (searchTerm) {
      filteredGroups = filteredGroups.map(group => ({
        ...group,
        permissions: group.permissions.filter(perm => 
          perm.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(group => group.permissions.length > 0);
    }

    return filteredGroups;
  };

  const activePermissionGroups = getFilteredPermissionGroups();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/roles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setRoles(data.roles);
      }
    } catch (error) {
      showMessage('error', 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleOpenModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      // Ensure all permission groups are initialized, even if not in the role object
      const initializedPermissions = {
        modules: role.permissions?.modules || {},
        home: role.permissions?.home || {},
        clients: role.permissions?.clients || {},
        associates: role.permissions?.associates || {},
        finance: role.permissions?.finance || {},
        dashboard: role.permissions?.dashboard || {},
        settings: role.permissions?.settings || {},
        admin: role.permissions?.admin || {},
        data_operations: role.permissions?.data_operations || {},
        ui_components: role.permissions?.ui_components || {}
      };
      setFormData({
        name: role.name,
        description: role.description,
        permissions: initializedPermissions
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        permissions: {
          modules: {},
          home: {},
          clients: {},
          associates: {},
          dashboard: {},
          finance: {},
          settings: {},
          admin: {},
          data_operations: {},
          ui_components: {}
        }
      });
    }
    setShowModal(true);
  };

  const handlePermissionChange = (group, permission) => {
    // Validation: Check if trying to enable a module functionality without module access
    if (group !== 'modules') {
      const moduleEnabled = formData.permissions.modules?.[group] || false;
      
      if (!moduleEnabled) {
        showMessage('warning', `Please enable access to the "${group.charAt(0).toUpperCase() + group.slice(1)}" module first before assigning its functionalities.`);
        return;
      }
    }
    
    setFormData(prev => {
      const currentValue = prev.permissions[group]?.[permission] || false;
      const newValue = !currentValue;
      
      // If disabling a module, also disable all its functionalities
      if (group === 'modules' && currentValue === true && newValue === false) {
        const updatedPermissions = { ...prev.permissions };
        
        // Clear all permissions for this module
        if (updatedPermissions[permission]) {
          updatedPermissions[permission] = {};
        }
        
        return {
          ...prev,
          permissions: {
            ...updatedPermissions,
            [group]: {
              ...(prev.permissions[group] || {}),
              [permission]: newValue
            }
          }
        };
      }
      
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [group]: {
            ...(prev.permissions[group] || {}),
            [permission]: newValue
          }
        }
      };
    });
  };

  const handleSelectAllInGroup = (group) => {
    // Validation: Check if trying to toggle functionalities without module access
    if (group !== 'modules') {
      const moduleEnabled = formData.permissions.modules?.[group] || false;
      
      if (!moduleEnabled) {
        showMessage('warning', `Please enable access to the "${group.charAt(0).toUpperCase() + group.slice(1)}" module first before assigning its functionalities.`);
        return;
      }
    }
    
    const groupPermissions = activePermissionGroups.find(g => g.key === group);
    if (!groupPermissions) return;
    
    const allPermissions = groupPermissions.permissions;
    const allSelected = allPermissions.every(p => formData.permissions[group]?.[p.key]);
    
    const newGroupPermissions = {};
    allPermissions.forEach(p => {
      newGroupPermissions[p.key] = !allSelected;
    });

    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [group]: newGroupPermissions
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = editingRole
      ? `${API_BASE_URL}/roles/${editingRole._id}`
      : `${API_BASE_URL}/roles`;

    const method = editingRole ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', data.message);
        fetchRoles();
        setShowModal(false);
      } else {
        showMessage('error', data.message);
      }
    } catch (error) {
      showMessage('error', 'An error occurred');
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/roles/${roleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', data.message);
        fetchRoles();
      } else {
        showMessage('error', data.message);
      }
    } catch (error) {
      showMessage('error', 'An error occurred');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="role-management-page">
      <div className="page-header">
        <h1>Role Management</h1>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          Add New Role
        </button>
      </div>

      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="roles-grid">
        {roles.map(role => (
          <div key={role._id} className="role-card">
            <div className="role-card-header">
              <h3>{role.name}</h3>
              {role.isSystemRole && <span className="system-badge">System</span>}
            </div>
            <p className="role-description">{role.description}</p>
            <div className="role-actions">
              <button className="btn-edit" onClick={() => handleOpenModal(role)}>Edit</button>
              {!role.isSystemRole && (
                <button className="btn-danger" onClick={() => handleDelete(role._id)}>Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRole ? 'Edit Role' : 'Add New Role'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Role Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={editingRole?.isSystemRole}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="permissions-section">
                <div className="permissions-header">
                  <h3>Permissions Configuration</h3>
                  <button
                    type="button"
                    className="help-toggle-btn"
                    onClick={() => setShowHelp(!showHelp)}
                  >
                    {showHelp ? '🔼 Hide Help' : '🔽 Show Help'}
                  </button>
                </div>
                
                {showHelp && (
                  <div className="permissions-help-panel">
                    <h4>🛡️ Permission System Guide</h4>
                    <div className="help-sections">
                      <div className="help-section">
                        <h5>📋 Module Access</h5>
                        <p>Controls which main pages users can access in the sidebar navigation.</p>
                      </div>
                      <div className="help-section">
                        <h5>⚙️ Action Permissions</h5>
                        <p>Granular control over specific actions within each module (Create, Edit, Delete, View, Export, etc.).</p>
                      </div>
                      <div className="help-section">
                        <h5>🎛️ UI Component Access</h5>
                        <p>Control visibility of buttons, dropdowns, filters, and other interface elements.</p>
                      </div>
                      <div className="help-section">
                        <h5>📊 Data Operations</h5>
                        <p>Manage access to bulk import/export, reporting, and data validation features.</p>
                      </div>
                    </div>
                    <p><strong>💡 Tip:</strong> Module access must be enabled before users can access specific actions within that module.</p>
                  </div>
                )}
                
                <p className="permissions-help-text">
                  Configure page access and action-level permissions for this role. 
                  Users with this role will only see pages and actions they have permission to access.
                  <strong> Only showing functionalities that exist in the live system.</strong>
                </p>
                
                <div className="permissions-controls">
                  <div className="search-filter-row">
                    <input
                      type="text"
                      placeholder="Search permissions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="permission-search"
                    />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="category-filter"
                    >
                      <option value="all">All Categories</option>
                      <option value="core">Core Modules</option>
                      <option value="data">Data Operations</option>
                      <option value="admin">Administration</option>
                      <option value="ui">UI Components</option>
                    </select>
                  </div>
                </div>
                {activePermissionGroups.map(group => (
                  <div key={group.key} className="permission-group">
                    <div className="permission-group-header">
                      <div className="group-title-section">
                        <h4>{group.title}</h4>
                        {group.description && <p className="group-description">{group.description}</p>}
                      </div>
                      <button
                        type="button"
                        className="btn-select-all"
                        onClick={() => handleSelectAllInGroup(group.key)}
                      >
                        Toggle All
                      </button>
                    </div>
                    <div className="permission-checkboxes">
                      {group.permissions.map(perm => {
                        const isChecked = formData.permissions[group.key]?.[perm.key] || false;
                        // Check if this is a module functionality group and if parent module is enabled
                        const isModuleFunctionality = group.key !== 'modules';
                        const moduleEnabled = isModuleFunctionality 
                          ? (formData.permissions.modules?.[group.key] || false)
                          : true; // Module access checkboxes are always enabled
                        const isDisabled = isModuleFunctionality && !moduleEnabled;
                        
                        return (
                          <label 
                            key={perm.key} 
                            className={`checkbox-label ${isDisabled ? 'disabled' : ''}`}
                            title={isDisabled 
                              ? `Enable "${group.key.charAt(0).toUpperCase() + group.key.slice(1)}" module access first`
                              : (perm.description || perm.label)
                            }
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isDisabled}
                              onChange={(e) => {
                                e.stopPropagation();
                                handlePermissionChange(group.key, perm.key);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span 
                              className="permission-label-text"
                              onClick={(e) => {
                                e.preventDefault();
                                if (!isDisabled) {
                                  handlePermissionChange(group.key, perm.key);
                                }
                              }}
                            >
                              {perm.icon && <span className="permission-icon">{perm.icon}</span>}
                              {perm.label}
                            </span>
                            {isDisabled && (
                              <span className="disabled-indicator" title="Module access required">🔒</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingRole ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleManagementPage;
