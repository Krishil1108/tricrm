import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import './LoginPage.css';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      
      if (result.success) {
        navigate('/home', { replace: true });
      } else {
        setError(result.message || 'Login failed');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="ocean-background">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>

      <div className="login-container">
        <div className="login-form-section">
          <div className="login-form-content">
            <h1 className="main-heading">Let's Catch Big Dreams!</h1>
            <p className="motivational-subtitle">
              Pursue your dreams with passion and watch them come to life
            </p>

            {error && (
              <div className="login-error form-error">
                {error}
              </div>
            )}

            <form className="fishing-login-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  id="username"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="username"
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className="password-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <span
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="catch-dreams-btn"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="social-login-section">
                <div className="social-divider">
                  <span>Or continue with</span>
                </div>
                <div className="social-buttons">
                  <button type="button" className="social-btn google-btn">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </button>
                  <button type="button" className="social-btn apple-btn">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="currentColor" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.037-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                    </svg>
                    Apple
                  </button>
                </div>
              </div>

              <div className="forgot-password-link">
                <Link to="/forgot-password">Forgot your password?</Link>
              </div>

              <p className="contact-admin">
                Contact <a href="mailto:admin@company.com?subject=Account%20Access%20Request&body=Hello%20Administrator,%0D%0A%0D%0AI%20am%20requesting%20assistance%20with%20my%20CRM%20system%20account.%0D%0A%0D%0APlease%20help%20me%20with:%0D%0A%E2%98%90%20Forgot%20Password%0D%0A%E2%98%90%20Forgot%20Username%0D%0A%E2%98%90%20Account%20Access%20Issues%0D%0A%0D%0AThank%20you%20for%20your%20assistance.%0D%0A%0D%0ABest%20regards," className="admin-link">administrator</a> for account access
              </p>

              <div className="copyright-watermark">
                © 2025 Arviz Intelligence (AI). All rights reserved.
              </div>
            </form>
          </div>
        </div>

        <div className="illustration-section">
          <div className="fishing-illustration">
            <h2 className="catch-opportunities">Catch Your Biggest Opportunities</h2>
            <div className="fisherman-scene">
              <div className="fisherman">
                <div className="fisherman-body"></div>
                <div className="fishing-rod"></div>
                <div className="fishing-line"></div>
              </div>
              <div className="big-fish">
                <div className="fish-body"></div>
                <div className="fish-tail"></div>
                <div className="fish-fin"></div>
              </div>
              <div className="water-ripples"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
