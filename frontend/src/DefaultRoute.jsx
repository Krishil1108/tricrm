import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

function DefaultRoute() {
  const { isAuthenticated, loading } = useAuth();

  // Show polished loading state while checking authentication
  if (loading) {
    return (
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
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
}

export default DefaultRoute;
