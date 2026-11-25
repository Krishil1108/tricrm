import React from 'react';
import PropTypes from 'prop-types';

/**
 * Global React Error Boundary to catch unexpected render/lifecycle errors
 * and prevent a blank white screen.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught application error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/home';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'var(--color-bg, #0f172a)',
            color: 'var(--color-text, #f8fafc)',
            fontFamily: 'var(--font-sans, sans-serif)'
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              background: 'var(--color-surface, #1e293b)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '14px',
              padding: '32px',
              textAlign: 'center',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ fontSize: '42px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '1.35rem', fontWeight: 700 }}>
              Something went wrong
            </h2>
            <p style={{ margin: '0 0 20px', color: 'var(--color-muted, #94a3b8)', fontSize: '0.95rem' }}>
              An unexpected error occurred in the interface. Your data is safe—try reloading the page.
            </p>
            {this.state.error?.message && (
              <pre
                style={{
                  textAlign: 'left',
                  fontSize: '0.78rem',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(220, 38, 38, 0.08)',
                  color: '#ef4444',
                  overflowX: 'auto',
                  marginBottom: '20px'
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border, #334155)',
                  background: 'transparent',
                  color: 'var(--color-text, inherit)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Return Home
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

export default ErrorBoundary;
