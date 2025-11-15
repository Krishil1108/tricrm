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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {
      modules: {},
      clients: {},
      meetings: {},
      notes: {},
      dashboard: {},
      finance: {},
      settings: {}
    }
  });

  // Define permission groups based on ACTUAL implemented features in the system
  const permissionGroups = [
    {
      title: 'Module Access',
      key: 'modules',
      description: 'Control which pages/modules users can access in the sidebar',
      permissions: [
        { key: 'home', label: 'Home', description: 'Access to home page', icon: '🏠', implemented: true },
        { key: 'clients', label: 'Clients', description: 'Access to clients module', icon: '👥', implemented: true },
        { key: 'dashboard', label: 'Dashboard', description: 'Access to dashboard and analytics', icon: '📊', implemented: true },
        { key: 'finance', label: 'Finance', description: 'Access to finance management', icon: '💰', implemented: true },
        { key: 'settings', label: 'Settings', description: 'Access to settings page', icon: '⚙️', implemented: true }
      ]
    },
    {
      title: 'Clients Module Actions',
      key: 'clients',
      description: 'Actions available in the Clients module',
      permissions: [
        { key: 'view', label: 'View', description: 'View client list and details', icon: '👁️', implemented: true },
        { key: 'create', label: 'Add', description: 'Create new clients', icon: '➕', implemented: true },
        { key: 'edit', label: 'Edit', description: 'Edit existing clients', icon: '✏️', implemented: true },
        { key: 'delete', label: 'Delete', description: 'Delete clients', icon: '🗑️', implemented: true },
        { key: 'export', label: 'Export', description: 'Export client data to Excel', icon: '📤', implemented: true },
        { key: 'import', label: 'Import', description: 'Import clients from Excel', icon: '📥', implemented: true }
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

  // Filter to show only implemented permissions
  const activePermissionGroups = permissionGroups.map(group => ({
    ...group,
    permissions: group.permissions.filter(p => p.implemented !== false)
  }));

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
        clients: role.permissions?.clients || {},
        meetings: role.permissions?.meetings || {},
        notes: role.permissions?.notes || {},
        dashboard: role.permissions?.dashboard || {},
        finance: role.permissions?.finance || {},
        settings: role.permissions?.settings || {}
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
          clients: {},
          meetings: {},
          notes: {},
          dashboard: {},
          finance: {},
          settings: {}
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
                <h3>Permissions Configuration</h3>
                <p className="permissions-help-text">
                  Configure page access and action-level permissions for this role. 
                  Users with this role will only see pages and actions they have permission to access.
                  <strong> Only showing functionalities that exist in the live system.</strong>
                </p>
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
