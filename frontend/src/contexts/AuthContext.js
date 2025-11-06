import React, { createContext, useState, useContext, useEffect } from 'react';

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
          const response = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
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
      const response = await fetch('http://localhost:5000/api/auth/login', {
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
        await fetch('http://localhost:5000/api/auth/logout', {
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
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
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
      const response = await fetch('http://localhost:5000/api/auth/me', {
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

  // Convenient action permission helpers
  const canView = (module) => hasPermission(module, 'view');
  const canCreate = (module) => hasPermission(module, 'create');
  const canEdit = (module) => hasPermission(module, 'edit');
  const canDelete = (module) => hasPermission(module, 'delete');
  const canDuplicate = (module) => hasPermission(module, 'duplicate');
  const canExport = (module) => hasPermission(module, 'export');
  const canImport = (module) => hasPermission(module, 'import');

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
    canView,
    canCreate,
    canEdit,
    canDelete,
    canDuplicate,
    canExport,
    canImport,
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
