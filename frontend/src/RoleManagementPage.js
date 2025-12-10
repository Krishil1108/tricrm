import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { FaHome, FaUsers, FaHandshake, FaBriefcase, FaCog, FaUserShield, FaEye, FaPlus, FaEdit, FaTrash, FaFolderOpen, FaFileExport, FaFileImport, FaChartBar, FaKey, FaBuilding, FaShieldAlt } from 'react-icons/fa';
import Watermark from './components/Watermark';
import './RoleManagementPage.css';
import './styles/ActionButtons.css';
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

  // Icon mapping function
  const getPermissionIcon = (iconKey) => {
    const iconMap = {
      'home': <FaHome />,
      'clients': <FaUsers />,
      'associates': <FaHandshake />,
      'finance': <FaBriefcase />,
      'settings': <FaCog />,
      'admin': <FaUserShield />,
      'view': <FaEye />,
      'create': <FaPlus />,
      'edit': <FaEdit />,
      'delete': <FaTrash />,
      'view_details': <FaEye />,
      'view_projects': <FaFolderOpen />,
      'export': <FaFileExport />,
      'import': <FaFileImport />,
      'stats_cards': <FaChartBar />,
      'configure_percentages': <FaCog />,
      'add_payment': <FaPlus />,
      'expense_distribution': <FaBriefcase />,
      'associate_distribution': <FaHandshake />,
      'viewStats': <FaChartBar />,
      'viewCompanySettings': <FaBuilding />,
      'editCompanySettings': <FaEdit />,
      'manageUsers': <FaUsers />,
      'manageRoles': <FaShieldAlt />
    };
    return iconMap[iconKey] || <FaKey />;
  };

  // Permission groups mapped to original nested structure
  const permissionGroups = [
    {
      title: 'Module Access',
      key: 'modules',
      description: 'Control access to main application modules',
      permissions: [
        { key: 'home', label: 'Home Page', description: 'Access to home page', iconKey: 'home' },
        { key: 'clients', label: 'Clients Module', description: 'Access to clients management', iconKey: 'clients' },
        { key: 'associates', label: 'Associates Module', description: 'Access to associates management', iconKey: 'associates' },
        { key: 'finance', label: 'Project Management', description: 'Access to project and finance management', iconKey: 'finance' },
        { key: 'settings', label: 'Settings', description: 'Access to settings page', iconKey: 'settings' },
        { key: 'admin', label: 'Admin Panel', description: 'Access to user and role management', iconKey: 'admin' }
      ]
    },
    {
      title: 'Client Management',
      key: 'clients',
      description: 'Client management permissions',
      permissions: [
        { key: 'view', label: 'View Clients', description: 'View client list and details', iconKey: 'view' },
        { key: 'create', label: 'Add New Client', description: 'Create new clients', iconKey: 'create' },
        { key: 'edit', label: 'Edit Client', description: 'Edit existing clients', iconKey: 'edit' },
        { key: 'delete', label: 'Delete Client', description: 'Delete clients', iconKey: 'delete' },
        { key: 'view_details', label: 'View Client Details', description: 'Access client details popup/modal', iconKey: 'view_details' },
        { key: 'view_projects', label: 'View Client Projects', description: 'Navigate to client project pages', iconKey: 'view_projects' },
        { key: 'export', label: 'Export to Excel', description: 'Export client data to Excel', iconKey: 'export' },
        { key: 'import', label: 'Import from Excel', description: 'Import clients from Excel', iconKey: 'import' },
        { key: 'stats_cards', label: 'View Summary Cards', description: 'View client statistics cards', iconKey: 'stats_cards' }
      ]
    },
    {
      title: 'Associate Management',
      key: 'associates',
      description: 'Associate management permissions',
      permissions: [
        { key: 'view', label: 'View Associates', description: 'View associate list and details', iconKey: 'view' },
        { key: 'create', label: 'Add New Associate', description: 'Create new associates', iconKey: 'create' },
        { key: 'edit', label: 'Edit Associate', description: 'Edit existing associates', iconKey: 'edit' },
        { key: 'delete', label: 'Delete Associate', description: 'Delete associates', iconKey: 'delete' },
        { key: 'export', label: 'Export to Excel', description: 'Export associate data to Excel', iconKey: 'export' },
        { key: 'import', label: 'Import from Excel', description: 'Import associates from Excel', iconKey: 'import' },
        { key: 'view_projects', label: 'View Associated Projects', description: 'Navigate to associate projects page', iconKey: 'view_projects' },
        { key: 'stats_cards', label: 'View Summary Cards', description: 'View associate statistics cards', iconKey: 'stats_cards' }
      ]
    },
    {
      title: 'Project Management',
      key: 'finance',
      description: 'Project and financial management permissions',
      permissions: [
        { key: 'view', label: 'View Projects', description: 'View project list and details', iconKey: 'view' },
        { key: 'create', label: 'Add New Project', description: 'Create new projects', iconKey: 'create' },
        { key: 'edit', label: 'Edit Project', description: 'Edit existing projects', iconKey: 'edit' },
        { key: 'delete', label: 'Delete Project', description: 'Delete projects', iconKey: 'delete' },
        { key: 'configure_percentages', label: 'Configure Percentages', description: 'Access percentage configuration settings', iconKey: 'configure_percentages' },
        { key: 'import', label: 'Import Excel', description: 'Import projects from Excel files', iconKey: 'import' },
        { key: 'export', label: 'Export Excel', description: 'Export project data to Excel', iconKey: 'export' },
        { key: 'add_payment', label: 'Add Payment', description: 'Add payment details in project form', iconKey: 'add_payment' },
        { key: 'expense_distribution', label: 'Expense Distribution', description: 'View and manage expense distributions', iconKey: 'expense_distribution' },
        { key: 'associate_distribution', label: 'Associate Distribution', description: 'View and manage associate distributions', iconKey: 'associate_distribution' },
        { key: 'viewStats', label: 'View Summary Cards', description: 'View project statistics cards', iconKey: 'stats_cards' }
      ]
    },
    {
      title: 'System Settings',
      key: 'settings',
      description: 'System settings and configuration permissions',
      permissions: [
        { key: 'view', label: 'View Settings', description: 'Access settings page', iconKey: 'view' },
        { key: 'viewCompanySettings', label: 'View Company Info', description: 'View company settings', iconKey: 'viewCompanySettings' },
        { key: 'editCompanySettings', label: 'Edit Company Info', description: 'Edit company settings', iconKey: 'editCompanySettings' },
        { key: 'manageUsers', label: 'Manage Users', description: 'Access user management', iconKey: 'manageUsers' },
        { key: 'manageRoles', label: 'Manage Roles', description: 'Access role management', iconKey: 'manageRoles' }
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
        console.log('Fetched roles:', data.roles);
        console.log('First role finance permissions:', data.roles[0]?.permissions?.finance);
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
          add_payment: role.permissions?.finance?.add_payment || false,
          expense_distribution: role.permissions?.finance?.expense_distribution || false,
          associate_distribution: role.permissions?.finance?.associate_distribution || false,
          viewStats: role.permissions?.finance?.viewStats || false
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
      console.log('Original role finance permissions:', role.permissions?.finance);
      
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
          add_payment: false,
          expense_distribution: false,
          associate_distribution: false,
          viewStats: false
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
        console.log('Save response:', data);
        console.log('Updated role permissions:', data.role?.permissions);
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
    return (
      <div className="role-management-page">
        <div className="loading-message">
          <div className="loading-spinner" aria-hidden="true"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="role-management-page">
      <Watermark />
      
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" fill="url(#shield-gradient)"/>
              <defs>
                <linearGradient id="shield-gradient" x1="2" y1="2" x2="22" y2="22">
                  <stop offset="0%" stopColor="#3b82f6"/>
                  <stop offset="100%" stopColor="#9333ea"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="header-text">
            <h1>Role Management</h1>
            <p className="header-subtitle">Define and manage user roles and permissions</p>
          </div>
        </div>
        <button className="add-role-btn" onClick={() => handleOpenModal()}>
          <FaUserShield style={{ marginRight: '8px' }} />
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
            <div className="role-header">
              <h3>{role.name}</h3>
              {role.name === 'Admin' && <span className="system-badge">SYSTEM</span>}
            </div>
            <p className="role-description">{role.description}</p>
            <div className="role-actions">
              <button 
                className="action-btn edit-btn" 
                onClick={() => handleOpenModal(role)}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <FaEdit size={14} />
                Edit
              </button>
              {role.name !== 'Admin' && (
                <button 
                  className="action-btn delete-btn" 
                  onClick={() => handleDelete(role._id)}
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <FaTrash size={14} />
                  Delete
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
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
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
                          <span className="permission-icon">{getPermissionIcon(perm.iconKey)}</span>
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
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn-submit" onClick={handleSave}>
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
