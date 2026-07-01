import React, { useState } from 'react';

const Login = ({ onLoginSuccess }) => {
  const [role, setRole] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains('dark-theme')
  );

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark-theme')) {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  // Registration Request Form states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqUsername, setReqUsername] = useState('');
  const [reqPassword, setReqPassword] = useState('');
  const [reqRole, setReqRole] = useState('Student');
  const [reqError, setReqError] = useState('');
  const [reqLoading, setReqLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) {
      setError('Please select your role first.');
      return;
    }
    if (!username || !password) {
      setError('Please enter your username and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        onLoginSuccess(data);
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('Unable to connect to the server. Please check if backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccessSubmit = async (e) => {
    e.preventDefault();
    if (!reqName || !reqEmail || !reqUsername || !reqPassword || !reqRole) {
      setReqError('Please fill in all the details.');
      return;
    }

    setReqError('');
    setReqLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/requests/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: reqName,
          email: reqEmail,
          username: reqUsername,
          password: reqPassword,
          role: reqRole
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Access request submitted successfully! Please wait for Admin approval.');
        // Reset form & close modal
        setReqName('');
        setReqEmail('');
        setReqUsername('');
        setReqPassword('');
        setReqRole('Student');
        setShowRequestModal(false);
      } else {
        setReqError(data.error || 'Failed to submit registration request.');
      }
    } catch (err) {
      setReqError('Network error connecting to the registration server.');
      console.error(err);
    } finally {
      setReqLoading(false);
    }
  };

  // Reset Password states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetIdentity, setResetIdentity] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetIdentity || !resetNewPassword || !resetConfirmPassword) {
      setResetError('Please fill in all details.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetError('');
    setResetLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity: resetIdentity,
          newPassword: resetNewPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Password reset successfully! You can now log in with your new password.');
        setResetIdentity('');
        setResetNewPassword('');
        setResetConfirmPassword('');
        setShowResetModal(false);
      } else {
        setResetError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setResetError('Network error connecting to the authentication server.');
      console.error(err);
    } finally {
      setResetLoading(false);
    }
  };


  return (
    <div className="login-container">
      {/* Floating Theme Toggle Button */}
      <button 
        className="theme-toggle-btn" 
        onClick={toggleTheme} 
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 100,
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px'
        }}
        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>
      {/* Left side: College Branding */}
      <div className="login-left">
        <div className="login-logo-container">
          <svg className="login-logo-svg" viewBox="0 0 24 24">
            <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
            <path d="M22 10.5V17c0 .55-.45 1-1 1h-2v2h2c1.66 0 3-1.34 3-3v-6.5h-2z" opacity=".3" />
            <path d="M4 11.23V17c0 1.66 1.34 3 3 3h10c1.66 0 3-1.34 3-3v-5.77l-8 4.36-8-4.36z" />
          </svg>
          <h1 className="brand-title">campus<span>Flow</span></h1>
          <p>All-in-one portal solution for Students, Faculty & Administrators to manage attendance, assignments, fees, results, and timetables efficiently.</p>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="login-right">
        <div className="login-form-wrapper">
          <h2>Welcome Back!</h2>
          <p className="subtitle">Login to continue to your account</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Role selection dropdown */}
            <div className="form-group">
              <label htmlFor="role">Select Role</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <select
                  id="role"
                  className="form-input"
                  style={{ appearance: 'none', cursor: 'pointer' }}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="" disabled>Select Role</option>
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Admin">Admin</option>
                </select>
                <span className="input-icon" style={{ left: 'auto', right: '1rem', pointerEvents: 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </span>
              </div>
            </div>

            {/* Username field */}
            <div className="form-group">
              <label htmlFor="username">Enter Username / Email</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  id="username"
                  type="text"
                  placeholder="e.g. harsh, mehta, admin"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="form-group">
              <label htmlFor="password">Enter Password</label>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '2.8rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.8rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    padding: '0.2rem',
                    outline: 'none'
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? '👁️' : '🔒'}
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="login-options">
              <label className="remember-me">
                <input type="checkbox" style={{ accentColor: 'var(--accent)' }} /> Remember Me
              </label>
              <a href="#" className="forgot-password" onClick={(e) => { e.preventDefault(); setShowResetModal(true); }}>Forgot Password?</a>
            </div>

            {/* Login Button */}
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="contact-admin">
            Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setShowRequestModal(true); }}>Contact Admin / Request Access</a>
          </p>
        </div>
      </div>

      {/* Access Request Form Modal */}
      {showRequestModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Request Portal Access</h3>
              <button className="modal-close-btn" onClick={() => { setShowRequestModal(false); setReqError(''); }}>❌</button>
            </div>
            
            {reqError && <div className="error-message">{reqError}</div>}

            <form onSubmit={handleRequestAccessSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Rohit Sharma"
                  style={{ padding: '0.65rem' }} 
                  value={reqName}
                  onChange={e => setReqName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="e.g. rohit@erp.com"
                  style={{ padding: '0.65rem' }} 
                  value={reqEmail}
                  onChange={e => setReqEmail(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                  <label>Username</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Username"
                    style={{ padding: '0.65rem' }} 
                    value={reqUsername}
                    onChange={e => setReqUsername(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                  <label>Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Password"
                    style={{ padding: '0.65rem' }} 
                    value={reqPassword}
                    onChange={e => setReqPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Requested Role</label>
                <select 
                  className="form-input" 
                  style={{ appearance: 'none', padding: '0.65rem' }}
                  value={reqRole}
                  onChange={e => setReqRole(e.target.value)}
                >
                  <option value="Student">Student Portal</option>
                  <option value="Faculty">Faculty Portal</option>
                </select>
              </div>

              <div className="modal-buttons">
                <button type="button" className="btn-secondary" onClick={() => { setShowRequestModal(false); setReqError(''); }} disabled={reqLoading}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={reqLoading}>
                  {reqLoading ? 'Submitting Request...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Reset Account Password</h3>
              <button className="modal-close-btn" onClick={() => { setShowResetModal(false); setResetError(''); }}>❌</button>
            </div>

            {resetError && <div className="error-message">{resetError}</div>}

            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="form-group">
                <label>Username or Email Address</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter registered username/email"
                  style={{ padding: '0.65rem' }} 
                  value={resetIdentity}
                  onChange={e => setResetIdentity(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter new password"
                  style={{ padding: '0.65rem' }} 
                  value={resetNewPassword}
                  onChange={e => setResetNewPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Confirm new password"
                  style={{ padding: '0.65rem' }} 
                  value={resetConfirmPassword}
                  onChange={e => setResetConfirmPassword(e.target.value)}
                />
              </div>

              <div className="modal-buttons">
                <button type="button" className="btn-secondary" onClick={() => { setShowResetModal(false); setResetError(''); }} disabled={resetLoading}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={resetLoading}>
                  {resetLoading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
