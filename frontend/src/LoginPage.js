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
      <div className="background">
        <div className="shape"></div>
        <div className="shape"></div>
      </div>
      
      <form className="login-form" onSubmit={handleSubmit}>
        <h3>CRM System</h3>
        <p className="subtitle">Sign in to your account</p>
        
        {error && (
          <div className="login-error">
            {error}
          </div>
        )}
        
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
        
        <button 
          type="submit" 
          className="signin-btn"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        
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
  );
}

export default LoginPage;
