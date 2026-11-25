import React from 'react';
import { useNavigate } from 'react-router-dom';

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '80vh',
      padding: '40px 20px',
      textAlign: 'center',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '48px 36px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 12px 36px rgba(0,0,0,0.06)',
        border: '1px solid #e9ecef'
      }}>
        <div style={{
          fontSize: '4.5rem',
          fontWeight: '800',
          color: '#006A4E',
          lineHeight: '1',
          marginBottom: '16px',
          letterSpacing: '-0.03em'
        }}>
          404
        </div>
        <h2 style={{
          fontSize: '1.4rem',
          fontWeight: '700',
          color: '#111827',
          marginBottom: '8px'
        }}>
          Page Not Found
        </h2>
        <p style={{
          color: '#6b7280',
          fontSize: '0.9rem',
          lineHeight: '1.6',
          marginBottom: '28px'
        }}>
          The page you are looking for doesn't exist, has been removed, or was moved to another URL.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '11px 20px',
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={() => navigate('/home')}
            style={{
              padding: '11px 24px',
              background: '#006A4E',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
