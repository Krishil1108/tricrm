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
      title: 'Clients Module',
      key: 'clients',
      description: 'Fine-grained control over clients module functionality',
      permissions: [
        { key: 'view', label: 'View Clients', description: 'View client list and details', icon: '👁️', implemented: true },
        { key: 'create', label: 'Add Clients', description: 'Create new clients', icon: '➕', implemented: true },
        { key: 'edit', label: 'Edit Clients', description: 'Edit existing clients', icon: '✏️', implemented: true },
        { key: 'delete', label: 'Delete Clients', description: 'Delete clients', icon: '🗑️', implemented: true },
        { key: 'export', label: 'Export Data', description: 'Export client data to Excel', icon: '📤', implemented: true },
        { key: 'import', label: 'Import Data', description: 'Import clients from Excel', icon: '📥', implemented: true },
        { key: 'duplicate', label: 'Duplicate Clients', description: 'Create duplicates of existing clients', icon: '📋', implemented: true },
        { key: 'view_details', label: 'View Client Details', description: 'Access detailed client information popup', icon: '🔍', implemented: true },
        { key: 'view_projects', label: 'View Client Projects', description: 'Navigate to client project pages', icon: '📂', implemented: true },
        { key: 'search_filter', label: 'Search & Filter', description: 'Use search and filtering options', icon: '🔎', implemented: true },
        { key: 'status_management', label: 'Status Management', description: 'Change client status (Active/Inactive)', icon: '🔄', implemented: true }
      ]
    },
    {
      title: 'Associates Module',
      key: 'associates',
      description: 'Control access to associates management features',
      permissions: [
        { key: 'view', label: 'View Associates', description: 'View associates list and details', icon: '👁️', implemented: true },
        { key: 'create', label: 'Add Associates', description: 'Create new associates', icon: '➕', implemented: true },
        { key: 'edit', label: 'Edit Associates', description: 'Edit existing associates', icon: '✏️', implemented: true },
        { key: 'delete', label: 'Delete Associates', description: 'Delete associates', icon: '🗑️', implemented: true },
        { key: 'export', label: 'Export Data', description: 'Export associate data', icon: '📤', implemented: true },
        { key: 'import', label: 'Import Data', description: 'Import associates from Excel', icon: '📥', implemented: true },
        { key: 'view_projects', label: 'View Associate Projects', description: 'Navigate to associate project pages', icon: '📂', implemented: true },
        { key: 'payment_details', label: 'Payment Details', description: 'View and manage associate payments', icon: '💳', implemented: true },
        { key: 'percentage_config', label: 'Percentage Configuration', description: 'Configure associate percentage shares', icon: '📊', implemented: true }
      ]
    },
    {
      title: 'Finance/Projects Module',
      key: 'finance',
      description: 'Comprehensive control over finance and project management',
      permissions: [
        { key: 'view', label: 'View Projects', description: 'View project list and details', icon: '👁️', implemented: true },
        { key: 'create', label: 'Add Projects', description: 'Create new projects', icon: '➕', implemented: true },
        { key: 'edit', label: 'Edit Projects', description: 'Edit existing projects', icon: '✏️', implemented: true },
        { key: 'delete', label: 'Delete Projects', description: 'Delete projects', icon: '🗑️', implemented: true },
        { key: 'export', label: 'Export Data', description: 'Export project data to Excel', icon: '📤', implemented: true },
        { key: 'import', label: 'Import Data', description: 'Import projects from Excel', icon: '📥', implemented: true },
        { key: 'expense_distribution', label: 'Expense Distribution', description: 'View and manage expense distributions', icon: '💰', implemented: true },
        { key: 'associate_distribution', label: 'Associate Distribution', description: 'View and manage associate distributions', icon: '🤝', implemented: true },
        { key: 'payment_management', label: 'Payment Management', description: 'Add and manage project payments', icon: '💳', implemented: true },
        { key: 'percentage_config', label: 'Percentage Configuration', description: 'Configure project percentage settings', icon: '⚙️', implemented: true },
        { key: 'financial_reports', label: 'Financial Reports', description: 'Access to financial reporting features', icon: '📊', implemented: true },
        { key: 'project_status', label: 'Project Status Management', description: 'Change project status (Active/Completed)', icon: '🔄', implemented: true }
      ]
    },
    {
      title: 'Dashboard Module',
      key: 'dashboard',
      description: 'Control access to dashboard analytics and insights',
      permissions: [
        { key: 'view', label: 'View Dashboard', description: 'Access to main dashboard', icon: '👁️', implemented: true },
        { key: 'financial_overview', label: 'Financial Overview', description: 'View financial statistics and charts', icon: '💹', implemented: true },
        { key: 'project_analytics', label: 'Project Analytics', description: 'View project progress and analytics', icon: '📈', implemented: true },
        { key: 'client_reports', label: 'Client Reports', description: 'Access client-related reports and metrics', icon: '👥', implemented: true },
        { key: 'associate_reports', label: 'Associate Reports', description: 'View associate performance reports', icon: '🤝', implemented: true },
        { key: 'export_reports', label: 'Export Reports', description: 'Export dashboard reports', icon: '📤', implemented: true },
        { key: 'date_filters', label: 'Date Filtering', description: 'Use date range filters on dashboard', icon: '📅', implemented: true },
        { key: 'drill_down', label: 'Drill Down Analysis', description: 'Access detailed analytics and breakdowns', icon: '🔍', implemented: true }
      ]
    },
    {
      title: 'Settings Module',
      key: 'settings',
      description: 'Control access to system settings and configurations',
      permissions: [
        { key: 'view', label: 'View Settings', description: 'Access to settings page', icon: '👁️', implemented: true },
        { key: 'profile_settings', label: 'Profile Settings', description: 'Manage personal profile settings', icon: '👤', implemented: true },
        { key: 'system_settings', label: 'System Settings', description: 'Configure system-wide settings', icon: '⚙️', implemented: true },
        { key: 'notification_settings', label: 'Notification Settings', description: 'Manage notification preferences', icon: '🔔', implemented: true },
        { key: 'theme_settings', label: 'Theme Settings', description: 'Change application theme and appearance', icon: '🎨', implemented: true },
        { key: 'data_settings', label: 'Data Settings', description: 'Configure data retention and backup settings', icon: '💾', implemented: true },
        { key: 'integration_settings', label: 'Integration Settings', description: 'Manage third-party integrations', icon: '🔗', implemented: true }
      ]
    },
    {
      title: 'Administration',
      key: 'admin',
      description: 'Administrative functions and user management',
      permissions: [
        { key: 'view', label: 'View Admin Panel', description: 'Access to administration area', icon: '👁️', implemented: true },
        { key: 'user_management', label: 'User Management', description: 'Manage system users', icon: '👥', implemented: true },
        { key: 'role_management', label: 'Role Management', description: 'Create and manage user roles', icon: '🛡️', implemented: true },
        { key: 'system_logs', label: 'System Logs', description: 'View system activity logs', icon: '📝', implemented: true },
        { key: 'backup_restore', label: 'Backup & Restore', description: 'Manage system backups', icon: '💾', implemented: true },
        { key: 'security_settings', label: 'Security Settings', description: 'Configure security policies', icon: '🔒', implemented: true }
      ]
    },
    {
      title: 'Data Export/Import',
      key: 'data_operations',
      description: 'Control over data import/export operations across all modules',
      permissions: [
        { key: 'bulk_export', label: 'Bulk Data Export', description: 'Export large datasets across modules', icon: '📤', implemented: true },
        { key: 'bulk_import', label: 'Bulk Data Import', description: 'Import large datasets across modules', icon: '📥', implemented: true },
        { key: 'data_validation', label: 'Data Validation', description: 'Validate imported data before processing', icon: '✅', implemented: true },
        { key: 'custom_reports', label: 'Custom Reports', description: 'Generate custom data reports', icon: '📊', implemented: true }
      ]
    },
    {
      title: 'UI Components Access',
      key: 'ui_components',
      description: 'Fine-grained control over UI elements and actions',
      permissions: [
        { key: 'action_buttons', label: 'Action Buttons', description: 'Access to Edit, Delete, and other action buttons', icon: '🔘', implemented: true },
        { key: 'dropdown_menus', label: 'Dropdown Menus', description: 'Access to three-dots and other dropdown menus', icon: '📋', implemented: true },
        { key: 'status_badges', label: 'Status Badges', description: 'View and interact with status indicators', icon: '🏷️', implemented: true },
        { key: 'pagination_controls', label: 'Pagination Controls', description: 'Use pagination and page size controls', icon: '📄', implemented: true },
        { key: 'sorting_columns', label: 'Column Sorting', description: 'Sort table columns', icon: '🔀', implemented: true },
        { key: 'advanced_filters', label: 'Advanced Filters', description: 'Access advanced filtering options', icon: '🎛️', implemented: true }
      ]
    },
    {
      title: 'Dashboard Module Actions',
      key: 'dashboard',
      description: 'Actions available in the Dashboard module',
      permissions: [
        { key: 'view', label: 'View Dashboard', description: 'Access dashboard page', icon: '👁️', implemented: true },
        { key: 'viewAnalytics', label: 'View Analytics', description: 'View analytics data', icon: '📊', implemented: true },
        { key: 'viewReports', label: 'View Reports', description: 'View reports', icon: '📈', implemented: true }
      ]
    },
    {
      title: 'Finance Module Actions',
      key: 'finance',
      description: 'Actions available in the Finance module',
      permissions: [
        { key: 'view', label: 'View', description: 'View finance data', icon: '👁️', implemented: true },
        { key: 'create', label: 'Add', description: 'Create new finance entries', icon: '➕', implemented: true },
        { key: 'edit', label: 'Edit', description: 'Edit finance entries', icon: '✏️', implemented: true },
        { key: 'delete', label: 'Delete', description: 'Delete finance entries', icon: '🗑️', implemented: true },
        { key: 'import', label: 'Import', description: 'Import data from Excel', icon: '📥', implemented: true },
        { key: 'export', label: 'Export', description: 'Export to Excel', icon: '📤', implemented: true },
        { key: 'viewStats', label: 'View Statistics', description: 'View financial statistics', icon: '📊', implemented: true }
      ]
    },
    {
      title: 'Settings Module Actions',
      key: 'settings',
      description: 'Actions available in the Settings module',
      permissions: [
        { key: 'view', label: 'View Settings', description: 'Access settings page', icon: '👁️', implemented: true },
        { key: 'viewCompanySettings', label: 'View Company Info', description: 'View company settings', icon: '🏢', implemented: true },
        { key: 'editCompanySettings', label: 'Edit Company Info', description: 'Edit company settings', icon: '✏️', implemented: true },
        { key: 'manageUsers', label: 'Manage Users', description: 'User management access', icon: '👥', implemented: true },
        { key: 'manageRoles', label: 'Manage Roles', description: 'Role management access', icon: '🔐', implemented: true }
      ]
    }
  ];

  // Filter to show only implemented permissions and apply search/category filters
  const getFilteredPermissionGroups = () => {
    const categoryMap = {
      core: ['modules', 'home', 'clients', 'associates', 'finance', 'dashboard', 'settings'],
      data: ['data_operations'],
      admin: ['admin'],
      ui: ['ui_components']
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
