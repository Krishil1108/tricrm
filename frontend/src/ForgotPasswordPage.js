import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ForgotPasswordPage.css';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setEmail('');
      } else {
        setError(data.message || 'Failed to send reset email');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="background">
        <div className="shape"></div>
        <div className="shape"></div>
      </div>
      
      <div className="forgot-password-container">
        <div className="forgot-password-header">
          <div className="icon-container">
            <span className="lock-icon">🔒</span>
          </div>
          <h1>Forgot Password?</h1>
          <p className="subtitle">
            No worries! Enter your email and we'll send you a reset link.
          </p>
        </div>

        {success ? (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h2>Check Your Email</h2>
            <p>
              If an account with that email exists, we've sent a password reset link.
              Please check your inbox and spam folder.
            </p>
            <div className="info-box">
              <strong>⏰ Link expires in 30 minutes</strong>
              <p>Make sure to reset your password before the link expires.</p>
            </div>
            <Link to="/login" className="back-to-login-btn">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="forgot-password-form">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !email}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>

            <div className="form-footer">
              <p>
                Remember your password?{' '}
                <Link to="/login" className="login-link">
                  Back to Login
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
