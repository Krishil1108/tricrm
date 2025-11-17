import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import Watermark from './components/Watermark';
import './RoleManagementPage.css';
import API_BASE_URL from './config/api';

const RoleManagementPage = () => {
  const { token } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {}
  });

  // Permission groups mapped to original nested structure
  const permissionGroups = [
    {
      title: 'Module Access',
      key: 'modules',
      description: 'Control access to main application modules',
      permissions: [
        { key: 'home', label: 'Home Page', description: 'Access to home page', icon: '🏠' },
        { key: 'clients', label: 'Clients Module', description: 'Access to clients management', icon: '👥' },
        { key: 'associates', label: 'Associates Module', description: 'Access to associates management', icon: '🤝' },
        { key: 'finance', label: 'Project Management', description: 'Access to project and finance management', icon: '💰' },
        { key: 'dashboard', label: 'Dashboard', description: 'Access to dashboard and analytics', icon: '📊' },
        { key: 'settings', label: 'Settings', description: 'Access to settings page', icon: '⚙️' },
        { key: 'admin', label: 'Admin Panel', description: 'Access to user and role management', icon: '👨‍💼' }
      ]
    },
    {
      title: 'Client Management',
      key: 'clients',
      description: 'Client management permissions',
      permissions: [
        { key: 'view', label: 'View Clients', description: 'View client list and details', icon: '👁️' },
        { key: 'create', label: 'Add New Client', description: 'Create new clients', icon: '➕' },
        { key: 'edit', label: 'Edit Client', description: 'Edit existing clients', icon: '✏️' },
        { key: 'delete', label: 'Delete Client', description: 'Delete clients', icon: '🗑️' },
        { key: 'view_details', label: 'View Client Details', description: 'Access client details popup/modal', icon: '🔍' },
        { key: 'view_projects', label: 'View Client Projects', description: 'Navigate to client project pages', icon: '📂' },
        { key: 'export', label: 'Export to Excel', description: 'Export client data to Excel', icon: '📤' },
        { key: 'import', label: 'Import from Excel', description: 'Import clients from Excel', icon: '📥' },
        { key: 'stats_cards', label: 'View Summary Cards', description: 'View client statistics cards', icon: '📊' }
      ]
    },
    {
      title: 'Associate Management',
      key: 'associates',
      description: 'Associate management permissions',
      permissions: [
        { key: 'view', label: 'View Associates', description: 'View associate list and details', icon: '👁️' },
        { key: 'create', label: 'Add New Associate', description: 'Create new associates', icon: '➕' },
        { key: 'edit', label: 'Edit Associate', description: 'Edit existing associates', icon: '✏️' },
        { key: 'delete', label: 'Delete Associate', description: 'Delete associates', icon: '🗑️' },
        { key: 'export', label: 'Export to Excel', description: 'Export associate data to Excel', icon: '📤' },
        { key: 'import', label: 'Import from Excel', description: 'Import associates from Excel', icon: '📥' },
        { key: 'view_projects', label: 'View Associated Projects', description: 'Navigate to associate projects page', icon: '📂' },
        { key: 'stats_cards', label: 'View Summary Cards', description: 'View associate statistics cards', icon: '📊' }
      ]
    },
    {
      title: 'Project Management',
      key: 'finance',
      description: 'Project and financial management permissions',
      permissions: [
        { key: 'view', label: 'View Projects', description: 'View project list and details', icon: '👁️' },
        { key: 'create', label: 'Add New Project', description: 'Create new projects', icon: '➕' },
        { key: 'edit', label: 'Edit Project', description: 'Edit existing projects', icon: '✏️' },
        { key: 'delete', label: 'Delete Project', description: 'Delete projects', icon: '🗑️' },
        { key: 'configure_percentages', label: 'Configure Percentages', description: 'Access percentage configuration settings', icon: '⚙️' },
        { key: 'import', label: 'Import Excel', description: 'Import projects from Excel files', icon: '📥' },
        { key: 'export', label: 'Export Excel', description: 'Export project data to Excel', icon: '📤' },
        { key: 'expense_distribution', label: 'Expense Distribution', description: 'View and manage expense distributions', icon: '💰' },
        { key: 'associate_distribution', label: 'Associate Distribution', description: 'View and manage associate distributions', icon: '🤝' },
        { key: 'viewStats', label: 'View Summary Cards', description: 'View project statistics cards', icon: '📊' }
      ]
    },
    {
      title: 'Dashboard & Analytics',
      key: 'dashboard',
      description: 'Dashboard and analytics permissions',
      permissions: [
        { key: 'view', label: 'View Dashboard', description: 'Access main dashboard', icon: '👁️' },
        { key: 'viewAnalytics', label: 'View Analytics', description: 'Access analytics data', icon: '📈' },
        { key: 'viewReports', label: 'View Reports', description: 'Access reports section', icon: '📋' },
        { key: 'exportReports', label: 'Export Reports', description: 'Export dashboard reports', icon: '📤' }
      ]
    },
    {
      title: 'System Settings',
      key: 'settings',
      description: 'System settings and configuration permissions',
      permissions: [
        { key: 'view', label: 'View Settings', description: 'Access settings page', icon: '👁️' },
        { key: 'viewCompanySettings', label: 'View Company Info', description: 'View company settings', icon: '🏢' },
        { key: 'editCompanySettings', label: 'Edit Company Info', description: 'Edit company settings', icon: '✏️' },
        { key: 'manageUsers', label: 'Manage Users', description: 'Access user management', icon: '👥' },
        { key: 'manageRoles', label: 'Manage Roles', description: 'Access role management', icon: '🛡️' }
      ]
    }
  ];

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
      console.log('Editing role:', role);
      
      // Initialize permissions with nested structure, preserving existing values
      const initializedPermissions = {
        modules: {
          home: role.permissions?.modules?.home || false,
          clients: role.permissions?.modules?.clients || false,
          associates: role.permissions?.modules?.associates || false,
          finance: role.permissions?.modules?.finance || false,
          dashboard: role.permissions?.modules?.dashboard || false,
          settings: role.permissions?.modules?.settings || false,
          admin: role.permissions?.modules?.admin || false
        },
        clients: {
          view: role.permissions?.clients?.view || false,
          create: role.permissions?.clients?.create || false,
          edit: role.permissions?.clients?.edit || false,
          delete: role.permissions?.clients?.delete || false,
          view_details: role.permissions?.clients?.view_details || false,
          view_projects: role.permissions?.clients?.view_projects || false,
          export: role.permissions?.clients?.export || false,
          import: role.permissions?.clients?.import || false,
          stats_cards: role.permissions?.clients?.stats_cards || false
        },
        associates: {
          view: role.permissions?.associates?.view || false,
          create: role.permissions?.associates?.create || false,
          edit: role.permissions?.associates?.edit || false,
          delete: role.permissions?.associates?.delete || false,
          export: role.permissions?.associates?.export || false,
          import: role.permissions?.associates?.import || false,
          view_projects: role.permissions?.associates?.view_projects || false,
          stats_cards: role.permissions?.associates?.stats_cards || false
        },
        finance: {
          view: role.permissions?.finance?.view || false,
          create: role.permissions?.finance?.create || false,
          edit: role.permissions?.finance?.edit || false,
          delete: role.permissions?.finance?.delete || false,
          configure_percentages: role.permissions?.finance?.configure_percentages || false,
          import: role.permissions?.finance?.import || false,
          export: role.permissions?.finance?.export || false,
          expense_distribution: role.permissions?.finance?.expense_distribution || false,
          associate_distribution: role.permissions?.finance?.associate_distribution || false,
          viewStats: role.permissions?.finance?.viewStats || false
        },
        dashboard: {
          view: role.permissions?.dashboard?.view || false,
          viewAnalytics: role.permissions?.dashboard?.viewAnalytics || false,
          viewReports: role.permissions?.dashboard?.viewReports || false,
          exportReports: role.permissions?.dashboard?.exportReports || false
        },
        settings: {
          view: role.permissions?.settings?.view || false,
          viewCompanySettings: role.permissions?.settings?.viewCompanySettings || false,
          editCompanySettings: role.permissions?.settings?.editCompanySettings || false,
          manageUsers: role.permissions?.settings?.manageUsers || false,
          manageRoles: role.permissions?.settings?.manageRoles || false
        }
      };

      console.log('Initialized permissions:', initializedPermissions);
      
      const newFormData = {
        name: role.name,
        description: role.description,
        permissions: initializedPermissions
      };
      console.log('Setting form data:', newFormData);
      setFormData(newFormData);
    } else {
      setEditingRole(null);
      
      // Initialize empty permissions for new role with nested structure
      const emptyPermissions = {
        modules: {
          home: false,
          clients: false,
          associates: false,
          finance: false,
          dashboard: false,
          settings: false,
          admin: false
        },
        clients: {
          view: false,
          create: false,
          edit: false,
          delete: false,
          view_details: false,
          view_projects: false,
          export: false,
          import: false,
          stats_cards: false
        },
        associates: {
          view: false,
          create: false,
          edit: false,
          delete: false,
          export: false,
          import: false,
          view_projects: false,
          stats_cards: false
        },
        finance: {
          view: false,
          create: false,
          edit: false,
          delete: false,
          configure_percentages: false,
          import: false,
          export: false,
          expense_distribution: false,
          associate_distribution: false,
          viewStats: false
        },
        dashboard: {
          view: false,
          viewAnalytics: false,
          viewReports: false,
          exportReports: false
        },
        settings: {
          view: false,
          viewCompanySettings: false,
          editCompanySettings: false,
          manageUsers: false,
          manageRoles: false
        }
      };
      
      setFormData({
        name: '',
        description: '',
        permissions: emptyPermissions
      });
    }
    setShowModal(true);
  };

  // Get permission value from nested structure
  const getPermissionValue = (moduleKey, permissionKey) => {
    return formData.permissions?.[moduleKey]?.[permissionKey] || false;
  };

  // Handle permission toggle
  const handlePermissionToggle = (moduleKey, permissionKey, checked) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: {
          ...prev.permissions[moduleKey],
          [permissionKey]: checked
        }
      }
    }));
  };

  // Select all permissions in a group
  const handleSelectAllInGroup = (group) => {
    const allChecked = group.permissions.every(perm => getPermissionValue(group.key, perm.key));
    
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [group.key]: group.permissions.reduce((acc, perm) => {
          acc[perm.key] = !allChecked;
          return acc;
        }, { ...prev.permissions[group.key] })
      }
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showMessage('error', 'Role name is required');
      return;
    }

    try {
      const url = editingRole 
        ? `${API_BASE_URL}/roles/${editingRole._id}`
        : `${API_BASE_URL}/roles`;
      
      const method = editingRole ? 'PUT' : 'POST';
      
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
        showMessage('success', editingRole ? 'Role updated successfully' : 'Role created successfully');
        fetchRoles();
        setShowModal(false);
        setEditingRole(null);
        setFormData({ name: '', description: '', permissions: {} });
      } else {
        showMessage('error', data.message || 'Failed to save role');
      }
    } catch (error) {
      showMessage('error', 'Failed to save role');
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
        showMessage('success', 'Role deleted successfully');
        fetchRoles();
      } else {
        showMessage('error', data.message || 'Failed to delete role');
      }
    } catch (error) {
      showMessage('error', 'Failed to delete role');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="role-management-page">
      <Watermark />
      
      <div className="page-header">
        <h1>Role Management</h1>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          ADD NEW ROLE
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
            <div className="role-header">
              <h3>{role.name}</h3>
              {role.name === 'Admin' && <span className="system-badge">SYSTEM</span>}
            </div>
            <p className="role-description">{role.description}</p>
            <div className="role-actions">
              <button className="btn-edit" onClick={() => handleOpenModal(role)}>
                EDIT
              </button>
              {role.name !== 'Admin' && (
                <button className="btn-delete" onClick={() => handleDelete(role._id)}>
                  DELETE
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h2>{editingRole ? 'Edit Role' : 'Add New Role'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Role Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter role name"
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter role description"
                  rows="3"
                />
              </div>

              <div className="permissions-section">
                <h3>Permissions</h3>
                
                {permissionGroups.map(group => (
                  <div key={group.key} className="permission-group">
                    <div className="group-header">
                      <h4>{group.title}</h4>
                      <button
                        type="button"
                        className="btn-select-all"
                        onClick={() => handleSelectAllInGroup(group)}
                      >
                        Toggle All
                      </button>
                    </div>
                    
                    <div className="permission-grid">
                      {group.permissions.map(perm => (
                        <label key={perm.key} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={getPermissionValue(group.key, perm.key)}
                            onChange={(e) => handlePermissionToggle(group.key, perm.key, e.target.checked)}
                          />
                          <span className="permission-icon">{perm.icon}</span>
                          <div className="permission-details">
                            <span className="permission-text">{perm.label}</span>
                            <span className="permission-description">{perm.description}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSave}>
                {editingRole ? 'Update Role' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagementPage;
