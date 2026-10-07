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

  // Permission groups mapped to nested structure
  const permissionGroups = [
    {
      title: 'Module Access (Sidebar & Navigation)',
      key: 'modules',
      description: 'Control navigation access to main application pages',
      permissions: [
        { key: 'home', label: 'Home Page', description: 'Access to home page', iconKey: 'home' },
        { key: 'clients', label: 'Clients Module', description: 'Access to clients management', iconKey: 'clients' },
        { key: 'associates', label: 'Associates Module', description: 'Access to associates management', iconKey: 'associates' },
        { key: 'finance', label: 'Project Management', description: 'Access to projects management', iconKey: 'finance' },
        { key: 'finance_dashboard', label: 'Finance Dashboard', description: 'Access to finance overview dashboard', iconKey: 'finance' },
        { key: 'expenses', label: 'Expenses Module', description: 'Access to expense tracking', iconKey: 'finance' },
        { key: 'analytics', label: 'Analytics Dashboard', description: 'Access to analytics overview', iconKey: 'viewStats' },
        { key: 'settings', label: 'Settings', description: 'Access to settings page', iconKey: 'settings' },
        { key: 'admin', label: 'Admin Panel', description: 'Access to user and role management', iconKey: 'admin' }
      ]
    },
    {
      title: 'Home Page Elements',
      key: 'home',
      description: 'Home page components and figures visibility',
      permissions: [
        { key: 'view', label: 'View Home Page', description: 'Access and view the main dashboard', iconKey: 'view' },
        { key: 'stats_cards', label: 'Top Summary Stats Cards', description: 'Show/Hide top metric cards', iconKey: 'stats_cards' },
        { key: 'view_amounts', label: 'Financial Amounts & Figures', description: 'Show/Hide financial figures and revenue numbers', iconKey: 'viewStats' },
        { key: 'quick_actions', label: 'Quick Action Buttons', description: 'Show/Hide quick action shortcut buttons', iconKey: 'create' }
      ]
    },
    {
      title: 'Client Management',
      key: 'clients',
      description: 'Client list page permissions and component toggles',
      permissions: [
        { key: 'view', label: 'View Clients Page', description: 'View client list and profiles', iconKey: 'view' },
        { key: 'stats_cards', label: 'Top Summary Stats Cards', description: 'Show/Hide top client stats cards', iconKey: 'stats_cards' },
        { key: 'view_amounts', label: 'Financial Amounts & Revenue Rows', description: 'Show/Hide financial figures & project value rows', iconKey: 'viewStats' },
        { key: 'create', label: 'Add New Client Button', description: 'Create new client records', iconKey: 'create' },
        { key: 'edit', label: 'Edit Client Button', description: 'Edit existing client details', iconKey: 'edit' },
        { key: 'delete', label: 'Delete Client Button', description: 'Delete client records', iconKey: 'delete' },
        { key: 'view_details', label: 'View Details Modal Button', description: 'Open client details modal', iconKey: 'view_details' },
        { key: 'view_projects', label: 'View Client Projects Button', description: 'Navigate to client project pages', iconKey: 'view_projects' },
        { key: 'export', label: 'Export Excel Button', description: 'Export client list to Excel', iconKey: 'export' },
        { key: 'import', label: 'Import Excel Button', description: 'Import client records from Excel', iconKey: 'import' }
      ]
    },
    {
      title: 'Client Projects Sub-Page',
      key: 'client_projects',
      description: 'Individual client projects page permissions',
      permissions: [
        { key: 'view', label: 'View Page', description: 'Access client projects sub-page', iconKey: 'view' },
        { key: 'stats_cards', label: 'Top Summary Stats Cards', description: 'Show/Hide client projects summary cards', iconKey: 'stats_cards' },
        { key: 'view_amounts', label: 'Amount & Figure Columns', description: 'Show/Hide total value, received, balance amounts', iconKey: 'viewStats' },
        { key: 'create', label: 'Add Project Button', description: 'Add project directly from client page', iconKey: 'create' },
        { key: 'edit', label: 'Edit Project Button', description: 'Edit project from client view', iconKey: 'edit' },
        { key: 'delete', label: 'Delete Project Button', description: 'Delete project from client view', iconKey: 'delete' },
        { key: 'distribution_section', label: 'Distribution Section', description: 'Show/Hide distribution chart section', iconKey: 'expense_distribution' }
      ]
    },
    {
      title: 'Associate Management',
      key: 'associates',
      description: 'Associate management page permissions and toggles',
      permissions: [
        { key: 'view', label: 'View Associates Page', description: 'View associate directory and details', iconKey: 'view' },
        { key: 'stats_cards', label: 'Top Summary Stats Cards', description: 'Show/Hide associate summary cards', iconKey: 'stats_cards' },
        { key: 'view_amounts', label: 'Financial Figures & Payout Rows', description: 'Show/Hide fee, share, and payout figures', iconKey: 'viewStats' },
        { key: 'create', label: 'Add Associate Button', description: 'Add new team associate', iconKey: 'create' },
        { key: 'edit', label: 'Edit Associate Button', description: 'Edit associate profile', iconKey: 'edit' },
        { key: 'delete', label: 'Delete Associate Button', description: 'Remove associate record', iconKey: 'delete' },
        { key: 'view_projects', label: 'View Associated Projects Button', description: 'Access associate project sub-page', iconKey: 'view_projects' },
        { key: 'export', label: 'Export Excel Button', description: 'Export associate list', iconKey: 'export' },
        { key: 'import', label: 'Import Excel Button', description: 'Import associates list', iconKey: 'import' }
      ]
    },
    {
      title: 'Associate Projects Sub-Page',
      key: 'associate_projects',
      description: 'Associate project allocation sub-page permissions',
      permissions: [
        { key: 'view', label: 'View Page', description: 'Access associate project assignments page', iconKey: 'view' },
        { key: 'stats_cards', label: 'Top Summary Stats Cards', description: 'Show/Hide associate earnings stats cards', iconKey: 'stats_cards' },
        { key: 'view_amounts', label: 'Fee & Payout Amount Columns', description: 'Show/Hide fee percentages, earned, and balance rows', iconKey: 'viewStats' },
        { key: 'create', label: 'Add Project Button', description: 'Assign new project to associate', iconKey: 'create' },
        { key: 'edit', label: 'Edit Project Button', description: 'Edit associate project assignment', iconKey: 'edit' },
        { key: 'delete', label: 'Delete Project Button', description: 'Remove project assignment', iconKey: 'delete' },
        { key: 'owner_view', label: 'Owner Summary View', description: 'Show/Hide detailed owner financial breakdown', iconKey: 'viewStats' }
      ]
    },
    {
      title: 'Project & Finance Management',
      key: 'finance',
      description: 'Projects master table, financial fields, and section controls',
      permissions: [
        { key: 'view', label: 'View Projects Page', description: 'Access projects master page', iconKey: 'view' },
        { key: 'stats_cards', label: 'Top Summary Stats Cards', description: 'Show/Hide total projects & revenue metric cards', iconKey: 'stats_cards' },
        { key: 'view_amounts', label: 'Financial Figures & Amount Columns', description: 'Show/Hide project amounts, received & balance figures', iconKey: 'viewStats' },
        { key: 'create', label: 'Add New Project Button', description: 'Create new project record', iconKey: 'create' },
        { key: 'edit', label: 'Edit Project Button', description: 'Modify project details', iconKey: 'edit' },
        { key: 'delete', label: 'Delete Project Button', description: 'Delete project record', iconKey: 'delete' },
        { key: 'add_payment', label: 'Add Payment Details Button', description: 'Log payment transactions against projects', iconKey: 'add_payment' },
        { key: 'configure_percentages', label: 'Configure Percentages Button', description: 'Access associate percentage config', iconKey: 'configure_percentages' },
        { key: 'expense_distribution', label: 'Expense Distribution Section', description: 'Show/Hide expense allocation breakdown', iconKey: 'expense_distribution' },
        { key: 'associate_distribution', label: 'Associate Distribution Section', description: 'Show/Hide associate payout breakdown', iconKey: 'associate_distribution' },
        { key: 'export', label: 'Export Excel Button', description: 'Export projects data to Excel', iconKey: 'export' },
        { key: 'import', label: 'Import Excel Button', description: 'Import projects from Excel', iconKey: 'import' }
      ]
    },
    {
      title: 'Finance Overview Dashboard',
      key: 'finance_dashboard',
      description: 'Finance overview dashboard widgets and components',
      permissions: [
        { key: 'view', label: 'View Dashboard', description: 'Access finance dashboard page', iconKey: 'view' },
        { key: 'stats_cards', label: 'Top Financial Metric Cards', description: 'Show/Hide revenue, balance, and gross profit cards', iconKey: 'stats_cards' },
        { key: 'view_amounts', label: 'Financial Amount Figures', description: 'Show/Hide exact money amounts across widgets', iconKey: 'viewStats' },
        { key: 'charts', label: 'Financial Charts & Graphs', description: 'Show/Hide monthly revenue & expense graphs', iconKey: 'stats_cards' },
        { key: 'action_buttons', label: 'Action & Export Buttons', description: 'Show/Hide report action and export controls', iconKey: 'export' }
      ]
    },
    {
      title: 'Expenses Management',
      key: 'expenses',
      description: 'Expense tracker page, figure rows, and controls',
      permissions: [
        { key: 'view', label: 'View Expenses Page', description: 'Access expense log and summary', iconKey: 'view' },
        { key: 'stats_cards', label: 'Top Summary Stats Cards', description: 'Show/Hide total expense metric cards', iconKey: 'stats_cards' },
        { key: 'view_amounts', label: 'Expense Figures & Amount Rows', description: 'Show/Hide expense cost amounts and total values', iconKey: 'viewStats' },
        { key: 'create', label: 'Add Expense Button', description: 'Log new business expense', iconKey: 'create' },
        { key: 'edit', label: 'Edit Expense Button', description: 'Edit recorded expense item', iconKey: 'edit' },
        { key: 'delete', label: 'Delete Expense Button', description: 'Delete expense entry', iconKey: 'delete' },
        { key: 'export', label: 'Export Excel Button', description: 'Export expense log to Excel', iconKey: 'export' },
        { key: 'import', label: 'Import Excel Button', description: 'Import expenses from file', iconKey: 'import' }
      ]
    },
    {
      title: 'Analytics Dashboard',
      key: 'analytics',
      description: 'Analytics widgets, stats, and metric graphs',
      permissions: [
        { key: 'view', label: 'View Analytics Page', description: 'Access analytics dashboard', iconKey: 'view' },
        { key: 'stats_cards', label: 'Top Summary Cards', description: 'Show/Hide high-level metric cards', iconKey: 'stats_cards' },
        { key: 'view_amounts', label: 'Revenue & Metric Figures', description: 'Show/Hide financial figures and numerical statistics', iconKey: 'viewStats' },
        { key: 'charts', label: 'Analytics Charts & Visuals', description: 'Show/Hide analytics charts and graphs', iconKey: 'stats_cards' }
      ]
    },
    {
      title: 'System Settings & Administration',
      key: 'settings',
      description: 'System settings, company profile, user and role administration',
      permissions: [
        { key: 'view', label: 'View Settings Page', description: 'Access settings page', iconKey: 'view' },
        { key: 'viewCompanySettings', label: 'View Company Info', description: 'View company profile and details', iconKey: 'viewCompanySettings' },
        { key: 'editCompanySettings', label: 'Edit Company Info', description: 'Edit company settings and branding', iconKey: 'editCompanySettings' },
        { key: 'manageUsers', label: 'Manage Users', description: 'Access user account management', iconKey: 'manageUsers' },
        { key: 'manageRoles', label: 'Manage Roles', description: 'Access role & permission management', iconKey: 'manageRoles' }
      ]
    }
  ];

  useEffect(() => {
    fetchRoles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      
      const getVal = (mod, perm, def = false) => {
        return role.permissions?.[mod]?.[perm] !== undefined ? role.permissions[mod][perm] : def;
      };

      const initializedPermissions = {
        modules: {
          home: getVal('modules', 'home', true),
          clients: getVal('modules', 'clients', true),
          associates: getVal('modules', 'associates', true),
          finance: getVal('modules', 'finance', true),
          finance_dashboard: getVal('modules', 'finance_dashboard', true),
          expenses: getVal('modules', 'expenses', true),
          analytics: getVal('modules', 'analytics', true),
          settings: getVal('modules', 'settings', true),
          admin: getVal('modules', 'admin', false)
        },
        home: {
          view: getVal('home', 'view', true),
          stats_cards: getVal('home', 'stats_cards', true),
          view_amounts: getVal('home', 'view_amounts', true),
          quick_actions: getVal('home', 'quick_actions', true)
        },
        clients: {
          view: getVal('clients', 'view', true),
          create: getVal('clients', 'create', true),
          edit: getVal('clients', 'edit', true),
          delete: getVal('clients', 'delete', true),
          duplicate: getVal('clients', 'duplicate', true),
          export: getVal('clients', 'export', true),
          import: getVal('clients', 'import', true),
          view_details: getVal('clients', 'view_details', true),
          view_projects: getVal('clients', 'view_projects', true),
          stats_cards: getVal('clients', 'stats_cards', true),
          view_amounts: getVal('clients', 'view_amounts', true)
        },
        client_projects: {
          view: getVal('client_projects', 'view', true),
          create: getVal('client_projects', 'create', true),
          edit: getVal('client_projects', 'edit', true),
          delete: getVal('client_projects', 'delete', true),
          stats_cards: getVal('client_projects', 'stats_cards', true),
          view_amounts: getVal('client_projects', 'view_amounts', true),
          distribution_section: getVal('client_projects', 'distribution_section', true)
        },
        associates: {
          view: getVal('associates', 'view', true),
          create: getVal('associates', 'create', true),
          edit: getVal('associates', 'edit', true),
          delete: getVal('associates', 'delete', true),
          export: getVal('associates', 'export', true),
          import: getVal('associates', 'import', true),
          view_projects: getVal('associates', 'view_projects', true),
          stats_cards: getVal('associates', 'stats_cards', true),
          view_amounts: getVal('associates', 'view_amounts', true)
        },
        associate_projects: {
          view: getVal('associate_projects', 'view', true),
          create: getVal('associate_projects', 'create', true),
          edit: getVal('associate_projects', 'edit', true),
          delete: getVal('associate_projects', 'delete', true),
          stats_cards: getVal('associate_projects', 'stats_cards', true),
          view_amounts: getVal('associate_projects', 'view_amounts', true),
          owner_view: getVal('associate_projects', 'owner_view', true)
        },
        finance: {
          view: getVal('finance', 'view', true),
          create: getVal('finance', 'create', true),
          edit: getVal('finance', 'edit', true),
          delete: getVal('finance', 'delete', true),
          configure_percentages: getVal('finance', 'configure_percentages', true),
          import: getVal('finance', 'import', true),
          export: getVal('finance', 'export', true),
          add_payment: getVal('finance', 'add_payment', true),
          expense_distribution: getVal('finance', 'expense_distribution', true),
          associate_distribution: getVal('finance', 'associate_distribution', true),
          viewStats: getVal('finance', 'viewStats', true),
          stats_cards: getVal('finance', 'stats_cards', true),
          view_amounts: getVal('finance', 'view_amounts', true)
        },
        finance_dashboard: {
          view: getVal('finance_dashboard', 'view', true),
          stats_cards: getVal('finance_dashboard', 'stats_cards', true),
          view_amounts: getVal('finance_dashboard', 'view_amounts', true),
          charts: getVal('finance_dashboard', 'charts', true),
          action_buttons: getVal('finance_dashboard', 'action_buttons', true)
        },
        expenses: {
          view: getVal('expenses', 'view', true),
          create: getVal('expenses', 'create', true),
          edit: getVal('expenses', 'edit', true),
          delete: getVal('expenses', 'delete', true),
          export: getVal('expenses', 'export', true),
          import: getVal('expenses', 'import', true),
          stats_cards: getVal('expenses', 'stats_cards', true),
          view_amounts: getVal('expenses', 'view_amounts', true)
        },
        analytics: {
          view: getVal('analytics', 'view', true),
          stats_cards: getVal('analytics', 'stats_cards', true),
          view_amounts: getVal('analytics', 'view_amounts', true),
          charts: getVal('analytics', 'charts', true)
        },
        settings: {
          view: getVal('settings', 'view', true),
          viewCompanySettings: getVal('settings', 'viewCompanySettings', true),
          editCompanySettings: getVal('settings', 'editCompanySettings', true),
          manageUsers: getVal('settings', 'manageUsers', true),
          manageRoles: getVal('settings', 'manageRoles', true)
        }
      };
      
      setFormData({
        name: role.name,
        description: role.description,
        permissions: initializedPermissions
      });
    } else {
      setEditingRole(null);
      
      const defaultPermissions = {
        modules: { home: true, clients: true, associates: true, finance: true, finance_dashboard: true, expenses: true, analytics: true, settings: true, admin: false },
        home: { view: true, stats_cards: true, view_amounts: true, quick_actions: true },
        clients: { view: true, create: true, edit: true, delete: true, duplicate: true, export: true, import: true, view_details: true, view_projects: true, stats_cards: true, view_amounts: true },
        client_projects: { view: true, create: true, edit: true, delete: true, stats_cards: true, view_amounts: true, distribution_section: true },
        associates: { view: true, create: true, edit: true, delete: true, export: true, import: true, view_projects: true, stats_cards: true, view_amounts: true },
        associate_projects: { view: true, create: true, edit: true, delete: true, stats_cards: true, view_amounts: true, owner_view: true },
        finance: { view: true, create: true, edit: true, delete: true, configure_percentages: true, import: true, export: true, add_payment: true, expense_distribution: true, associate_distribution: true, viewStats: true, stats_cards: true, view_amounts: true },
        finance_dashboard: { view: true, stats_cards: true, view_amounts: true, charts: true, action_buttons: true },
        expenses: { view: true, create: true, edit: true, delete: true, export: true, import: true, stats_cards: true, view_amounts: true },
        analytics: { view: true, stats_cards: true, view_amounts: true, charts: true },
        settings: { view: true, viewCompanySettings: true, editCompanySettings: true, manageUsers: true, manageRoles: true }
      };
      
      setFormData({
        name: '',
        description: '',
        permissions: defaultPermissions
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
