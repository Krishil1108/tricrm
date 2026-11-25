import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#0a0a0a',
    color: '#ffffff',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid rgba(255,255,255,0.12)',
      borderTopColor: '#006A4E',
      borderRadius: '50%',
      animation: 'tricrm-spin 0.8s linear infinite',
      marginBottom: '16px'
    }} />
    <style>{`@keyframes tricrm-spin { to { transform: rotate(360deg); } }`}</style>
    <div style={{ fontSize: '14px', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>
      Loading TriCRM...
    </div>
  </div>
);

const AccessDeniedScreen = ({ message, note }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '32px 20px',
    textAlign: 'center',
    background: '#f8f9fa',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  }}>
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '40px 32px',
      maxWidth: '440px',
      width: '100%',
      boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: '#fef2f2',
        color: '#dc2626',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        margin: '0 auto 20px'
      }}>
        !
      </div>
      <h2 style={{ color: '#111827', fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px' }}>
        Access Denied
      </h2>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '4px' }}>
        {message}
      </p>
      {note && (
        <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '6px' }}>
          {note}
        </p>
      )}
      <button
        type="button"
        onClick={() => { window.location.href = '/home'; }}
        style={{
          marginTop: '24px',
          padding: '10px 20px',
          background: '#0f0f0f',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '600'
        }}
      >
        Return to Home
      </button>
    </div>
  </div>
);

function ProtectedRoute({ children, requireModule, requireAdmin }) {
  const { isAuthenticated, loading, hasModuleAccess, isAdmin } = useAuth();

  // Show polished loading state while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if admin role is required
  if (requireAdmin && !isAdmin()) {
    return (
      <AccessDeniedScreen
        message="You don't have permission to access this page."
        note="Administrator privileges required."
      />
    );
  }

  // Check module access if required
  if (requireModule && !hasModuleAccess(requireModule)) {
    return (
      <AccessDeniedScreen
        message="You don't have permission to access this module."
        note="Contact your administrator for access."
      />
    );
  }

  return children;
}

export default ProtectedRoute;
