import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

function ProtectedRoute({ children, requireModule, requireAdmin }) {
  const { isAuthenticated, loading, hasModuleAccess, isAdmin } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if admin role is required
  if (requireAdmin && !isAdmin()) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#c33', marginBottom: '10px' }}>Access Denied</h2>
        <p style={{ color: '#666' }}>You don't have permission to access this page.</p>
        <p style={{ color: '#666' }}>Administrator privileges required.</p>
      </div>
    );
  }

  // Check module access if required
  if (requireModule && !hasModuleAccess(requireModule)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#c33', marginBottom: '10px' }}>Access Denied</h2>
        <p style={{ color: '#666' }}>You don't have permission to access this module.</p>
        <p style={{ color: '#999', fontSize: '14px', marginTop: '10px' }}>
          Contact your administrator for access.
        </p>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
