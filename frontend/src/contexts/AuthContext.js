import React, { createContext, useState, useContext, useEffect } from 'react';
import API_BASE_URL from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      const savedToken = localStorage.getItem('token');
      
      if (savedToken) {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('[Auth Debug] Loaded user data:', data.user);
            console.log('[Auth Debug] User role permissions:', data.user.role.permissions);
            setUser(data.user);
            setPermissions(data.user.role.permissions);
            setToken(savedToken);
          } else {
            // Token invalid, clear it
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (error) {
          console.error('Error loading user:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setPermissions(data.user.role.permissions);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setPermissions(null);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  // Refresh user permissions without logging out
  const refreshPermissions = async () => {
    if (!token) return { success: false, message: 'No token available' };
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setPermissions(data.user.role.permissions);
        return { success: true, message: 'Permissions refreshed' };
      } else {
        return { success: false, message: 'Failed to refresh permissions' };
      }
    } catch (error) {
      console.error('Refresh permissions error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  // Check if user has access to a module
  const hasModuleAccess = (moduleName) => {
    if (!permissions) return false;
    if (user?.role?.name === 'Admin') return true;
    return permissions.modules?.[moduleName] === true;
  };

  // Check if user has a specific permission
  const hasPermission = (module, action) => {
    if (!permissions) return false;
    if (user?.role?.name === 'Admin') return true;
    return permissions[module]?.[action] === true;
  };

  // New granular permission checker - maps granular permissions to original structure
  const hasGranularPermission = (permissionKey) => {
    if (!permissions) {
      console.log(`[Permission Check] No permissions found for key: ${permissionKey}`);
      return false;
    }
    if (user?.role?.name === 'Admin') {
      console.log(`[Permission Check] Admin user - allowing: ${permissionKey}`);
      return true;
    }
    
    // Map granular permission keys to original nested structure
    const permissionMap = {
      // Client Management permissions
      'view_client_page': () => permissions.clients?.view,
      'add_new_client': () => permissions.clients?.create,
      'edit_client': () => permissions.clients?.edit,
      'delete_client': () => permissions.clients?.delete,
      'view_client_details': () => permissions.clients?.view_details,
      'view_client_projects': () => permissions.clients?.view_projects,
      'export_clients_excel': () => permissions.clients?.export,
      'import_clients_excel': () => permissions.clients?.import,
      'view_client_summary_cards': () => permissions.clients?.stats_cards,
      
      // Associate Management permissions  
      'view_associates_page': () => permissions.associates?.view,
      'add_new_associate': () => permissions.associates?.create,
      'edit_associate': () => permissions.associates?.edit,
      'delete_associate': () => permissions.associates?.delete,
      'export_associates_excel': () => permissions.associates?.export,
      'import_associates_excel': () => permissions.associates?.import,
      'view_associate_summary_cards': () => permissions.associates?.stats_cards,
      'view_associated_projects': () => permissions.associates?.view_projects,
      
      // Project Management permissions
      'view_project_management_page': () => permissions.finance?.view,
      'add_new_project': () => permissions.finance?.create,
      'edit_project': () => permissions.finance?.edit,
      'delete_project': () => permissions.finance?.delete,
      'configure_percentages': () => permissions.finance?.configure_percentages,
      'import_excel_projects': () => permissions.finance?.import,
      'export_excel_projects': () => permissions.finance?.export,
      'add_payment': () => permissions.finance?.add_payment,
      'view_project_summary_cards': () => permissions.finance?.viewStats,
      'expense_distribution': () => permissions.finance?.expense_distribution,
      'associate_distribution': () => permissions.finance?.associate_distribution
    };
    
    const mappedPermission = permissionMap[permissionKey];
    const result = mappedPermission ? mappedPermission() : false;
    console.log(`[Permission Check] Key: ${permissionKey}, Result: ${result}, User: ${user?.username}, Role: ${user?.role?.name}`);
    console.log('[Permission Check] Current permissions:', permissions);
    return result;
  };

  // Convenient action permission helpers
  const canView = (module) => hasPermission(module, 'view');
  const canCreate = (module) => hasPermission(module, 'create');
  const canEdit = (module) => hasPermission(module, 'edit');
  const canDelete = (module) => hasPermission(module, 'delete');
  const canDuplicate = (module) => hasPermission(module, 'duplicate');
  const canExport = (module) => hasPermission(module, 'export');
  const canImport = (module) => hasPermission(module, 'import');
  
  // Enhanced permission helpers for new functionality
  const canViewProjects = (module) => hasPermission(module, 'view_projects');
  const canViewDetails = (module) => hasPermission(module, 'view_details');
  const canManagePayments = (module) => hasPermission(module, 'payment_management');
  const canConfigurePercentages = (module) => hasPermission(module, 'percentage_config');
  const canViewDistributions = (module) => hasPermission(module, 'expense_distribution') || hasPermission(module, 'associate_distribution');
  const canAccessUIComponents = (component) => hasPermission('ui_components', component);
  const canPerformDataOperations = (operation) => hasPermission('data_operations', operation);
  const canViewStats = (module) => hasPermission(module, 'stats_cards') || hasPermission(module, 'viewStats') || hasPermission('home', 'stats_cards');

  // Granular permission helpers for Client Management
  const canViewClientPage = () => hasGranularPermission('view_client_page');
  const canAddNewClient = () => hasGranularPermission('add_new_client');
  const canEditClient = () => hasGranularPermission('edit_client');
  const canDeleteClient = () => hasGranularPermission('delete_client');
  const canViewClientDetails = () => hasGranularPermission('view_client_details');
  const canViewClientProjects = () => hasGranularPermission('view_client_projects');
  const canExportClients = () => hasGranularPermission('export_clients_excel');
  const canImportClients = () => hasGranularPermission('import_clients_excel');
  const canViewClientSummaryCards = () => hasGranularPermission('view_client_summary_cards');

  // Client Projects Page permissions
  const canViewClientProjectsPage = () => hasGranularPermission('view_client_projects_list_page');
  const canAddProjectFromClient = () => hasGranularPermission('add_new_project_from_client');
  const canBackToClients = () => hasGranularPermission('back_to_clients');
  const canEditProjectFromClient = () => hasGranularPermission('edit_project_from_client');
  const canViewProjectSummaryCardsClient = () => hasGranularPermission('view_project_summary_cards_client');
  const canViewDistributionSectionClient = () => hasGranularPermission('view_distribution_section_client');

  // Granular permission helpers for Associate Management
  const canViewAssociatesPage = () => hasGranularPermission('view_associates_page');
  const canAddNewAssociate = () => hasGranularPermission('add_new_associate');
  const canEditAssociate = () => hasGranularPermission('edit_associate');
  const canDeleteAssociate = () => hasGranularPermission('delete_associate');
  const canExportAssociates = () => hasGranularPermission('export_associates_excel');
  const canImportAssociates = () => hasGranularPermission('import_associates_excel');
  const canViewAssociateSummaryCards = () => hasGranularPermission('view_associate_summary_cards');
  const canViewAssociatedProjects = () => hasGranularPermission('view_associated_projects');

  // Associate Projects Page permissions
  const canViewAssociateProjectsPage = () => hasGranularPermission('view_associate_projects_page');
  const canAddProjectFromAssociate = () => hasGranularPermission('add_new_project_from_associate');
  const canBackToAssociates = () => hasGranularPermission('back_to_associates');
  const canEditProjectFromAssociate = () => hasGranularPermission('edit_project_from_associate');
  const canViewSummaryCardsAssociate = () => hasGranularPermission('view_summary_cards_associate');
  const canViewOwnerView = () => hasGranularPermission('view_owner_view');
  const canViewAssociateDetails = () => hasGranularPermission('view_associate_details');

  // Granular permission helpers for Project Management
  const canViewProjectManagementPage = () => hasGranularPermission('view_project_management_page');
  const canAddNewProject = () => hasGranularPermission('add_new_project');
  const canEditProject = () => hasGranularPermission('edit_project');
  const canDeleteProject = () => hasGranularPermission('delete_project');
  const canConfigurePercentagesGranular = () => hasGranularPermission('configure_percentages');
  const canImportExcel = () => hasGranularPermission('import_excel_projects');
  const canExportExcel = () => hasGranularPermission('export_excel_projects');
  const canViewProjectSummaryCards = () => hasGranularPermission('view_project_summary_cards');
  const canExpenseDistribution = () => hasGranularPermission('expense_distribution');
  const canAssociateDistribution = () => hasGranularPermission('associate_distribution');

  // Add New Project Form permissions
  const canViewAddProjectForm = () => hasGranularPermission('view_add_project_form');
  const canAddClientFromProject = () => hasGranularPermission('add_new_client_from_project');
  const canAddPayment = () => hasGranularPermission('add_payment');
  const canAddAssociates = () => hasGranularPermission('add_associates');

  // Keep legacy User/Role Management (these will stay as admin-only features)
  const canViewUserManagementPage = () => isAdmin();
  const canAddNewUser = () => isAdmin();
  const canEditUser = () => isAdmin();
  const canDeleteUser = () => isAdmin();
  const canViewRoleManagementPage = () => isAdmin();

  // Check if user is admin
  const isAdmin = () => {
    return user?.role?.name === 'Admin';
  };

  const value = {
    user,
    permissions,
    token,
    loading,
    login,
    logout,
    changePassword,
    refreshPermissions,
    hasModuleAccess,
    hasPermission,
    hasGranularPermission,
    // Legacy permission helpers (kept for backward compatibility)
    canView,
    canCreate,
    canEdit,
    canDelete,
    canDuplicate,
    canExport,
    canImport,
    canViewProjects,
    canViewDetails,
    canManagePayments,
    canConfigurePercentages,
    canViewDistributions,
    canAccessUIComponents,
    canPerformDataOperations,
    canViewStats,
    // Granular Client Management permissions
    canViewClientPage,
    canAddNewClient,
    canEditClient,
    canDeleteClient,
    canViewClientDetails,
    canViewClientProjects,
    canExportClients,
    canImportClients,
    canViewClientSummaryCards,
    // Client Projects Page permissions
    canViewClientProjectsPage,
    canAddProjectFromClient,
    canBackToClients,
    canEditProjectFromClient,
    canViewProjectSummaryCardsClient,
    canViewDistributionSectionClient,
    // Granular Associate Management permissions
    canViewAssociatesPage,
    canAddNewAssociate,
    canEditAssociate,
    canDeleteAssociate,
    canExportAssociates,
    canImportAssociates,
    canViewAssociateSummaryCards,
    canViewAssociatedProjects,
    // Associate Projects Page permissions
    canViewAssociateProjectsPage,
    canAddProjectFromAssociate,
    canBackToAssociates,
    canEditProjectFromAssociate,
    canViewSummaryCardsAssociate,
    canViewOwnerView,
    canViewAssociateDetails,
    // Granular Project Management permissions
    canViewProjectManagementPage,
    canAddNewProject,
    canEditProject,
    canDeleteProject,
    canConfigurePercentagesGranular,
    canImportExcel,
    canExportExcel,
    canViewProjectSummaryCards,
    canExpenseDistribution,
    canAssociateDistribution,
    // Add New Project Form permissions
    canViewAddProjectForm,
    canAddClientFromProject,
    canAddPayment,
    canAddAssociates,
    // User/Role Management permissions (Admin only)
    canViewUserManagementPage,
    canAddNewUser,
    canEditUser,
    canDeleteUser,
    canViewRoleManagementPage,
    isAdmin,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
