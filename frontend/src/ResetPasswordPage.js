import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiAlertTriangle, FiCheckCircle, FiKey, FiXCircle } from 'react-icons/fi';
import './ResetPasswordPage.css';
import API_BASE_URL from './config/api';

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Verify token on mount
  useEffect(() => {
    verifyToken();
  }, [token]);

  // Check password strength
  useEffect(() => {
    if (formData.newPassword) {
      const strength = calculatePasswordStrength(formData.newPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, label: '', color: '' });
    }
  }, [formData.newPassword]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-reset-token/${token}`);
      const data = await response.json();

      if (response.ok && data.data.valid) {
        setTokenValid(true);
        setUserEmail(data.data.email);
      } else {
        setTokenValid(false);
        setError('This password reset link is invalid or has expired.');
      }
    } catch (err) {
      console.error('Token verification error:', err);
      setTokenValid(false);
      setError('Failed to verify reset link. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const calculatePasswordStrength = (password) => {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const strengthMap = {
      0: { label: '', color: '' },
      1: { label: 'Very Weak', color: '#f44336' },
      2: { label: 'Weak', color: '#ff9800' },
      3: { label: 'Fair', color: '#ffc107' },
      4: { label: 'Good', color: '#8bc34a' },
      5: { label: 'Strong', color: '#4caf50' },
      6: { label: 'Very Strong', color: '#2196f3' }
    };

    return { score, ...strengthMap[score] };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      setError('Password must contain uppercase, lowercase, and numbers');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (verifying) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="loading-spinner">
            <div className="spinner-large"></div>
            <p>Verifying reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="error-container">
            <div className="error-icon-large"><FiAlertTriangle /></div>
            <h1>Invalid or Expired Link</h1>
            <p>{error}</p>
            <div className="info-box">
              <strong>Why did this happen?</strong>
              <ul>
                <li>The link may have expired (links are valid for 30 minutes)</li>
                <li>The link may have already been used</li>
                <li>The link may be incorrect or incomplete</li>
              </ul>
            </div>
            <div className="action-buttons">
              <Link to="/forgot-password" className="primary-btn">
                Request New Link
              </Link>
              <Link to="/login" className="secondary-btn">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="success-container">
            <div className="success-icon-large"><FiCheckCircle /></div>
            <h1>Password Reset Successful!</h1>
            <p>Your password has been changed successfully.</p>
            <div className="success-info">
              <p>You can now login with your new password.</p>
              <p className="redirect-notice">Redirecting to login page in 3 seconds...</p>
            </div>
            <Link to="/login" className="primary-btn">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-header">
          <div className="icon-container">
            <span className="key-icon"><FiKey /></span>
          </div>
          <h1>Create New Password</h1>
          <p className="subtitle">
            Enter a strong password for <strong>{userEmail}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="reset-password-form">
          {error && (
            <div className="error-message">
              <span className="error-icon"><FiAlertTriangle /></span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                required
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
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
              </button>
            </div>
            
            {formData.newPassword && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className="strength-fill"
                    style={{ 
                      width: `${(passwordStrength.score / 6) * 100}%`,
                      backgroundColor: passwordStrength.color
                    }}
                  ></div>
                </div>
                <span 
                  className="strength-label"
                  style={{ color: passwordStrength.color }}
                >
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              required
              disabled={loading}
            />
            {formData.confirmPassword && (
              <div className="password-match">
                {formData.newPassword === formData.confirmPassword ? (
                  <span className="match-success"><FiCheckCircle /> Passwords match</span>
                ) : (
                  <span className="match-error"><FiXCircle /> Passwords don't match</span>
                )}
              </div>
            )}
          </div>

          <div className="password-requirements">
            <strong>Password must contain:</strong>
            <ul>
              <li className={formData.newPassword.length >= 8 ? 'met' : ''}>
                At least 8 characters
              </li>
              <li className={/[A-Z]/.test(formData.newPassword) ? 'met' : ''}>
                One uppercase letter
              </li>
              <li className={/[a-z]/.test(formData.newPassword) ? 'met' : ''}>
                One lowercase letter
              </li>
              <li className={/[0-9]/.test(formData.newPassword) ? 'met' : ''}>
                One number
              </li>
            </ul>
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading || formData.newPassword !== formData.confirmPassword}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Resetting Password...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="form-footer">
          <Link to="/login" className="back-link">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
